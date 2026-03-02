import { apiRequest } from './client';

export interface ShippingResult {
  fee: number;
  distance_km: number;
  estimated_time?: string;
  out_of_range?: boolean;
  max_radius_km?: number;
}

interface ShippingResponse {
  success: boolean;
  fee: number;
  distance_km: number;
  estimated_time?: string;
}

export async function calculateShipping(latitude: number, longitude: number): Promise<ShippingResult> {
  const res = await apiRequest<ShippingResponse>('calculate-shipping', {
    method: 'POST',
    body: { latitude, longitude },
    auth: false,
  });
  return {
    fee: res.fee,
    distance_km: res.distance_km,
    estimated_time: res.estimated_time,
  };
}

/**
 * Calculate shipping by address string (uses existing Lovable Cloud Edge Function as fallback)
 */
export async function calculateShippingByAddress(destination: string): Promise<ShippingResult> {
  // Use the Lovable Cloud edge function for address-based calculation
  // since the external API only accepts lat/lng
  const { supabase } = await import('@/integrations/supabase/client');
  
  const { data, error } = await supabase.functions.invoke('calculate-shipping', {
    body: { destination },
  });

  if (error) {
    // Check for out of range
    const errorStr = JSON.stringify(error).toLowerCase();
    if (errorStr.includes('out_of_range') || errorStr.includes('fora')) {
      return { fee: 0, distance_km: 0, out_of_range: true };
    }
    throw error;
  }

  if (data?.out_of_range) {
    return {
      fee: 0,
      distance_km: data.distance_km ?? 0,
      out_of_range: true,
      max_radius_km: data.max_radius_km,
    };
  }

  return {
    fee: data.fee ?? data.shipping_fee ?? 0,
    distance_km: data.distance_km ?? 0,
    estimated_time: data.estimated_time,
  };
}
