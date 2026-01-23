import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] update-order-status: Request received - ${req.method}`)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate API key for security - accepts header OR query param
    const url = new URL(req.url)
    const apiKeyFromHeader = req.headers.get('x-api-key') || req.headers.get('x-webhook-secret')
    const apiKeyFromQuery = url.searchParams.get('key')
    const providedKey = apiKeyFromHeader || apiKeyFromQuery
    const expectedKey = Deno.env.get('WEBHOOK_SECRET')
    
    console.log(`[${timestamp}] Auth check - key present: ${!!providedKey}, source: ${apiKeyFromHeader ? 'header' : apiKeyFromQuery ? 'query' : 'none'}`)
    
    // If WEBHOOK_SECRET is configured, validate it
    if (expectedKey && providedKey !== expectedKey) {
      console.error(`[${timestamp}] UNAUTHORIZED - invalid API key`)
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`[${timestamp}] ✅ Authentication successful`)

    const webhookData = await req.json()
    
    console.log(`[${timestamp}] Webhook payload:`, JSON.stringify(webhookData))

    // Initialize Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Extract data from webhook - support multiple field names
    const externalOrderId = webhookData.order_id || webhookData.external_order_id || webhookData.orderId || webhookData.external_order_number
    const externalStatus = webhookData.status || webhookData.order_status || webhookData.orderStatus

    console.log(`[${timestamp}] Extracted - order_id: ${externalOrderId}, status: ${externalStatus}`)

    if (!externalOrderId || !externalStatus) {
      console.error(`[${timestamp}] Missing required fields`)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing order_id or status',
          received: { externalOrderId, externalStatus }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Map external status to internal status
    const internalStatus = mapExternalStatusToInternal(externalStatus)
    
    console.log(`[${timestamp}] Status mapping: "${externalStatus}" -> "${internalStatus}"`)

    // Find orders with matching external_order_number, stripe_payment_intent_id, or direct ID
    const { data: orders, error: findError } = await supabaseAdmin
      .from('orders')
      .select('id, order_status, external_order_number')
      .or(`external_order_number.eq.${externalOrderId},stripe_payment_intent_id.eq.${externalOrderId},id.eq.${externalOrderId}`)

    if (findError) {
      console.error(`[${timestamp}] Find error:`, findError)
      throw findError
    }

    if (!orders || orders.length === 0) {
      console.error(`[${timestamp}] Order not found for: ${externalOrderId}`)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Order not found',
          searched_for: externalOrderId
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[${timestamp}] Found ${orders.length} order(s):`, orders.map(o => ({ id: o.id, currentStatus: o.order_status })))

    // Update all matching orders
    const updateResults = []
    for (const order of orders) {
      console.log(`[${timestamp}] Updating order ${order.id}: ${order.order_status} -> ${internalStatus}`)
      
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('orders')
        .update({ 
          order_status: internalStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)
        .select('id, order_status')

      if (updateError) {
        console.error(`[${timestamp}] Update failed for ${order.id}:`, updateError)
        updateResults.push({ id: order.id, success: false, error: updateError.message })
      } else {
        console.log(`[${timestamp}] ✅ Order ${order.id} updated to: ${updated?.[0]?.order_status}`)
        updateResults.push({ id: order.id, success: true, newStatus: updated?.[0]?.order_status })
      }
    }

    const allSuccess = updateResults.every(r => r.success)
    
    console.log(`[${timestamp}] Final result: ${allSuccess ? 'SUCCESS' : 'PARTIAL FAILURE'}`)

    return new Response(
      JSON.stringify({
        success: allSuccess,
        message: allSuccess ? 'Order status updated successfully' : 'Some updates failed',
        order_ids: orders.map(o => o.id),
        orders_updated: updateResults.filter(r => r.success).length,
        new_status: internalStatus,
        details: updateResults
      }),
      {
        status: allSuccess ? 200 : 207,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Fatal error:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update order status'
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// Map external API statuses to internal database statuses
function mapExternalStatusToInternal(externalStatus: string): string {
  const statusLower = externalStatus.toLowerCase().trim()
  
  console.log('[update-order-status] Mapping status:', statusLower)
  
  // Map various external statuses to internal ones
  const statusMap: Record<string, string> = {
    // Preparing statuses
    'preparing': 'preparing',
    'preparando': 'preparing',
    'em_preparacao': 'preparing',
    'em preparação': 'preparing',
    'em preparacao': 'preparing',
    'received': 'preparing',
    'recebido': 'preparing',
    'pedido_recebido': 'preparing',
    'accepted': 'preparing',
    'aceito': 'preparing',
    'pedido_aceito': 'preparing',
    'confirmed': 'preparing',
    'confirmado': 'preparing',
    'processing': 'preparing',
    'processando': 'preparing',
    
    // In route statuses - CRITICAL for "Em Rota" display
    'in_route': 'in_route',
    'in route': 'in_route',
    'inroute': 'in_route',
    'em_rota': 'in_route',
    'em rota': 'in_route',
    'emrota': 'in_route',
    'em_rota_entrega': 'in_route',
    'em rota entrega': 'in_route',
    'saiu_entrega': 'in_route',
    'saiu entrega': 'in_route',
    'saiu para entrega': 'in_route',
    'saiu_para_entrega': 'in_route',
    'out_for_delivery': 'in_route',
    'out for delivery': 'in_route',
    'dispatched': 'in_route',
    'despachado': 'in_route',
    'enviado': 'in_route',
    'shipped': 'in_route',
    'on_the_way': 'in_route',
    'on the way': 'in_route',
    'a_caminho': 'in_route',
    'a caminho': 'in_route',
    
    // Delivered statuses
    'delivered': 'delivered',
    'entregue': 'delivered',
    'entrega_realizada': 'delivered',
    'entrega realizada': 'delivered',
    'completed': 'delivered',
    'completo': 'delivered',
    'finalizado': 'delivered',
    'finished': 'delivered',
    'done': 'delivered',
    
    // Cancelled statuses
    'cancelled': 'cancelled',
    'canceled': 'cancelled',
    'cancelado': 'cancelled',
    'cancelada': 'cancelled',
    'cancel': 'cancelled',
    'refunded': 'cancelled',
    'reembolsado': 'cancelled',
  }

  // 1) Exact match mapping
  if (statusMap[statusLower]) {
    const internalStatus = statusMap[statusLower]
    console.log('[update-order-status] Status mapped successfully:', statusLower, '->', internalStatus)
    return internalStatus
  }

  // 2) Resilient mapping (new integrations sometimes send phased statuses like "em_rota_fase_2",
  // "entregue_confirmado", etc). We classify by keywords.
  const s = statusLower

  // Cancelled/refunded
  if (/(cancel|cancelad|cancell|refund|reembols)/.test(s)) return 'cancelled'

  // Delivered/finished
  if (/(entreg|deliver|completed|finaliz|finish|done|conclu)/.test(s)) return 'delivered'

  // In route / dispatched
  if (/(rota|route|em_rota|saiu|out_for_delivery|dispatch|despach|enviad|shipp|on_the_way|a_caminho)/.test(s)) {
    return 'in_route'
  }

  // Preparing / received / accepted
  if (/(prepar|prep|separa|process|receb|accept|aceit|confirm)/.test(s)) return 'preparing'

  console.warn('[update-order-status] Unknown status received:', externalStatus, '- defaulting to preparing')
  return 'preparing'
}
