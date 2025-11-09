import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

interface WebhookPayload {
  event: 'created' | 'updated' | 'deleted';
  product: {
    id?: string;
    name: string;
    price: number;
    category?: string;
    description?: string;
    image_url?: string;
    active: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Product webhook called');

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

    // Parse request body
    const payload: WebhookPayload = await req.json();
    const { event, product } = payload;

    if (!event || !product || !product.name) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload: missing event or product data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${event} event for product: ${product.name}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let result;

    switch (event) {
      case 'created': {
        // Insert or update if product already exists (upsert by name)
        console.log(`Creating/updating product: ${product.name}`);
        
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('name', product.name)
          .maybeSingle();

        if (existing) {
          // Update existing product
          const { error } = await supabase
            .from('products')
            .update({
              description: product.description,
              price: product.price,
              category: product.category,
              image_url: product.image_url,
              available: product.active,
            })
            .eq('id', existing.id);

          if (error) throw error;
          result = { action: 'updated', product_name: product.name };
        } else {
          // Insert new product
          const { error } = await supabase
            .from('products')
            .insert({
              name: product.name,
              description: product.description,
              price: product.price,
              category: product.category,
              image_url: product.image_url,
              available: product.active,
            });

          if (error) throw error;
          result = { action: 'created', product_name: product.name };
        }
        break;
      }

      case 'updated': {
        // Update existing product by name
        console.log(`Updating product: ${product.name}`);
        
        const { error } = await supabase
          .from('products')
          .update({
            description: product.description,
            price: product.price,
            category: product.category,
            image_url: product.image_url,
            available: product.active,
          })
          .eq('name', product.name);

        if (error) throw error;
        result = { action: 'updated', product_name: product.name };
        break;
      }

      case 'deleted': {
        // Soft delete: mark as unavailable and set deleted_at timestamp
        console.log(`Soft deleting product: ${product.name}`);
        
        const { error } = await supabase
          .from('products')
          .update({ 
            available: false,
            deleted_at: new Date().toISOString(),
          })
          .eq('name', product.name);

        if (error) throw error;
        result = { action: 'deleted', product_name: product.name };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Invalid event type: ${event}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`Successfully processed ${event} event for ${product.name}`);

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in product webhook:', error);
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
