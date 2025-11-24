import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchRecommendations,
  refreshRecommendations as refreshRecommendationsService,
  fetchPopularProducts,
  UserRecommendations,
  Recommendation,
  ComboRecommendation,
} from "@/services/recommendationsService";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/services/productsService";

interface UseRecommendationsReturn {
  recommendations: UserRecommendations | null;
  loading: boolean;
  error: string | null;
  refreshRecommendations: () => Promise<void>;
  hasRecommendations: boolean;
  
  // Helpers para UI
  getTopRecurrentProducts: (allProducts: Product[]) => Product[];
  getSimilarProducts: (allProducts: Product[]) => Product[];
  getComboProducts: (allProducts: Product[]) => Array<{ combo: ComboRecommendation; products: Product[] }>;
}

export const useRecommendations = (
  allProducts: Product[] = []
): UseRecommendationsReturn => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<UserRecommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar recomendações
  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        console.log('⚠️ Usuário não autenticado');
        setRecommendations(null);
        return;
      }

      const data = await fetchRecommendations(user.id);
      
      if (!data) {
        // Cache vazio ou expirado, tentar recalcular
        console.log('🔄 Cache vazio, recalculando...');
        const freshData = await refreshRecommendationsService(user.id);
        setRecommendations(freshData);
      } else {
        setRecommendations(data);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar recomendações:', err);
      setError('Falha ao carregar recomendações');
    } finally {
      setLoading(false);
    }
  };

  // Forçar refresh
  const refreshRecommendations = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      const freshData = await refreshRecommendationsService(user.id);
      setRecommendations(freshData);
    } catch (err) {
      console.error('❌ Erro ao atualizar recomendações:', err);
      setError('Falha ao atualizar recomendações');
    } finally {
      setLoading(false);
    }
  };

  // Carregar ao montar
  useEffect(() => {
    if (user) {
      loadRecommendations();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  // Helpers para UI
  const getTopRecurrentProducts = (products: Product[]): Product[] => {
    if (!recommendations?.top_recurrent.length) return [];
    
    return recommendations.top_recurrent
      .map((rec) => products.find((p) => p.id === rec.product_id))
      .filter(Boolean) as Product[];
  };

  const getSimilarProducts = (products: Product[]): Product[] => {
    if (!recommendations?.similar.length) return [];
    
    return recommendations.similar
      .map((rec) => products.find((p) => p.id === rec.product_id))
      .filter(Boolean) as Product[];
  };

  const getComboProducts = (products: Product[]) => {
    if (!recommendations?.combos.length) return [];

    return recommendations.combos.map((combo) => ({
      combo,
      products: combo.products
        .map((productId) => products.find((p) => p.id === productId))
        .filter(Boolean) as Product[],
    }));
  };

  return {
    recommendations,
    loading,
    error,
    refreshRecommendations,
    hasRecommendations: !!recommendations && (
      recommendations.top_recurrent.length > 0 ||
      recommendations.similar.length > 0 ||
      recommendations.combos.length > 0
    ),
    getTopRecurrentProducts,
    getSimilarProducts,
    getComboProducts,
  };
};
