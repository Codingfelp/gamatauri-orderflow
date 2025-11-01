import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache de produtos para melhorar performance
let productsCache: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get('id');

    // Se tem ID, buscar produto específico
    if (productId) {
      console.log('Fetching product details for ID:', productId);
      
      const response = await fetch(
        `https://uylhfhbedjfhupvkrfrf.supabase.co/functions/v1/products-api?id=${productId}`,
        {
          method: 'GET',
          headers: {
            'X-API-KEY': Deno.env.get('PRODUCTS_API_KEY') || '',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error fetching product:', errorData);
        throw new Error(errorData.error || 'Failed to fetch product details');
      }

      const data = await response.json();
      console.log('Product details fetched successfully');

      return new Response(
        JSON.stringify({
          success: true,
          data: mapProduct(data.data),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Buscar todos os produtos (com cache)
    const now = Date.now();
    const cacheValid = productsCache && (now - cacheTimestamp) < CACHE_DURATION;

    if (cacheValid) {
      console.log('Returning cached products');
      return new Response(
        JSON.stringify({
          success: true,
          data: productsCache,
          cached: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Fetching products from Gamatauri API');
    
    const response = await fetch(
      'https://uylhfhbedjfhupvkrfrf.supabase.co/functions/v1/products-api',
      {
        method: 'GET',
        headers: {
          'X-API-KEY': Deno.env.get('PRODUCTS_API_KEY') || '',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error fetching products:', errorData);
      throw new Error(errorData.error || 'Failed to fetch products');
    }

    const result = await response.json();
    
    // Mapear produtos para o formato esperado pelo frontend
    const mappedProducts = result.data.map(mapProduct);
    
    // Atualizar cache
    productsCache = mappedProducts;
    cacheTimestamp = now;

    console.log(`Successfully fetched ${mappedProducts.length} products`);

    return new Response(
      JSON.stringify({
        success: true,
        data: mappedProducts,
        count: mappedProducts.length,
        cached: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in fetch-products function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Função para mapear produtos da API Gamatauri para formato do frontend
function mapProduct(product: any) {
  return {
    id: product.id,
    name: product.name,
    description: product.description || null,
    price: product.price,
    image_url: product.image_url,
    category: product.category,
    available: product.active, // Mapear 'active' para 'available'
    created_at: product.created_at,
  };
}
