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
  customer_address?: string;
  items: OrderItem[];
  payment_method: string;
  payment_timing?: string;
  total: number;
  delivery_fee?: number;
  notes?: string;
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data: {
    order_id: string;
    order_number: string;
    status: string;
    total: number;
  };
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

  const payload = {
    customer_name: orderData.customer_name.trim(),
    customer_phone: sanitizedPhone,
    customer_address: orderData.customer_address?.trim(),
    items: orderData.items,
    payment_method: orderData.payment_method,
    total: orderData.total,
    delivery_fee: orderData.delivery_fee || 0,
    notes: orderData.notes?.trim(),
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

  console.log('Order created successfully:', data.data);
  
  return data.data;
}
