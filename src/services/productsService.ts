import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  available: boolean;
  created_at?: string;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  count?: number;
  cached?: boolean;
}

/**
 * Busca todos os produtos disponíveis da API Gamatauri
 */
export async function fetchProducts(): Promise<Product[]> {
  console.log('Fetching products from API...');
  
  const { data, error } = await supabase.functions.invoke('fetch-products', {
    method: 'GET',
  });

  if (error) {
    console.error('Error fetching products:', error);
    throw new Error('Falha ao carregar produtos. Tente novamente.');
  }

  if (!data.success) {
    throw new Error(data.error || 'Falha ao carregar produtos');
  }

  console.log(`Loaded ${data.data.length} products (cached: ${data.cached || false})`);
  
  return data.data;
}

/**
 * Busca detalhes de um produto específico
 */
export async function fetchProductDetails(productId: string): Promise<Product> {
  console.log('Fetching product details for:', productId);
  
  const { data, error } = await supabase.functions.invoke('fetch-products', {
    method: 'GET',
    body: { id: productId },
  });

  if (error) {
    console.error('Error fetching product details:', error);
    throw new Error('Produto não encontrado');
  }

  if (!data.success) {
    throw new Error(data.error || 'Produto não encontrado');
  }

  return data.data;
}
