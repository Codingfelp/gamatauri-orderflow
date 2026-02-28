import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── helpers ──────────────────────────────────────────────────────────────

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Normalize a product name for fuzzy matching: lowercase, collapse whitespace, strip accents */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/\s+/g, " ")
    .trim();
}

function cleanImageUrl(url: string | null): string | null {
  if (
    !url ||
    url === "SIM" ||
    url.startsWith("data:image") ||
    url.length < 10
  )
    return null;
  return url;
}

function cleanDescription(desc: string | null): string | null {
  if (!desc) return null;
  if (desc.startsWith("UklGR") || desc.startsWith("data:")) return null;
  return desc.length > 500 ? desc.substring(0, 497) + "..." : desc;
}

// ── auth ─────────────────────────────────────────────────────────────────

function authenticateWebhook(req: Request): boolean {
  const secret =
    req.headers.get("x-webhook-secret") ||
    req.headers.get("x-api-key") ||
    new URL(req.url).searchParams.get("key");

  const expected = Deno.env.get("WEBHOOK_SECRET");
  const external = Deno.env.get("EXTERNAL_SYSTEM_WEBHOOK_SECRET");

  return !!secret && (secret === expected || secret === external);
}

async function authenticateAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return false;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin");

  return !!roles && roles.length > 0;
}

// ── DB client (service role) ─────────────────────────────────────────────

function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

/** Find existing product by exact name first, then by normalized name */
async function findExistingProduct(
  supabase: ReturnType<typeof createClient>,
  name: string
): Promise<{ id: string; image_url: string | null; name: string } | null> {
  // 1. Exact match
  const { data: exact } = await supabase
    .from("products")
    .select("id, image_url, name")
    .eq("name", name)
    .is("deleted_at", null)
    .maybeSingle();
  if (exact) return exact;

  // 2. Normalized fuzzy match: fetch all active products and compare
  const normalized = normalizeName(name);
  const { data: allProducts } = await supabase
    .from("products")
    .select("id, image_url, name")
    .is("deleted_at", null)
    .gt("price", 0);

  if (allProducts) {
    const match = allProducts.find(
      (p) => normalizeName(p.name) === normalized
    );
    if (match) {
      console.log(`[product-sync] Fuzzy match: "${name}" → existing "${match.name}" (id=${match.id})`);
      return match;
    }
  }

  return null;
}

// ── single-product webhook ───────────────────────────────────────────────

