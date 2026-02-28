import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── types ────────────────────────────────────────────────────────────────

interface ProductChange {
  type: "INSERT" | "UPDATE" | "DELETE" | "PROMOTION_CREATED" | "PROMOTION_UPDATED" | "PROMOTION_REMOVED";
  product_id: string;
  product_data?: Record<string, unknown>;
  old_data?: Record<string, unknown>;
  promotion?: {
    promotion_price: number;
    start_date: string;
    end_date: string;
  };
}

interface ExternalPayload {
  action?: "create" | "update" | "delete";
  product_id?: string;
  promotional_price?: number;
  original_price?: number;
  start_date?: string;
  end_date?: string;
  event?: string;
  product?: Record<string, unknown>;
}

// ── payload builder ──────────────────────────────────────────────────────

function buildExternalPayload(payload: ProductChange): ExternalPayload {
  const { type } = payload;
  console.log("[notify-product-change] Building payload for type:", type);

  // Promotions → external ERP format
  if (type === "PROMOTION_CREATED") {
    return {
      action: "create",
      product_id: payload.product_id,
      promotional_price: payload.promotion?.promotion_price,
      original_price: (payload.product_data?.price as number) ?? undefined,
      start_date: payload.promotion?.start_date,
      end_date: payload.promotion?.end_date,
    };
  }
  if (type === "PROMOTION_UPDATED") {
    return {
      action: "update",
      product_id: payload.product_id,
      promotional_price: payload.promotion?.promotion_price,
      original_price: (payload.product_data?.price as number) ?? undefined,
      start_date: payload.promotion?.start_date,
      end_date: payload.promotion?.end_date,
    };
  }
  if (type === "PROMOTION_REMOVED") {
    return { action: "delete", product_id: payload.product_id };
  }

  // Products → product-sync format
  const eventName = type === "INSERT" ? "created" : type === "DELETE" ? "deleted" : "updated";
  const d = payload.product_data ?? {};

  return {
    event: eventName,
    product: {
      id: payload.product_id,
      name: (d.name as string) || "",
      price: (d.price as number) || 0,
      available: (d.active as boolean) ?? (d.available as boolean) ?? true,
      category: (d.category as string) || "outros",
      description: (d.description as string) || "",
      image_url: (d.image_url as string) || "",
      barcode: (d.barcode as string) || (d.ean1 as string) || "",
    },
  };
}

// ── helpers ──────────────────────────────────────────────────────────────

function isPromotion(type: string): boolean {
  return type.startsWith("PROMOTION_");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);

// ── main handler ─────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const payload: ProductChange = await req.json();
    console.log("[notify-product-change] Received:", JSON.stringify(payload));

    // Route to the correct URL based on payload type
    const isPromo = isPromotion(payload.type);

    // Products → PRODUCT_SYNC_WEBHOOK_URL (este mesmo projeto)
    // Promoções → EXTERNAL_SYSTEM_WEBHOOK_URL (ERP externo)
    const targetUrl = isPromo
      ? Deno.env.get("EXTERNAL_SYSTEM_WEBHOOK_URL")
      : Deno.env.get("PRODUCT_SYNC_WEBHOOK_URL");

    const webhookSecret = isPromo
      ? Deno.env.get("EXTERNAL_SYSTEM_WEBHOOK_SECRET") || ""
      : Deno.env.get("WEBHOOK_SECRET") || Deno.env.get("EXTERNAL_SYSTEM_WEBHOOK_SECRET") || "";

    const targetLabel = isPromo ? "ERP (promotions)" : "product-sync";

    console.log(`[notify-product-change] Target: ${targetLabel}`);
    console.log(`[notify-product-change] URL configured: ${targetUrl ? "YES" : "NO"}`);
    console.log(`[notify-product-change] Secret configured: ${webhookSecret ? "YES" : "NO"}`);

    if (!targetUrl) {
      return json({
        success: true,
        delivered: false,
        reason: `${targetLabel} webhook URL not configured`,
        duration_ms: Date.now() - startTime,
      });
    }

    const externalPayload = buildExternalPayload(payload);
    const body = JSON.stringify(externalPayload);

    console.log("[notify-product-change] Payload:", body);

    // Retry logic
    const timeoutMs = Number(Deno.env.get("EXTERNAL_SYSTEM_WEBHOOK_TIMEOUT_MS") || "30000");
    const maxRetries = Number(Deno.env.get("EXTERNAL_SYSTEM_WEBHOOK_MAX_RETRIES") || "3");

    let lastStatus: number | null = null;
    let lastError: string | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        console.log(`[notify-product-change] Attempt ${attempt + 1}/${maxRetries + 1}`);

        const response = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": webhookSecret,
          },
          body,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        lastStatus = response.status;

        if (response.ok) {
          const text = await response.text();
          console.log(`[notify-product-change] ✅ Success (${response.status})`);
          return json({
            success: true,
            delivered: true,
            status: response.status,
            duration_ms: Date.now() - startTime,
          });
        }

        const errBody = await response.text();
        lastError = `HTTP ${response.status}: ${errBody.substring(0, 200)}`;
        console.warn(`[notify-product-change] ❌ ${lastError}`);

        if (attempt < maxRetries && RETRYABLE.has(response.status)) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        break;
      } catch (err) {
        clearTimeout(timeoutId);
        lastError = err instanceof Error ? err.message : "Unknown error";
        console.error(`[notify-product-change] Error:`, lastError);

        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        break;
      }
    }

    return json({
      success: true,
      delivered: false,
      status: lastStatus,
      error: lastError,
      duration_ms: Date.now() - startTime,
    });
  } catch (error) {
    console.error("[notify-product-change] Fatal:", error);
    return json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
});
