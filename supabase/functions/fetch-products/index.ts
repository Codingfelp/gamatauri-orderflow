import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const productId = url.searchParams.get('id');

    if (productId) {
      console.log('Fetching product details for ID:', productId);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('available', true)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Produto não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar todos os produtos disponíveis do banco local
    // O banco é populado pelo webhook sync-products chamado pelo sistema externo
    console.log('Fetching all available products from local database');

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('available', true)
      .is('deleted_at', null)
      .order('name');

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    console.log(`Loaded ${products?.length || 0} products from database`);

    return new Response(
      JSON.stringify({
        success: true,
        data: products || [],
        count: products?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-products:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
