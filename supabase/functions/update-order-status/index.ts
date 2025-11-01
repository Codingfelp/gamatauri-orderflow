import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookData = await req.json();
    
    console.log('Received webhook data:', JSON.stringify(webhookData, null, 2));

    // Initialize Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract data from webhook
    const externalOrderId = webhookData.order_id || webhookData.external_order_id;
    const externalStatus = webhookData.status || webhookData.order_status;

    if (!externalOrderId || !externalStatus) {
      throw new Error('Missing order_id or status in webhook');
    }

    // Map external status to internal status
    const internalStatus = mapExternalStatusToInternal(externalStatus);
    
    console.log(`Mapping external status "${externalStatus}" to internal "${internalStatus}"`);

    // Find order by external_order_id (stored in stripe_payment_intent_id field)
    const { data: order, error: findError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('stripe_payment_intent_id', externalOrderId)
      .single();

    if (findError || !order) {
      console.error('Order not found:', findError);
      throw new Error(`Order not found for external_id: ${externalOrderId}`);
    }

    // Update order status
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ 
        order_status: internalStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('Failed to update order status:', updateError);
      throw new Error('Failed to update order status');
    }

    console.log(`Order ${order.id} status updated to ${internalStatus}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order status updated successfully',
        order_id: order.id,
        new_status: internalStatus
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in update-order-status function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update order status';
    
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

// Map external API statuses to internal database statuses
function mapExternalStatusToInternal(externalStatus: string): string {
  const normalized = externalStatus.toLowerCase();
  const mapping: Record<string, string> = {
    'pending': 'separacao',
    'preparing': 'separacao',
    'em_separacao': 'separacao',
    'ready': 'awaiting_closure',
    'em_rota_entrega': 'awaiting_closure',
    'out_for_delivery': 'awaiting_closure',
    'delivered': 'completed',
    'entregue': 'completed',
    'completed': 'completed',
  };
  return mapping[normalized] || 'separacao';
}
