import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function mapPaymentMethod(method: string): string {
  const mapping: Record<string, string> = {
    'pix': 'Pix',
    'cartao': 'Cartão',
    'cartão': 'Cartão',
    'dinheiro': 'Dinheiro',
  };
  return mapping[method?.toLowerCase()] || 'Dinheiro';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_ids } = await req.json();

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return new Response(JSON.stringify({ error: 'order_ids é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    const webhookBaseUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/update-order-status`;
    const webhookUrl = webhookSecret ? `${webhookBaseUrl}?key=${webhookSecret}` : webhookBaseUrl;

    const results = [];

    for (const orderId of order_ids) {
      try {
        // Fetch order
        const { data: order, error: orderError } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderError || !order) {
          results.push({ order_id: orderId, success: false, error: 'Pedido não encontrado' });
          continue;
        }

        // Fetch items
        const { data: items, error: itemsError } = await supabaseAdmin
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);

        if (itemsError || !items || items.length === 0) {
          results.push({ order_id: orderId, success: false, error: 'Itens não encontrados' });
          continue;
        }

        const itemsTotal = items.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
        const deliveryFee = order.total_amount - itemsTotal;

        // Parse change_for
        let changeForNumeric: number | null = null;
        if (order.change_for) {
          const cleaned = order.change_for.replace(/\./g, '').replace(',', '.');
          const parsed = parseFloat(cleaned);
          if (!isNaN(parsed)) changeForNumeric = parsed;
        }

        const payload = {
          external_order_id: orderId,
          external_webhook_url: webhookUrl,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          customer_address: order.delivery_type === 'pickup' ? null : order.customer_address,
          address_complement: null,
          items: items.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.product_price,
            total_price: item.product_price * item.quantity,
          })),
          payment_method: mapPaymentMethod(order.payment_method),
          payment_status: 'pending',
          total_price: order.total_amount,
          delivery_fee: deliveryFee > 0 ? deliveryFee : 0,
          notes: order.notes,
          change_for: changeForNumeric,
          delivery_type: order.delivery_type || 'delivery',
        };

        console.log(`🔄 Reenviando pedido ${orderId}...`);

        const externalOrderUrl = Deno.env.get('EXTERNAL_SYSTEM_WEBHOOK_URL') || 'https://uppkjvovtvlgwfciqrbt.supabase.co/functions/v1/create-external-order';
        const response = await fetch(externalOrderUrl, {
          method: 'POST',
          headers: {
            'X-API-KEY': Deno.env.get('EXTERNAL_ORDER_API_KEY') || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        console.log(`📥 Resposta para ${orderId}: Status ${response.status}`, JSON.stringify(result).substring(0, 300));

        if (response.ok && result.data) {
          // Update order with external info
          await supabaseAdmin
            .from('orders')
            .update({
              stripe_payment_intent_id: result.data.order_id,
              external_order_number: result.data.order_number,
            })
            .eq('id', orderId);

          results.push({
            order_id: orderId,
            success: true,
            external_order_number: result.data.order_number,
          });
        } else {
          results.push({
            order_id: orderId,
            success: false,
            error: result.error || `Status ${response.status}`,
          });
        }
      } catch (err) {
        results.push({ order_id: orderId, success: false, error: (err as Error).message });
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
