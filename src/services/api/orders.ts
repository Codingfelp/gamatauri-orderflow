import { apiRequest } from './client';

export interface OrderItemPayload {
  product_id: string;
  quantity: number;
}

export interface CreateOrderPayload {
  items: OrderItemPayload[];
  delivery_type: 'delivery' | 'pickup';
  delivery_address?: string;
  payment_method: string;
  payment_change?: number;
  coupon_code?: string;
  notes?: string;
}

export interface OrderData {
  id: string;
  order_number: string;
  status: string;
  total: number;
  subtotal?: number;
  delivery_fee?: number;
  discount?: number;
  delivery_type?: string;
  created_at: string;
  items?: OrderItemData[];
  // Extended fields for compatibility
  order_status?: string;
  total_amount?: number;
  payment_status?: string;
  payment_method?: string;
  customer_address?: string;
  external_order_number?: string;
}

export interface OrderItemData {
  productId?: string;
  productName?: string;
  product_name?: string;
  quantity: number;
  unitPrice?: number;
  product_price?: number;
  totalPrice?: number;
  subtotal?: number;
}

interface OrderListResponse {
  success: boolean;
  data: OrderData[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface OrderResponse {
  success: boolean;
  data: OrderData;
}

export async function fetchOrders(page = 1, limit = 20): Promise<OrderListResponse> {
  return apiRequest<OrderListResponse>('app-orders', {
    params: { page: String(page), limit: String(limit) },
  });
}

export async function fetchOrderById(id: string): Promise<OrderData> {
  const res = await apiRequest<OrderResponse>('app-orders', {
    params: { id },
  });
  if (!res.success) throw new Error('Pedido não encontrado');
  return res.data;
}

export async function createOrder(payload: CreateOrderPayload): Promise<OrderData> {
  const res = await apiRequest<OrderResponse>('app-orders', {
    method: 'POST',
    body: payload,
  });
  if (!res.success) throw new Error('Falha ao criar pedido');
  return res.data;
}
