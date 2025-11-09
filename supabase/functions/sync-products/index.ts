import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Sync products webhook called');

    // Verify webhook secret authentication
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = Deno.env.get('WEBHOOK_SECRET');
    
    if (!webhookSecret || webhookSecret !== expectedSecret) {
      console.error('Unauthorized webhook call - invalid secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Webhook authenticated successfully');

    // Fetch products from external API
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

    // Initialize Supabase client for local database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let inserted = 0;
    let updated = 0;
    let deleted = 0;
    let errors = 0;

    console.log('Syncing products to local database...');

    // Sync each product
    for (const product of externalProducts) {
      try {
        // Check if product already exists by name
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('name', product.name)
          .maybeSingle();

        if (existing) {
          // Update existing product
          const { error: updateError } = await supabase
            .from('products')
            .update({
              description: product.description,
              price: product.price,
              category: product.category,
              image_url: product.image_url,
              available: product.available,
            })
            .eq('id', existing.id);

          if (updateError) {
            console.error(`Error updating product ${product.name}:`, updateError);
            errors++;
          } else {
            updated++;
          }
        } else {
          // Insert new product
          const { error: insertError } = await supabase
            .from('products')
            .insert({
              name: product.name,
              description: product.description,
              price: product.price,
              category: product.category,
              image_url: product.image_url,
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

    console.log('Detecting deleted products...');

    // Detect products that exist locally but not in external API anymore
    const { data: localProducts } = await supabase
      .from('products')
      .select('name')
      .eq('available', true);

    if (localProducts) {
      // Create Set with external product names for faster lookup
      const externalProductNames = new Set(
        externalProducts.map((p: any) => p.name)
      );

      // Find products that are no longer in external API
      const deletedProducts = localProducts.filter(
        (p) => !externalProductNames.has(p.name)
      );

      // Soft delete by marking as unavailable
      if (deletedProducts.length > 0) {
        console.log(`Found ${deletedProducts.length} products to mark as deleted`);
        
        const { error: deleteError } = await supabase
          .from('products')
          .update({ 
            available: false,
            deleted_at: new Date().toISOString(),
          })
          .in('name', deletedProducts.map((p) => p.name));

        if (deleteError) {
          console.error('Error marking products as deleted:', deleteError);
        } else {
          deleted = deletedProducts.length;
        }
      }
    }

    console.log(`Sync completed: ${inserted} inserted, ${updated} updated, ${deleted} deleted, ${errors} errors`);

    // Return sync statistics
    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          total_external: externalProducts.length,
          inserted,
          updated,
          deleted,
          errors,
        },
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in sync-products webhook:', error);
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
