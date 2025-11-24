import { supabase } from "@/integrations/supabase/client";

export interface Recommendation {
  product_id: string;
  product_name: string;
  reason: 'recurrent' | 'similar' | 'behavioral' | 'combo';
  score: number;
  metadata?: {
    frequency?: number;
    total_bought?: number;
    last_purchase?: string;
    combo_with?: string[];
    description?: string;
  };
}

export interface ComboRecommendation {
  combo_name: string;
  products: string[];
  reason: 'combo';
  score: number;
  metadata?: {
    combo_with?: string[];
    description?: string;
  };
}

export interface UserRecommendations {
  top_recurrent: Recommendation[];
  similar: Recommendation[];
  behavioral: Recommendation[];
  combos: ComboRecommendation[];
  metadata?: {
    total_orders: number;
    favorite_categories: string[];
    avg_ticket: number;
    last_updated: string;
  };
}

/**
 * Busca recomendações do cache ou retorna vazio se não houver
 */
export async function fetchRecommendations(
  userId: string
): Promise<UserRecommendations | null> {
  try {
    const { data, error } = await supabase
      .from('user_recommendations')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Se não encontrou, retorna null (cliente novo ou sem cache)
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    // Verificar se o cache está válido
    const cacheValidUntil = new Date(data.cache_valid_until);
    const now = new Date();

    if (now > cacheValidUntil) {
      return null;
    }

    return {
      top_recurrent: (data.top_recurrent_products as unknown as Recommendation[]) || [],
      similar: (data.similar_products as unknown as Recommendation[]) || [],
      behavioral: (data.behavioral_products as unknown as Recommendation[]) || [],
      combos: (data.smart_combos as unknown as ComboRecommendation[]) || [],
      metadata: {
        total_orders: data.total_orders,
        favorite_categories: data.favorite_categories || [],
        avg_ticket: data.avg_ticket_value,
        last_updated: data.updated_at,
      },
    };
  } catch (error) {
    console.error('❌ Erro ao buscar recomendações:', error);
    return null;
  }
}

/**
 * Força recalcular as recomendações chamando a edge function
 */
export async function refreshRecommendations(
  userId: string
): Promise<UserRecommendations | null> {
  try {
    const { data, error } = await supabase.functions.invoke('calculate-recommendations', {
      body: { user_id: userId },
    });

    if (error) throw error;

    if (!data.success) {
      throw new Error(data.error || 'Falha ao calcular recomendações');
    }

    return {
      top_recurrent: data.data.top_recurrent || [],
      similar: data.data.similar || [],
      behavioral: data.data.behavioral || [],
      combos: data.data.combos || [],
      metadata: data.data.metadata,
    };
  } catch (error) {
    console.error('❌ Erro ao recalcular recomendações:', error);
    return null;
  }
}

/**
 * Busca produtos populares como fallback quando não há recomendações
 */
export async function fetchPopularProducts(limit: number = 6) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('available', true)
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('❌ Erro ao buscar produtos populares:', error);
    return [];
  }
}
