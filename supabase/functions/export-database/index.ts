import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALL_TABLES = [
  "products", "orders", "order_items", "profiles", "user_addresses",
  "user_roles", "user_recommendations", "product_promotions", "product_bundles",
  "product_custom_colors", "coupons", "coupon_usage", "push_subscriptions", "store_settings",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const apiKey = url.searchParams.get("key");
    const expectedKey = Deno.env.get("PRODUCTS_API_KEY");

    if (!apiKey || apiKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const data: Record<string, any[]> = {};
    const errors: Record<string, string> = {};

    for (const table of ALL_TABLES) {
      const { data: rows, error } = await supabase.from(table).select("*").limit(10000);
      if (error) {
        errors[table] = error.message;
        data[table] = [];
      } else {
        data[table] = rows || [];
      }
    }

    const result = {
      exported_at: new Date().toISOString(),
      tables_count: ALL_TABLES.length,
      total_rows: Object.values(data).reduce((s, r) => s + r.length, 0),
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      data,
    };

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
