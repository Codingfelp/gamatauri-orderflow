import { apiRequest } from './client';

export interface FavoriteProduct {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
}

interface FavoritesResponse {
  success: boolean;
  data: FavoriteProduct[];
}

export async function fetchFavorites(): Promise<FavoriteProduct[]> {
  const res = await apiRequest<FavoritesResponse>('app-favorites');
  if (!res.success) throw new Error('Falha ao buscar favoritos');
  return res.data;
}

export async function addFavorite(productId: string): Promise<void> {
  await apiRequest('app-favorites', {
    method: 'PUT',
    body: { product_id: productId, action: 'add' },
  });
}

export async function removeFavorite(productId: string): Promise<void> {
  await apiRequest('app-favorites', {
    method: 'PUT',
    body: { product_id: productId, action: 'remove' },
  });
}
