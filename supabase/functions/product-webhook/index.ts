import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface WebhookPayload {
  event: "created" | "updated" | "deleted";
  product: {
    id?: string;
    name: string;
    price?: number;
    description?: string;
    category?: string;
    image_url?: string;
    available?: boolean;
    active?: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Accept both x-webhook-secret and x-api-key headers for flexibility
    const webhookSecretHeader = req.headers.get("x-webhook-secret");
    const apiKeyHeader = req.headers.get("x-api-key");
    const url = new URL(req.url);
    const queryKey = url.searchParams.get("key");
    
    const providedSecret = webhookSecretHeader || apiKeyHeader || queryKey;
    const expectedSecret = Deno.env.get("WEBHOOK_SECRET");

    // Debug logging
    console.log("[product-webhook] Auth check:", {
      hasWebhookSecretHeader: !!webhookSecretHeader,
      hasApiKeyHeader: !!apiKeyHeader,
      hasQueryKey: !!queryKey,
      hasEnvSecret: !!expectedSecret,
      providedLength: providedSecret?.length || 0,
      expectedLength: expectedSecret?.length || 0,
    });

    if (!expectedSecret) {
      console.error("[product-webhook] WEBHOOK_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error: WEBHOOK_SECRET not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!providedSecret || providedSecret !== expectedSecret) {
      console.error("[product-webhook] Invalid secret - authentication failed");
      return new Response(
        JSON.stringify({ 
          error: "Unauthorized",
          hint: "Provide valid key via x-webhook-secret header, x-api-key header, or ?key= query param"
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[product-webhook] Authentication successful");

    const payload: WebhookPayload = await req.json();
    console.log("[product-webhook] Received payload:", JSON.stringify(payload));

    // Validate payload
    if (!payload.event || !payload.product || !payload.product.name) {
      return new Response(
        JSON.stringify({ error: "Invalid payload: event and product.name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Normalize available field (accept both 'available' and 'active')
    const isAvailable = payload.product.available ?? payload.product.active ?? true;

    switch (payload.event) {
      case "created": {
        // Check if product already exists by name
        const { data: existingProduct } = await supabase
          .from("products")
          .select("id")
          .eq("name", payload.product.name)
          .single();

        if (existingProduct) {
          // Update existing product
          const { data, error } = await supabase
            .from("products")
            .update({
              price: payload.product.price,
              description: payload.product.description,
              category: payload.product.category,
              image_url: payload.product.image_url,
              available: isAvailable,
              deleted_at: null,
            })
            .eq("id", existingProduct.id)
            .select()
            .single();

          if (error) {
            console.error("[product-webhook] Error updating existing product:", error);
            throw error;
          }

          console.log("[product-webhook] Product updated (was existing):", data);
          return new Response(
            JSON.stringify({ success: true, action: "updated", product: data }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create new product
        const { data, error } = await supabase
          .from("products")
          .insert({
            name: payload.product.name,
            price: payload.product.price || 0,
            description: payload.product.description,
            category: payload.product.category,
            image_url: payload.product.image_url,
            available: isAvailable,
          })
          .select()
          .single();

        if (error) {
          console.error("[product-webhook] Error creating product:", error);
          throw error;
        }

        console.log("[product-webhook] Product created:", data);
        return new Response(
          JSON.stringify({ success: true, action: "created", product: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "updated": {
        const { data: existingProduct } = await supabase
          .from("products")
          .select("id")
          .eq("name", payload.product.name)
          .single();

        if (!existingProduct) {
          return new Response(
            JSON.stringify({ error: "Product not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updateData: Record<string, unknown> = {};
        if (payload.product.price !== undefined) updateData.price = payload.product.price;
        if (payload.product.description !== undefined) updateData.description = payload.product.description;
        if (payload.product.category !== undefined) updateData.category = payload.product.category;
        if (payload.product.image_url !== undefined) updateData.image_url = payload.product.image_url;
        if (payload.product.available !== undefined || payload.product.active !== undefined) {
          updateData.available = isAvailable;
        }

        const { data, error } = await supabase
          .from("products")
          .update(updateData)
          .eq("id", existingProduct.id)
          .select()
          .single();

        if (error) {
          console.error("[product-webhook] Error updating product:", error);
          throw error;
        }

        console.log("[product-webhook] Product updated:", data);
        return new Response(
          JSON.stringify({ success: true, action: "updated", product: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "deleted": {
        // Soft delete: mark as unavailable
        const { data, error } = await supabase
          .from("products")
          .update({ 
            available: false, 
            deleted_at: new Date().toISOString() 
          })
          .eq("name", payload.product.name)
          .select()
          .single();

        if (error) {
          console.error("[product-webhook] Error deleting product:", error);
          throw error;
        }

        console.log("[product-webhook] Product soft-deleted:", data);
        return new Response(
          JSON.stringify({ success: true, action: "deleted", product: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid event. Use: created, updated, or deleted" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[product-webhook] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
