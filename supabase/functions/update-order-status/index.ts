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
    
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Full webhook payload:', JSON.stringify(webhookData, null, 2));
    console.log('Headers:', JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2));

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
    
    console.log(`=== STATUS MAPPING ===`);
    console.log(`External status: "${externalStatus}"`);
    console.log(`Mapped to internal: "${internalStatus}"`);

    // Find order by external_order_number (preferred) or stripe_payment_intent_id (fallback)
    console.log(`Searching for order with external_order_number: ${externalOrderId}`);
    
    const { data: order, error: findError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .or(`external_order_number.eq.${externalOrderId},stripe_payment_intent_id.eq.${externalOrderId}`)
      .maybeSingle();

    if (findError || !order) {
      console.error('=== ORDER NOT FOUND ===');
      console.error('Error:', findError);
      console.error('Searched for external_order_id:', externalOrderId);
      throw new Error(`Order not found for external_id: ${externalOrderId}`);
    }

    console.log(`=== ORDER FOUND ===`);
    console.log(`Internal order ID: ${order.id}`);

    // Update order status
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ 
        order_status: internalStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('=== UPDATE FAILED ===');
      console.error('Error:', updateError);
      throw new Error('Failed to update order status');
    }

    console.log(`=== SUCCESS ===`);
    console.log(`Order ${order.id} status updated from previous to ${internalStatus}`);

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
  const normalized = externalStatus.toLowerCase().trim();
  
  // Valid statuses in DB: 'separacao', 'preparando', 'saiu_entrega', 'entregue', 'cancelado'
  const mapping: Record<string, string> = {
    // Separation/Preparing phase
    'pending': 'separacao',
    'preparing': 'preparando',
    'em_separacao': 'separacao',
    'separando': 'separacao',
    'processando': 'separacao',
    'preparando': 'preparando',
    
    // Out for delivery / In route
    'ready': 'saiu_entrega',
    'ready_for_delivery': 'saiu_entrega',
    'pronto': 'saiu_entrega',
    'pronto_para_entrega': 'saiu_entrega',
    'em_rota_entrega': 'saiu_entrega',
    'em_rota': 'saiu_entrega',
    'saiu_para_entrega': 'saiu_entrega',
    'out_for_delivery': 'saiu_entrega',
    'delivering': 'saiu_entrega',
    'awaiting_closure': 'saiu_entrega',
    
    // Delivered/Completed
    'delivered': 'entregue',
    'entregue': 'entregue',
    'completed': 'entregue',
    'finalizado': 'entregue',
    'concluido': 'entregue',
    
    // Cancelled
    'cancelled': 'cancelado',
    'cancelado': 'cancelado',
    'canceled': 'cancelado',
  };
  
  const result = mapping[normalized];
  
  if (!result) {
    console.warn(`Unknown external status: "${externalStatus}" - defaulting to 'separacao'`);
    return 'separacao';
  }
  
  console.log(`Mapped "${externalStatus}" -> "${result}"`);
  return result;
}
