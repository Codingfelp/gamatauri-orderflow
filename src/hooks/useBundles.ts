import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProductBundle {
  id: string;
  name: string;
  description: string | null;
  product_ids: string[];
  quantity_required: number;
  bundle_price: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface BundleDiscount {
  bundleId: string;
  bundleName: string;
  originalTotal: number;
  bundleTotal: number;
  discount: number;
  appliedCount: number;
  itemsInBundle: string[];
}

export const useBundles = () => {
  const [bundles, setBundles] = useState<ProductBundle[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar bundles ativos
  useEffect(() => {
    const loadBundles = async () => {
      try {
        const now = new Date().toISOString();
        
        const { data, error } = await supabase
          .from('product_bundles')
          .select('*')
          .eq('is_active', true)
          .or(`start_date.is.null,start_date.lte.${now}`)
          .or(`end_date.is.null,end_date.gte.${now}`);
        
        if (error) throw error;
        
        setBundles(data || []);
      } catch (error) {
        console.error('[useBundles] Error loading bundles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBundles();
  }, []);

  // Calcular descontos de bundle para itens do carrinho
  const calculateBundleDiscounts = useCallback((cartItems: CartItem[]): BundleDiscount[] => {
    const discounts: BundleDiscount[] = [];

    for (const bundle of bundles) {
      // Encontrar itens do carrinho que pertencem a este bundle
      const eligibleItems = cartItems.filter(item => 
        bundle.product_ids.includes(item.id)
      );

      if (eligibleItems.length === 0) continue;

      // Calcular quantidade total de itens elegíveis
      const totalEligibleQuantity = eligibleItems.reduce((sum, item) => sum + item.quantity, 0);

      // Quantas vezes o bundle pode ser aplicado
      const bundleApplications = Math.floor(totalEligibleQuantity / bundle.quantity_required);

      if (bundleApplications > 0) {
        // Calcular preço original dos itens no bundle
        // Ordenar por preço (mais caros primeiro para maximizar desconto)
        const sortedItems = [...eligibleItems].sort((a, b) => b.price - a.price);
        
        let remainingQuantity = bundleApplications * bundle.quantity_required;
        let originalTotal = 0;
        const itemsInBundle: string[] = [];

        for (const item of sortedItems) {
          const quantityToUse = Math.min(item.quantity, remainingQuantity);
          if (quantityToUse > 0) {
            originalTotal += item.price * quantityToUse;
            itemsInBundle.push(item.id);
            remainingQuantity -= quantityToUse;
          }
          if (remainingQuantity <= 0) break;
        }

        const bundleTotal = bundleApplications * bundle.bundle_price;
        const discount = originalTotal - bundleTotal;

        if (discount > 0) {
          discounts.push({
            bundleId: bundle.id,
            bundleName: bundle.name,
            originalTotal,
            bundleTotal,
            discount,
            appliedCount: bundleApplications,
            itemsInBundle,
          });
        }
      }
    }

    return discounts;
  }, [bundles]);

  // Calcular desconto total de bundles
  const getTotalBundleDiscount = useCallback((cartItems: CartItem[]): number => {
    const discounts = calculateBundleDiscounts(cartItems);
    return discounts.reduce((sum, d) => sum + d.discount, 0);
  }, [calculateBundleDiscounts]);

  // Verificar se um produto tem bundle disponível
  const getProductBundle = useCallback((productId: string): ProductBundle | null => {
    return bundles.find(b => b.product_ids.includes(productId)) || null;
  }, [bundles]);

  // Verificar quantos itens faltam para ativar um bundle
  const getItemsRemainingForBundle = useCallback((productId: string, currentQuantity: number): { bundle: ProductBundle; remaining: number } | null => {
    const bundle = getProductBundle(productId);
    if (!bundle) return null;

    const remaining = bundle.quantity_required - (currentQuantity % bundle.quantity_required);
    if (remaining === bundle.quantity_required) return null; // Já está completo

    return { bundle, remaining };
  }, [getProductBundle]);

  return {
    bundles,
    loading,
    calculateBundleDiscounts,
    getTotalBundleDiscount,
    getProductBundle,
    getItemsRemainingForBundle,
  };
};
