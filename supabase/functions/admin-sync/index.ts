import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to verify admin access
async function verifyAdminAccess(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { authorized: false, error: 'Unauthorized - No token provided' };
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return { authorized: false, error: 'Unauthorized - Invalid token' };
  }

  // Check admin role
  const { data: roles } = await supabaseClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin');

  if (!roles || roles.length === 0) {
    return { authorized: false, error: 'Forbidden - Admin access required' };
  }

  return { authorized: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify admin access
  const authCheck = await verifyAdminAccess(req);
  if (!authCheck.authorized) {
    return new Response(JSON.stringify({ error: authCheck.error }), {
      status: authCheck.error?.includes('Forbidden') ? 403 : 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const productsApiKey = Deno.env.get('PRODUCTS_API_KEY');
    
    const response = await fetch(
      'https://uylhfhbedjfhupvkrfrf.supabase.co/functions/v1/products-api?limit=1000',
      {
        method: 'GET',
        headers: {
          'X-API-KEY': productsApiKey || '',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`External API returned ${response.status}`);
    }

    const result = await response.json();
    const externalProducts = result.data || [];

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let inserted = 0;
    let updated = 0;
    let imagesAdded = 0;
    let errors = 0;

    for (const product of externalProducts) {
      try {
        const { data: existing } = await supabase
          .from('products')
          .select('id, image_url')
          .eq('name', product.name)
          .maybeSingle();

        if (existing) {
          let cleanImageUrl = product.image_url;
          if (cleanImageUrl && (
            cleanImageUrl === 'SIM' || 
            cleanImageUrl.startsWith('data:image') ||
            cleanImageUrl.length < 10
          )) {
            cleanImageUrl = null;
          }

          const updateData: any = {
            description: product.description,
            price: product.price,
            category: product.category,
            available: product.available,
          };

          if (cleanImageUrl && !existing.image_url) {
            updateData.image_url = cleanImageUrl;
            imagesAdded++;
          } else if (cleanImageUrl) {
            updateData.image_url = cleanImageUrl;
          }

          const { error: updateError } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', existing.id);

          if (updateError) {
            errors++;
          } else {
            updated++;
          }
        } else {
          let cleanImageUrl = product.image_url;
          if (cleanImageUrl && (
            cleanImageUrl === 'SIM' || 
            cleanImageUrl.startsWith('data:image') ||
            cleanImageUrl.length < 10
          )) {
            cleanImageUrl = null;
          }

          if (cleanImageUrl) {
            imagesAdded++;
          }

          const { error: insertError } = await supabase
            .from('products')
            .insert({
              name: product.name,
              description: product.description,
              price: product.price,
              category: product.category,
              image_url: cleanImageUrl,
              available: product.available,
            });

          if (insertError) {
            errors++;
          } else {
            inserted++;
          }
        }
      } catch (error) {
        errors++;
      }
    }

    const { data: imageStats } = await supabase
      .from('products')
      .select('image_url')
      .eq('available', true);

    const withImages = imageStats?.filter(p => p.image_url && p.image_url.length > 0).length || 0;
    const withoutImages = imageStats?.filter(p => !p.image_url || p.image_url.length === 0).length || 0;

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          total_external: externalProducts.length,
          inserted,
          updated,
          images_added: imagesAdded,
          errors,
          current_with_images: withImages,
          current_without_images: withoutImages,
        },
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
