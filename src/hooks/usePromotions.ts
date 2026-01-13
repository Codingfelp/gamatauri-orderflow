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
      const { data, error } = await supabase
        .from("product_promotions")
        .select("*")
        .eq("is_active", true)
        .order("start_date", { ascending: true });

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

    // Polling fallback (garante atualização mesmo se realtime não estiver ativo)
    const poll = setInterval(() => {
      fetchPromotions();
    }, 20000);

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
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, []);

  // Get promotion for a specific product
  // Regra: retorna 1 promoção relevante (ativa primeiro; senão, a próxima agendada)
  const getPromotionForProduct = (productId: string): ProductPromotion | null => {
    const now = Date.now();

    const productPromos = promotions.filter((p) => p.product_id === productId && !!p.is_active);
    if (productPromos.length === 0) return null;

    const active = productPromos.find((p) => {
      const start = new Date(p.start_date).getTime();
      const end = new Date(p.end_date).getTime();
      return now >= start && now <= end;
    });
    if (active) return active;

    const upcoming = productPromos
      .filter((p) => new Date(p.start_date).getTime() > now)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    return upcoming[0] || null;
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
