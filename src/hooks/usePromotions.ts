import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  const fetchPromotions = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("product_promotions")
        .select("*")
        .eq("is_active", true)
        .lte("start_date", now)
        .gte("end_date", now);

      if (error) throw error;
      
      setPromotions((data as ProductPromotion[]) || []);
    } catch (error) {
      console.error("Error fetching promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("promotions-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "product_promotions",
        },
        () => {
          console.log("[usePromotions] Promotion changed, refetching...");
          fetchPromotions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Get promotion for a specific product
  const getPromotionForProduct = (productId: string): ProductPromotion | null => {
    const now = new Date();
    const promo = promotions.find((p) => {
      if (p.product_id !== productId || !p.is_active) return false;
      const start = new Date(p.start_date);
      const end = new Date(p.end_date);
      return now >= start && now <= end;
    });
    return promo || null;
  };

  // Check if a promotion is currently active (within date range)
  const isPromotionActive = (promo: ProductPromotion): boolean => {
    const now = new Date();
    const start = new Date(promo.start_date);
    const end = new Date(promo.end_date);
    return promo.is_active && now >= start && now <= end;
  };

  // Get all active promotions with products
  const getActivePromotions = (): ProductPromotion[] => {
    const now = new Date();
    return promotions.filter((p) => {
      const start = new Date(p.start_date);
      const end = new Date(p.end_date);
      return p.is_active && now >= start && now <= end;
    });
  };

  return {
    promotions,
    loading,
    getPromotionForProduct,
    isPromotionActive,
    getActivePromotions,
    refetch: fetchPromotions,
  };
};
