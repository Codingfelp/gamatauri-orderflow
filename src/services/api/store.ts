import { apiRequest } from './client';

export interface StoreStatusData {
  is_open: boolean;
  message: string;
  store_name?: string;
  opening_time: string;
  closing_time: string;
  delivery_fee?: number;
  min_order_value?: number;
  estimated_delivery_time?: string;
  accepts_pix?: boolean;
  accepts_card?: boolean;
  accepts_cash?: boolean;
  is_raining: boolean;
  rain_fee?: number;
  // Extended fields for compatibility
  max_delivery_radius_km?: number;
  min_delivery_fee?: number;
  fee_per_km?: number;
  rain_fee_per_km?: number;
  closed_reason?: string | null;
}

interface StoreStatusResponse {
  success: boolean;
  data: StoreStatusData;
}

export async function fetchStoreStatus(): Promise<StoreStatusData> {
  const res = await apiRequest<StoreStatusResponse>('app-store-status', {
    auth: false,
  });
  if (!res.success) throw new Error('Falha ao buscar status da loja');
  return res.data;
}
