import { supabase } from "@/integrations/supabase/client";

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderPayload {
  customer_name: string;
  customer_phone: string;
  customer_address?: string | null;
  items: OrderItem[];
  payment_method: string;
  payment_timing?: string;
  total: number;
  delivery_fee?: number;
  notes?: string;
  change_for?: string;
  card_holder?: string;
  card_number?: string;
  card_expiry?: string;
  card_cvv?: string;
  user_id?: string;
  delivery_type?: 'delivery' | 'pickup'; // NEW: tipo de entrega
}

export interface OrderResponse {
  success: boolean;
  message: string;
  already_processed?: boolean;
  data: {
    order_id: string;
    order_number: string;
    status: string;
    total: number;
  };
}

/**
 * Gera uma chave de idempotência baseada em:
 * - Telefone do cliente (normalizado)
 * - Hash dos itens do carrinho
 * - Janela de tempo de 5 minutos
 */
function generateIdempotencyKey(phone: string, items: OrderItem[]): string {
  const normalizedPhone = phone.replace(/\D/g, '');
  
  // Criar hash dos itens ordenados por ID
  const sortedItems = [...items]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(item => `${item.id}:${item.quantity}`)
    .join('|');
  
  // Hash simples
  let hash = 0;
  for (let i = 0; i < sortedItems.length; i++) {
    const char = sortedItems.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hashStr = Math.abs(hash).toString(36);
  
  // Janela de tempo de 5 minutos
  const timeWindow = Math.floor(Date.now() / 300000);
  
  return `${normalizedPhone}_${hashStr}_${timeWindow}`;
}

/**
 * Envia pedido para a API Gamatauri
 */
export async function submitOrder(orderData: OrderPayload): Promise<OrderResponse['data']> {
  console.log('Submitting order:', orderData);

  // Validações no frontend
  if (!orderData.customer_name?.trim()) {
    throw new Error('Nome do cliente é obrigatório');
  }

  if (!orderData.customer_phone?.trim()) {
    throw new Error('Telefone do cliente é obrigatório');
  }

  if (!orderData.items || orderData.items.length === 0) {
    throw new Error('Carrinho está vazio');
  }

  if (!orderData.payment_method) {
    throw new Error('Selecione um método de pagamento');
  }

  // Sanitizar telefone (remover caracteres especiais)
  const sanitizedPhone = orderData.customer_phone.replace(/[^\d]/g, '');
  
  if (sanitizedPhone.length < 10) {
    throw new Error('Telefone inválido. Use o formato (DD) 9XXXX-XXXX');
  }

  // Gerar chave de idempotência
  const idempotencyKey = generateIdempotencyKey(sanitizedPhone, orderData.items);
  
  console.log('🔑 Idempotency key gerada:', idempotencyKey);

  const payload = {
    customer_name: orderData.customer_name.trim(),
    customer_phone: sanitizedPhone,
    customer_address: orderData.customer_address?.trim() || null,
    items: orderData.items,
    payment_method: orderData.payment_method,
    payment_timing: orderData.payment_timing,
    total: orderData.total,
    delivery_fee: orderData.delivery_fee || 0,
    notes: orderData.notes?.trim(),
    change_for: orderData.change_for,
    idempotency_key: idempotencyKey,
    user_id: orderData.user_id,
    card_holder: orderData.card_holder,
    card_number: orderData.card_number,
    card_expiry: orderData.card_expiry,
    card_cvv: orderData.card_cvv,
    delivery_type: orderData.delivery_type || 'delivery', // NEW: default to delivery
  };

  const { data, error } = await supabase.functions.invoke('submit-order', {
    body: payload,
  });

  if (error) {
    console.error('Error submitting order:', error);
    throw new Error('Falha ao processar pedido. Tente novamente.');
  }

  if (!data.success) {
    throw new Error(data.error || 'Falha ao criar pedido');
  }

  // Verificar se foi pedido duplicado
  if (data.already_processed) {
    console.log('⚠️ Pedido já havia sido processado anteriormente:', data.data);
  }

  console.log('Order created successfully:', data.data);
  
  return data.data;
}