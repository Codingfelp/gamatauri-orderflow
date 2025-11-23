import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryProductRow } from "./CategoryProductRow";
import { useRecommendations } from "@/hooks/useRecommendations";
import type { Product } from "@/services/productsService";
import { motion } from "framer-motion";

interface RecommendedSectionProps {
  allProducts: Product[];
  onAddToCart: (product: Product) => void;
}

export const RecommendedSection = ({ allProducts, onAddToCart }: RecommendedSectionProps) => {
  const {
    recommendations,
    loading,
    hasRecommendations,
    refreshRecommendations,
    getTopRecurrentProducts,
    getSimilarProducts,
    getComboProducts,
  } = useRecommendations(allProducts);

  if (loading) {
    return (
      <div className="mb-8 bg-card/30 rounded-2xl border border-border/40 p-5 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-5 bg-primary/20 rounded-full" />
          <div className="h-5 w-32 bg-primary/20 rounded" />
        </div>
        <div className="h-32 bg-muted/20 rounded-xl" />
      </div>
    );
  }

  const totalOrders = recommendations?.metadata?.total_orders || 0;

  // Só mostrar para usuários com pelo menos 1 pedido
  if (!hasRecommendations || totalOrders === 0) {
    return null;
  }

  // Consolidar todos os produtos recomendados em um único array
  const allRecommended = [
    ...getTopRecurrentProducts(allProducts),
    ...getSimilarProducts(allProducts),
  ].slice(0, 8); // Limitar a 8 produtos para manter o carousel clean

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mb-8 bg-card/30 backdrop-blur-sm rounded-2xl border border-border/40 p-5"
    >
      {/* Header minimalista */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary/60" />
          <h2 className="text-sm font-medium text-muted-foreground">
            Recomendado para você
          </h2>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshRecommendations}
          className="h-7 w-7 p-0 hover:bg-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Carousel único */}
      <CategoryProductRow
        category=""
        products={allRecommended}
        onAddToCart={onAddToCart}
      />

      {/* Footer discreto */}
      <p className="text-[10px] text-muted-foreground/60 mt-3">
        Baseado em {totalOrders} {totalOrders === 1 ? 'pedido' : 'pedidos'}
      </p>
    </motion.div>
  );
};
