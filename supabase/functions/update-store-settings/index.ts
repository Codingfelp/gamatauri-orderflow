import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

/**
 * Webhook para atualizar configurações dinâmicas da loja.
 * Recebe: is_open, is_raining, opening_time, closing_time, max_delivery_radius_km,
 *         min_delivery_fee, fee_per_km, rain_fee_per_km, closed_message, closed_reason
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validar API key
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = Deno.env.get("WEBHOOK_SECRET");

    if (!apiKey || apiKey !== expectedKey) {
      console.error("❌ API key inválida ou ausente");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Apenas POST é permitido
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse do body
    const body = await req.json();
    console.log("📥 Store settings update received:", body);

    // Extrair campos válidos para atualização
    const allowedFields = [
      'is_open',
      'is_raining', 
      'opening_time',
      'closing_time',
      'max_delivery_radius_km',
      'min_delivery_fee',
      'fee_per_km',
      'rain_fee_per_km',
      'closed_message',
      'closed_reason'
    ];

    const updateData: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid fields to update" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Adicionar timestamp
    updateData.updated_at = new Date().toISOString();

    // Criar cliente Supabase com service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar configurações existentes
    const { data: existingSettings, error: fetchError } = await supabase
      .from("store_settings")
      .select("id")
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    let result;

    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from("store_settings")
        .update(updateData)
        .eq("id", existingSettings.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new settings
      const { data, error } = await supabase
        .from("store_settings")
        .insert(updateData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    console.log("✅ Store settings updated successfully:", result);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Configurações atualizadas com sucesso",
        updated_fields: Object.keys(updateData).filter(k => k !== 'updated_at'),
        data: result,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Error updating store settings:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});