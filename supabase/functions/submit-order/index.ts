import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schemas with Zod
const OrderItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  price: z.number().positive().max(99999),
  quantity: z.number().int().min(1, 'Quantidade mínima é 1').max(999),
});

const OrderSchema = z.object({
  customer_name: z.string().min(2).max(100).trim(),
  customer_phone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido'),
  customer_email: z.string().email().max(255).optional().nullable(),
  customer_address: z.string()
    .min(10, 'Endereço muito curto')
    .max(500, 'Endereço muito longo')
    .trim()
    .refine(addr => /\d+/.test(addr || ''), {
      message: 'Endereço deve conter o número da casa/prédio',
    })
    .refine(addr => (addr?.split(',').length || 0) >= 2, {
      message: 'Endereço deve conter rua, número e bairro separados por vírgula',
    })
    .optional()
    .nullable(),
  payment_method: z.enum(['pix', 'cartao', 'dinheiro', 'credito', 'debito']),
  payment_timing: z.string().optional(),
  items: z.array(OrderItemSchema).min(1).max(50),
  notes: z.string().max(1000).trim().optional().nullable(),
  delivery_fee: z.number().nonnegative().max(1000),
  change_for: z.string().max(50).optional().nullable(),
  card_info: z.object({
    holder: z.string().max(100),
    number: z.string().max(19),
    expiry: z.string().max(7),
    cvv: z.string().max(4),
  }).optional().nullable(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json();
    const orderData = OrderSchema.parse(rawData);

    // VALIDAÇÃO CRÍTICA: Verificar se o frete foi calculado
    if (orderData.delivery_fee === 0 || orderData.delivery_fee === null || orderData.delivery_fee === undefined) {
      console.error('❌ ERRO CRÍTICO: Pedido enviado sem valor de frete calculado', {
        customer_phone: orderData.customer_phone,
        customer_address: orderData.customer_address,
        delivery_fee: orderData.delivery_fee,
        timestamp: new Date().toISOString()
      });
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'O valor do frete não foi calculado. Por favor, recarregue o carrinho e tente novamente.',
          code: 'MISSING_SHIPPING_FEE'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // VALIDAÇÃO: Verificar itens com quantidade ou preço inválido
    const invalidItems = orderData.items.filter(item => item.quantity < 1 || item.price <= 0);
    if (invalidItems.length > 0) {
      console.error('❌ ERRO: Pedido contém itens inválidos', {
        invalidItems: invalidItems.map(i => ({ name: i.name, qty: i.quantity, price: i.price })),
        timestamp: new Date().toISOString()
      });
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Pedido com valor incorreto. Alguns itens estão com quantidade ou valor zerado.',
          code: 'INVALID_ITEMS'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Pedido recebido com frete calculado:', {
      customer_phone: orderData.customer_phone,
      delivery_fee: orderData.delivery_fee,
      items_count: orderData.items.length,
      change_for: orderData.change_for || null,
      timestamp: new Date().toISOString()
    });

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const normalizedPhone = orderData.customer_phone.replace(/\D/g, '');
    
    const itemsTotal = orderData.items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    );
    const deliveryFee = orderData.delivery_fee || 0;
    const totalPrice = itemsTotal + deliveryFee;

    const { data: localOrder, error: localOrderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_name: orderData.customer_name,
        customer_phone: normalizedPhone,
        customer_email: orderData.customer_email || null,
        customer_address: orderData.customer_address || null,
        payment_method: normalizePaymentMethod(orderData.payment_method),
        payment_timing: orderData.payment_timing || 'entrega',
        payment_status: 'pendente',
        order_status: 'preparing',
        total_amount: totalPrice,
        notes: orderData.notes || null,
        change_for: orderData.change_for || null,
      })
      .select()
      .single();

    if (localOrderError || !localOrder) {
      throw new Error('Falha ao salvar pedido no banco de dados');
    }

    const internalOrderId = localOrder.id;

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
    }

    // Converter change_for do formato brasileiro ("150,00") para número decimal
    let changeForNumeric: number | null = null;
    if (orderData.change_for) {
      const cleanedValue = orderData.change_for.replace(/\./g, '').replace(',', '.');
      const parsed = parseFloat(cleanedValue);
      if (!isNaN(parsed)) {
        changeForNumeric = parsed;
      }
    }

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
      change_for: changeForNumeric,
    };

    // Log de confirmação do envio do change_for para API externa
    if (orderData.payment_method === 'dinheiro' && changeForNumeric) {
      console.log('💵 Troco para pagamento em dinheiro:', {
        customer_phone: normalizedPhone,
        change_for_original: orderData.change_for,
        change_for_numeric: changeForNumeric,
        payment_method: 'dinheiro',
        timestamp: new Date().toISOString()
      });
    }

    console.log('📤 Enviando payload para API externa:', {
      external_order_id: gamatauriPayload.external_order_id,
      payment_method: gamatauriPayload.payment_method,
      change_for: changeForNumeric,
      total_price: gamatauriPayload.total_price,
      timestamp: new Date().toISOString()
    });

    let externalOrderNumber = null;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔄 Tentativa ${attempt}/3 de criar pedido externo...`);
        
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

        console.log(`📥 Resposta da API externa - Status: ${response.status}`);

        const result = await response.json();
        console.log('📦 Resultado da API externa:', JSON.stringify(result).substring(0, 500));

        if (!response.ok) {
          console.error(`❌ API externa retornou erro (tentativa ${attempt}):`, {
            status: response.status,
            error: result.error || result.message || 'Unknown error',
            timestamp: new Date().toISOString()
          });
          
          lastError = new Error(result.error || 'Failed to create order');
          
          if (response.status === 400 || response.status === 401) {
            throw lastError;
          }
          
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          throw lastError;
        }

        externalOrderNumber = result.data.order_number;
        const externalOrderId = result.data.order_id;
        
        await supabaseAdmin
          .from('orders')
          .update({ 
            stripe_payment_intent_id: externalOrderId,
            external_order_number: externalOrderNumber
          })
          .eq('id', internalOrderId);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Pedido criado com sucesso',
            data: {
              order_id: internalOrderId,
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
        lastError = error as Error;
        if (attempt === 3) {
          throw error;
        }
      }
    }

    throw lastError;

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Dados inválidos',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          })),
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

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

function normalizePaymentMethod(method: string): string {
  const normalized = method.toLowerCase();
  
  if (normalized === 'credito' || normalized === 'debito' || normalized === 'cartão') {
    return 'cartao';
  }
  
  const allowedMethods = ['pix', 'cartao', 'dinheiro'];
  return allowedMethods.includes(normalized) ? normalized : 'dinheiro';
}

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
