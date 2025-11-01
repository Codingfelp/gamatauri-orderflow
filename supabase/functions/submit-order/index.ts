import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Validar dados obrigatórios
    if (!orderData.customer_name || typeof orderData.customer_name !== 'string') {
      throw new Error('Nome do cliente é obrigatório');
    }

    if (!orderData.customer_phone || typeof orderData.customer_phone !== 'string') {
      throw new Error('Telefone do cliente é obrigatório');
    }

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

    // Mapear payload para formato da API Gamatauri
    const gamatauriPayload = {
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      customer_address: orderData.customer_address || undefined,
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
      notes: orderData.notes || undefined,
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

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Pedido criado com sucesso',
            data: {
              order_id: result.data.order_id,
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