async function handleSingleProduct(
  payload: {
    event: string;
    product: Record<string, unknown>;
  },
  supabase: ReturnType<typeof createClient>
) {
  const { event, product } = payload;
  const name = product.name as string;
  if (!event || !name) {
    return json(
      { error: "Invalid payload: event and product.name are required" },
      400
    );
  }

  const isAvailable =
    (product.available as boolean) ?? (product.active as boolean) ?? true;
  const imageUrl = cleanImageUrl(product.image_url as string | null);

  switch (event) {
    case "created":
    case "updated": {
      const existing = await findExistingProduct(supabase, name);

      if (existing) {
        const updateData: Record<string, unknown> = {};
        // Update name to latest version from external system
        if (existing.name !== name) updateData.name = name;
        if (product.price !== undefined) updateData.price = product.price;
        if (product.description !== undefined)
          updateData.description = cleanDescription(
            product.description as string
          );
        if (product.category !== undefined)
          updateData.category = product.category;
        updateData.available = isAvailable;
        // Only clear deleted_at when product becomes available again; don't set it when unavailable
        if (isAvailable) updateData.deleted_at = null;
        if (imageUrl) updateData.image_url = imageUrl;

        const { data, error } = await supabase
          .from("products")
          .update(updateData)
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return json({ success: true, action: "updated", product: data });
      }

      // insert
      const { data, error } = await supabase
        .from("products")
        .insert({
          name,
          price: (product.price as number) || 0,
          description: cleanDescription(product.description as string | null),
          category: product.category as string | null,
          image_url: imageUrl,
          available: isAvailable,
        })
        .select()
        .single();

      if (error) throw error;
      return json({ success: true, action: "created", product: data });
    }

    case "deleted": {
      const existing = await findExistingProduct(supabase, name);
      if (!existing) {
        return json({ success: true, action: "deleted", message: "Product not found, nothing to delete" });
      }
      const { data, error } = await supabase
        .from("products")
        .update({
          available: false,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return json({ success: true, action: "deleted", product: data });
    }

    default:
      return json(
        { error: "Invalid event. Use: created, updated, or deleted" },
        400
      );
  }
}

// ── bulk sync (pulls from external API) ──────────────────────────────────

async function handleBulkSync(
  supabase: ReturnType<typeof createClient>
) {
  const productsApiKey = Deno.env.get("PRODUCTS_API_KEY");
  let allProducts: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(
      `https://uylhfhbedjfhupvkrfrf.supabase.co/functions/v1/products-api?limit=1000&page=${page}`,
      {
        headers: {
          "X-API-KEY": productsApiKey || "",
          "Content-Type": "application/json",
        },
      }
    );
    if (!res.ok) throw new Error(`External API returned ${res.status}`);
    const result = await res.json();
    const products = result.data || [];
    allProducts = allProducts.concat(products);
    hasMore = products.length >= 1000;
    page++;
  }

  console.log(`[product-sync] Fetched ${allProducts.length} external products`);

  let inserted = 0,
    updated = 0,
    deleted = 0,
    imagesAdded = 0,
    errors = 0;

  for (const product of allProducts) {
    try {
      const existing = await findExistingProduct(supabase, product.name);

      const imageUrl = cleanImageUrl(product.image_url);

      if (existing) {
        const updateData: Record<string, unknown> = {
          description: cleanDescription(product.description),
          price: product.price,
          category: product.category,
          available: product.available !== false,
          // Only clear deleted_at when available; don't set it when unavailable (product should still show as "Acabou")
          ...(product.available !== false ? { deleted_at: null } : {}),
        };
        // Update name to latest version from external system
        if (existing.name !== product.name) updateData.name = product.name;
        if (imageUrl) {
          updateData.image_url = imageUrl;
          if (!existing.image_url) imagesAdded++;
        }

        const { error } = await supabase
          .from("products")
          .update(updateData)
          .eq("id", existing.id);
        if (error) errors++;
        else updated++;
      } else {
        if (imageUrl) imagesAdded++;
        const { error } = await supabase.from("products").insert({
          name: product.name,
          description: cleanDescription(product.description),
          price: product.price,
          category: product.category,
          image_url: imageUrl,
          available: product.available !== false,
        });
        if (error) errors++;
        else inserted++;
      }
    } catch {
      errors++;
    }
  }

  // Soft-delete products not in external API
  const { data: localProducts } = await supabase
    .from("products")
    .select("name")
    .eq("available", true);

  if (localProducts) {
    const externalNames = new Set(allProducts.map((p: any) => p.name));
    const toDelete = localProducts.filter((p) => !externalNames.has(p.name));
    if (toDelete.length > 0) {
      console.log(`[product-sync] Soft-deleting ${toDelete.length} products`);
      const { error } = await supabase
        .from("products")
        .update({ available: false, deleted_at: new Date().toISOString() })
        .in(
          "name",
          toDelete.map((p) => p.name)
        );
      if (!error) deleted = toDelete.length;
    }
  }

  // Image stats
  const { data: imageStats } = await supabase
    .from("products")
    .select("image_url")
    .eq("available", true);

  const withImages =
    imageStats?.filter((p) => p.image_url && p.image_url.length > 0).length || 0;
  const withoutImages =
    imageStats?.filter((p) => !p.image_url || p.image_url.length === 0).length || 0;

  return json({
    success: true,
    stats: {
      total_external: allProducts.length,
      inserted,
      updated,
      deleted,
      images_added: imagesAdded,
      errors,
      current_with_images: withImages,
      current_without_images: withoutImages,
    },
    timestamp: new Date().toISOString(),
  });
}

// ── main handler ─────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Determine mode from query param or body
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode"); // "bulk" or omitted

    // Auth: webhook secret OR admin JWT
    const isWebhook = authenticateWebhook(req);
    const isAdmin = !isWebhook ? await authenticateAdmin(req) : false;

    if (!isWebhook && !isAdmin) {
      return json(
        {
          error: "Unauthorized",
          hint: "Provide valid key via x-webhook-secret/x-api-key header, ?key= param, or Authorization JWT",
        },
        401
      );
    }

    const supabase = getServiceClient();

    if (mode === "bulk") {
      console.log("[product-sync] Bulk sync requested");
      return await handleBulkSync(supabase);
    }

    // Single product webhook
    const payload = await req.json();

    // Normalize payload: support multiple formats from external systems
    function normalizePayload(item: any): { event: string; product: Record<string, unknown> } {
      // Map external event formats: "product.delete" → "deleted", "product.update" → "updated", etc.
      function normalizeEvent(raw: string | undefined): string {
        if (!raw) return "updated";
        const mapped: Record<string, string> = {
          "product.create": "created",
          "product.created": "created",
          "product.update": "updated",
          "product.updated": "updated",
          "product.delete": "deleted",
          "product.deleted": "deleted",
          "product.insert": "created",
          "create": "created",
          "insert": "created",
          "update": "updated",
          "delete": "deleted",
          "created": "created",
          "updated": "updated",
          "deleted": "deleted",
        };
        return mapped[raw.toLowerCase()] || "updated";
      }

      const event = normalizeEvent(item.event);

      // Support: {product: {...}}, {data: {...}}, or flat {name, price, ...}
      const product = item.product || item.data || (() => {
        // Flat format: extract product fields from top level
        const { event: _e, timestamp: _t, ...rest } = item;
        return rest;
      })();

      console.log(`[product-sync] normalizePayload: raw_event=${item.event}, mapped=${event}, has_product=${!!item.product}, has_data=${!!item.data}`);

      return { event, product };
    }

    // Support batch array
    if (Array.isArray(payload)) {
      console.log(`[product-sync] Batch of ${payload.length} products`);
      const results = [];
      for (const item of payload) {
        try {
          const normalized = normalizePayload(item);
          const res = await handleSingleProduct(normalized, supabase);
          const body = await res.json();
          results.push(body);
        } catch (e: unknown) {
          results.push({
            error: e instanceof Error ? e.message : "Unknown error",
            product: item?.product?.name || item?.name,
          });
        }
      }
      return json({ success: true, results });
    }

    console.log("[product-sync] Single product webhook");
    const normalized = normalizePayload(payload);
    console.log(`[product-sync] Normalized: event=${normalized.event}, product=${normalized.product?.name}`);
    return await handleSingleProduct(normalized, supabase);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("[product-sync] Error:", msg);
    return json({ success: false, error: msg }, 500);
  }
});
