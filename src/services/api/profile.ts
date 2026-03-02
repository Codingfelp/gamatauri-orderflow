import { apiRequest } from './client';

export interface ProfileData {
  id: string;
  name: string;
  phone: string;
  cpf?: string;
  email?: string;
  favorite_team?: string;
  total_spent?: number;
  created_at?: string;
}

interface ProfileResponse {
  success: boolean;
  data: ProfileData;
}

export async function fetchProfile(): Promise<ProfileData> {
  const res = await apiRequest<ProfileResponse>('app-profile');
  if (!res.success) throw new Error('Falha ao buscar perfil');
  return res.data;
}

export async function updateProfile(data: Partial<ProfileData>): Promise<ProfileData> {
  const res = await apiRequest<ProfileResponse>('app-profile', {
    method: 'PUT',
    body: data,
  });
  if (!res.success) throw new Error('Falha ao atualizar perfil');
  return res.data;
}
