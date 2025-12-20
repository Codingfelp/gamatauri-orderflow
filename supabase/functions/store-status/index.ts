import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    const apiKey = req.headers.get("x-api-key");
    const expectedApiKey = Deno.env.get("WEBHOOK_SECRET");

    if (!apiKey || apiKey !== expectedApiKey) {
      console.error("Invalid or missing API key");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { is_open, message, reason } = await req.json();

    console.log("Received store status update:", { is_open, message, reason });

    // Validate required field
    if (typeof is_open !== "boolean") {
      return new Response(
        JSON.stringify({ error: "is_open (boolean) is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get existing settings or create new one
    const { data: existingSettings, error: selectError } = await supabase
      .from("store_settings")
      .select("id")
      .limit(1)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      console.error("Error fetching store settings:", selectError);
      throw selectError;
    }

    let result;
    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from("store_settings")
        .update({
          is_open,
          closed_message: message || "Estamos temporariamente fechados",
          closed_reason: reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSettings.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new settings
      const { data, error } = await supabase
        .from("store_settings")
        .insert({
          is_open,
          closed_message: message || "Estamos temporariamente fechados",
          closed_reason: reason || null,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    console.log("Store status updated successfully:", result);

    return new Response(
      JSON.stringify({
        success: true,
        store_status: result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating store status:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
