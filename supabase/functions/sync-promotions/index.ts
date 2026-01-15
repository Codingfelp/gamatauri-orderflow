import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface PromotionItem {
  product_id: string;
  promotional_price: number;
  original_price: number;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

interface SyncPayload {
  promotions: PromotionItem[];
  replace_all?: boolean; // If true, deactivate all existing and insert new
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API key from multiple sources for flexibility
    const url = new URL(req.url);
    const apiKeyFromQuery = url.searchParams.get("key");
    const apiKeyFromHeader = req.headers.get("x-api-key");
    const webhookSecretHeader = req.headers.get("x-webhook-secret");
    
    // Accept any of these authentication methods
    const providedKey = apiKeyFromHeader || webhookSecretHeader || apiKeyFromQuery;
    const webhookSecret = Deno.env.get("WEBHOOK_SECRET");

    console.log("[sync-promotions] Auth check:", {
      hasApiKeyHeader: !!apiKeyFromHeader,
      hasWebhookSecretHeader: !!webhookSecretHeader,
      hasQueryKey: !!apiKeyFromQuery,
      hasEnvSecret: !!webhookSecret,
    });

    if (!webhookSecret) {
      console.error("[sync-promotions] WEBHOOK_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error: WEBHOOK_SECRET not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!providedKey || providedKey !== webhookSecret) {
      console.error("[sync-promotions] Invalid API key");
      return new Response(
        JSON.stringify({ 
          error: "Unauthorized",
          hint: "Provide valid key via x-api-key header, x-webhook-secret header, or ?key= query param"
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[sync-promotions] Authentication successful");

    const payload: SyncPayload = await req.json();
    console.log("[sync-promotions] Received payload with", payload.promotions?.length || 0, "promotions");
    console.log("[sync-promotions] Replace all:", payload.replace_all);

    if (!payload.promotions || !Array.isArray(payload.promotions)) {
      return new Response(
        JSON.stringify({ error: "Missing 'promotions' array in payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let deactivatedCount = 0;
    let createdCount = 0;
    let errors: string[] = [];

    // If replace_all is true, deactivate all existing promotions
    if (payload.replace_all) {
      const { error: deactivateError, data: deactivatedData } = await supabase
        .from("product_promotions")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("is_active", true)
        .select("*");

      if (deactivateError) {
        console.error("[sync-promotions] Error deactivating existing promotions:", deactivateError);
      } else {
        deactivatedCount = deactivatedData?.length || 0;
        console.log("[sync-promotions] Deactivated", deactivatedCount, "existing promotions");
      }
    }

    // Process each promotion
    for (const promo of payload.promotions) {
      // Validate required fields
      if (!promo.product_id || !promo.promotional_price || !promo.original_price || !promo.start_date || !promo.end_date) {
        errors.push(`Missing required fields for product_id: ${promo.product_id || 'unknown'}`);
        continue;
      }

      try {
        // Deactivate any existing active promotion for this product (if not replace_all)
        if (!payload.replace_all) {
          await supabase
            .from("product_promotions")
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq("product_id", promo.product_id)
            .eq("is_active", true);
        }

        // Create new promotion
        const { error: insertError } = await supabase
          .from("product_promotions")
          .insert({
            product_id: promo.product_id,
            promotional_price: promo.promotional_price,
            original_price: promo.original_price,
            start_date: promo.start_date,
            end_date: promo.end_date,
            is_active: promo.is_active !== false, // Default to true
          });

        if (insertError) {
          console.error("[sync-promotions] Error inserting promotion for", promo.product_id, ":", insertError);
          errors.push(`Failed to insert promotion for ${promo.product_id}: ${insertError.message}`);
        } else {
          createdCount++;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        errors.push(`Error processing ${promo.product_id}: ${errorMsg}`);
      }
    }

    console.log("[sync-promotions] Sync completed:", { deactivatedCount, createdCount, errorsCount: errors.length });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${createdCount} promotions`,
        deactivated: deactivatedCount,
        created: createdCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[sync-promotions] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
