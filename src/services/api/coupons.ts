import { apiRequest } from './client';

export interface CouponValidation {
  code: string;
  discount_type: string;
  discount_value: number;
  calculated_discount: number;
  description: string;
  min_order_value?: number;
  max_discount?: number;
}

interface CouponResponse {
  success: boolean;
  data: CouponValidation;
}

export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidation> {
  const res = await apiRequest<CouponResponse>('app-coupons', {
    method: 'POST',
    body: { code, subtotal },
  });
  if (!res.success) throw new Error('Cupom inválido');
  return res.data;
}
