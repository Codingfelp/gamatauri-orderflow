import { useState, useEffect } from "react";
import { fetchPromotions as apiFetchPromotions } from "@/services/api/promotions";

export interface ProductPromotion {
  id: string;
  product_id: string;
  promotional_price: number;
  original_price: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export const usePromotions = () => {
  const [promotions, setPromotions] = useState<ProductPromotion[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPromotions = async () => {
    try {
      const data = await apiFetchPromotions();

      // Map API response to ProductPromotion interface
      const mapped: ProductPromotion[] = data.map((p) => ({
        id: p.id,
        product_id: p.product?.id || "",
        promotional_price: p.promotion_price,
        original_price: p.original_price,
        start_date: new Date(0).toISOString(), // API only returns active promos
        end_date: p.end_date,
        is_active: true,
      }));

      setPromotions(mapped);
    } catch (error) {
      console.error("Error fetching promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
    const poll = setInterval(loadPromotions, 5 * 60 * 1000);
    return () => clearInterval(poll);
  }, []);

  const getPromotionForProduct = (productId: string): ProductPromotion | null => {
    return promotions.find((p) => p.product_id === productId) || null;
  };

  const isPromotionActive = (promo: ProductPromotion): boolean => {
    const now = new Date();
    const end = new Date(promo.end_date);
    return promo.is_active && now <= end;
  };

  const getActivePromotions = (): ProductPromotion[] => {
    const now = new Date();
    return promotions.filter((p) => p.is_active && now <= new Date(p.end_date));
  };

  return {
    promotions,
    loading,
    getPromotionForProduct,
    isPromotionActive,
    getActivePromotions,
    refetch: loadPromotions,
  };
};
