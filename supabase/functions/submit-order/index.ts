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
    const orderData = await req.json();
    
    console.log('Received order data:', JSON.stringify(orderData, null, 2));

    // Initialize Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validar dados obrigatórios
    if (!orderData.customer_name || typeof orderData.customer_name !== 'string') {
      throw new Error('Nome do cliente é obrigatório');
    }

    if (!orderData.customer_phone || typeof orderData.customer_phone !== 'string') {
      throw new Error('Telefone do cliente é obrigatório');
    }

    // Normalizar telefone (remover espaços, parênteses, hífens)
    const normalizedPhone = orderData.customer_phone.replace(/\D/g, '');

    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new Error('Carrinho está vazio');
    }

    if (!orderData.payment_method) {
      throw new Error('Método de pagamento é obrigatório');
    }

    // Validar items
    for (const item of orderData.items) {
      if (!item.id || !item.name || !item.quantity || !item.price) {
        throw new Error('Item inválido no carrinho');
      }
    }

    // Calcular total
    const itemsTotal = orderData.items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    );
    const deliveryFee = orderData.delivery_fee || 0;
    const totalPrice = itemsTotal + deliveryFee;

    // 1. SAVE TO LOCAL DATABASE FIRST
    console.log('Saving order to local database...');
    
    const { data: localOrder, error: localOrderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_name: orderData.customer_name,
        customer_phone: normalizedPhone, // Use normalized phone
        customer_email: orderData.customer_email || null,
        customer_address: orderData.customer_address || null,
        payment_method: normalizePaymentMethod(orderData.payment_method),
        payment_timing: orderData.payment_timing || 'entrega',
        payment_status: 'pendente',
        order_status: 'preparing',
        total_amount: totalPrice,
        notes: orderData.notes || null,
      })
      .select()
      .single();

    if (localOrderError || !localOrder) {
      console.error('Failed to save order to local DB:', localOrderError);
      throw new Error('Falha ao salvar pedido no banco de dados');
    }

    const internalOrderId = localOrder.id;
    console.log('Order saved to local DB with ID:', internalOrderId);

    // 2. SAVE ORDER ITEMS
    const orderItemsData = orderData.items.map((item: any) => ({
      order_id: internalOrderId,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      product_price: item.price,
      subtotal: item.price * item.quantity,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemsData);

    if (itemsError) {
      console.error('Failed to save order items:', itemsError);
      // Continue anyway, we have the order
    }

    // 3. SEND TO EXTERNAL API
    // Mapear payload para formato da API Gamatauri
    const gamatauriPayload = {
      external_order_id: internalOrderId,
      external_webhook_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/update-order-status`,
      customer_name: orderData.customer_name,
      customer_phone: normalizedPhone,
      customer_address: orderData.customer_address || null,
      items: orderData.items.map((item: any) => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      })),
      payment_method: mapPaymentMethod(orderData.payment_method),
      payment_status: 'pending',
      total_price: totalPrice,
      delivery_fee: deliveryFee,
      notes: orderData.notes?.trim() || null,
      change_for: orderData.change_for || null,
      card_info: orderData.card_info ? {
        holder: orderData.card_info.holder,
        number: orderData.card_info.number,
        expiry: orderData.card_info.expiry,
        cvv: orderData.card_info.cvv,
      } : undefined,
    };

    console.log('Sending to Gamatauri API:', JSON.stringify(gamatauriPayload, null, 2));

    // Implementar retry logic (3 tentativas)
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Attempt ${attempt} to create order`);
        
        const response = await fetch(
          'https://uylhfhbedjfhupvkrfrf.supabase.co/functions/v1/create-external-order',
          {
            method: 'POST',
            headers: {
              'X-API-KEY': Deno.env.get('EXTERNAL_ORDER_API_KEY') || '',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(gamatauriPayload),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          console.error(`API returned error (attempt ${attempt}):`, result);
          lastError = new Error(result.error || 'Failed to create order');
          
          // Se for erro de validação (400), não tentar novamente
          if (response.status === 400 || response.status === 401) {
            throw lastError;
          }
          
          // Aguardar antes de tentar novamente (backoff exponencial)
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          throw lastError;
        }

        console.log('Order created successfully:', result);

        // 4. UPDATE LOCAL ORDER WITH EXTERNAL ORDER ID AND ORDER NUMBER
        const externalOrderId = result.data.order_id;
        const externalOrderNumber = result.data.order_number;
        await supabaseAdmin
          .from('orders')
          .update({ 
            stripe_payment_intent_id: externalOrderId, // Using this field to store external ID
            external_order_number: externalOrderNumber // Store the external order number (e.g., "EXT-20251103-001")
          })
          .eq('id', internalOrderId);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Pedido criado com sucesso',
            data: {
              order_id: internalOrderId, // Return INTERNAL order ID for timeline
              order_number: result.data.order_number,
              status: result.data.status,
              total: result.data.total,
            },
          }),
          {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );

      } catch (error) {
        lastError = error;
        if (attempt === 3) {
          throw error;
        }
      }
    }

    throw lastError;

  } catch (error) {
    console.error('Error in submit-order function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao criar pedido';
    const isValidationError = errorMessage.includes('obrigatório') || errorMessage.includes('inválido');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: isValidationError ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Normalizar método de pagamento para valores aceitos pelo banco
function normalizePaymentMethod(method: string): string {
  const normalized = method.toLowerCase();
  
  // Mapear credito/debito para "cartao"
  if (normalized === 'credito' || normalized === 'debito' || normalized === 'cartão') {
    return 'cartao';
  }
  
  // Validar valores permitidos
  const allowedMethods = ['pix', 'cartao', 'dinheiro'];
  return allowedMethods.includes(normalized) ? normalized : 'dinheiro';
}

// Função para mapear método de pagamento
function mapPaymentMethod(method: string): string {
  const normalized = method.toLowerCase();
  const mapping: Record<string, string> = {
    'pix': 'Pix',
    'cartao': 'Cartão',
    'cartão': 'Cartão',
    'dinheiro': 'Dinheiro',
    'vale': 'Vale',
    'online': 'Online',
  };
  return mapping[normalized] || 'Dinheiro';
}
