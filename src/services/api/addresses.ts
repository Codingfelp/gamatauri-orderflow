import { apiRequest } from './client';

export interface AddressData {
  id: string;
  label?: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  is_default?: boolean;
  is_primary?: boolean;
  shipping_fee?: number | null;
  distance_km?: number | null;
}

interface AddressListResponse {
  success: boolean;
  data: AddressData[];
}

interface AddressResponse {
  success: boolean;
  data: AddressData;
}

export async function fetchAddresses(): Promise<AddressData[]> {
  const res = await apiRequest<AddressListResponse>('app-addresses');
  if (!res.success) throw new Error('Falha ao buscar endereços');
  return res.data;
}

export async function createAddress(data: Omit<AddressData, 'id'>): Promise<AddressData> {
  const res = await apiRequest<AddressResponse>('app-addresses', {
    method: 'POST',
    body: data,
  });
  if (!res.success) throw new Error('Falha ao criar endereço');
  return res.data;
}

export async function updateAddress(id: string, data: Partial<AddressData>): Promise<AddressData> {
  const res = await apiRequest<AddressResponse>('app-addresses', {
    method: 'PUT',
    params: { id },
    body: data,
  });
  if (!res.success) throw new Error('Falha ao atualizar endereço');
  return res.data;
}

export async function deleteAddress(id: string): Promise<void> {
  await apiRequest('app-addresses', {
    method: 'DELETE',
    params: { id },
  });
}
