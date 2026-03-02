import { apiRequest } from './client';

export interface PromotionProduct {
  id: string;
  name: string;
  price: number;
  image_url?: string;
}

export interface Promotion {
  id: string;
  product: PromotionProduct;
  original_price: number;
  promotion_price: number;
  discount_percentage: number;
  end_date: string;
  // Compatibility fields
  product_id?: string;
  promotional_price?: number;
  start_date?: string;
  is_active?: boolean;
}

interface PromotionsResponse {
  success: boolean;
  data: Promotion[];
  total?: number;
}

export async function fetchPromotions(): Promise<Promotion[]> {
  const res = await apiRequest<PromotionsResponse>('app-promotions', {
    auth: false,
  });
  if (!res.success) throw new Error('Falha ao buscar promoções');
  return res.data;
}
