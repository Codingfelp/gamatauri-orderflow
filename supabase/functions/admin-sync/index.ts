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
    console.log('Admin sync started');

    const productsApiKey = Deno.env.get('PRODUCTS_API_KEY');
    console.log('Fetching products from external API');
    
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
      const errorText = await response.text();
      console.error('Failed to fetch from external API:', response.status, errorText);
      throw new Error(`External API returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    const externalProducts = result.data || [];
    console.log(`Found ${externalProducts.length} products from external API`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let inserted = 0;
    let updated = 0;
    let imagesAdded = 0;
    let errors = 0;

    console.log('Syncing products to local database...');

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

          // Track if we're adding an image
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
            console.error(`Error updating product ${product.name}:`, updateError);
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
            console.error(`Error inserting product ${product.name}:`, insertError);
            errors++;
          } else {
            inserted++;
          }
        }
      } catch (error) {
        console.error(`Error processing product ${product.name}:`, error);
        errors++;
      }
    }

    // Check current image stats
    const { data: imageStats } = await supabase
      .from('products')
      .select('image_url')
      .eq('available', true);

    const withImages = imageStats?.filter(p => p.image_url && p.image_url.length > 0).length || 0;
    const withoutImages = imageStats?.filter(p => !p.image_url || p.image_url.length === 0).length || 0;

    console.log(`Sync completed: ${inserted} inserted, ${updated} updated, ${imagesAdded} images added, ${errors} errors`);
    console.log(`Current stats: ${withImages} products with images, ${withoutImages} without images`);

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
    console.error('Error in admin-sync:', error);
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
