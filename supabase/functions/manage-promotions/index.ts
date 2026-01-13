import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface PromotionPayload {
  action: "create" | "update" | "delete";
  product_id: string;
  promotional_price?: number;
  original_price?: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key from header or query param
    const url = new URL(req.url);
    const apiKeyFromQuery = url.searchParams.get("key");
    const apiKeyFromHeader = req.headers.get("x-api-key");
    const apiKey = apiKeyFromHeader || apiKeyFromQuery;
    const webhookSecret = Deno.env.get("WEBHOOK_SECRET");

    if (!webhookSecret || apiKey !== webhookSecret) {
      console.error("[manage-promotions] Invalid API key");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: PromotionPayload = await req.json();
    console.log("[manage-promotions] Received payload:", JSON.stringify(payload));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (payload.action === "delete") {
      // Deactivate promotion for product
      const { error } = await supabase
        .from("product_promotions")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("product_id", payload.product_id)
        .eq("is_active", true);

      if (error) {
        console.error("[manage-promotions] Error deactivating promotion:", error);
        throw error;
      }

      console.log("[manage-promotions] Promotion deactivated for product:", payload.product_id);
      return new Response(
        JSON.stringify({ success: true, message: "Promotion deactivated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (payload.action === "create" || payload.action === "update") {
      // Validate required fields
      if (!payload.promotional_price || !payload.original_price || !payload.start_date || !payload.end_date) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: promotional_price, original_price, start_date, end_date" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Deactivate any existing active promotion for this product
      await supabase
        .from("product_promotions")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("product_id", payload.product_id)
        .eq("is_active", true);

      // Create new promotion
      const { data, error } = await supabase
        .from("product_promotions")
        .insert({
          product_id: payload.product_id,
          promotional_price: payload.promotional_price,
          original_price: payload.original_price,
          start_date: payload.start_date,
          end_date: payload.end_date,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error("[manage-promotions] Error creating promotion:", error);
        throw error;
      }

      console.log("[manage-promotions] Promotion created:", data);
      return new Response(
        JSON.stringify({ success: true, promotion: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: create, update, or delete" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[manage-promotions] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
