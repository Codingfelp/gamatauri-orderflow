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

  // Consolidar produtos recomendados ou usar populares como fallback
  let allRecommended: Product[] = [];
  let title = "Recomendado para você";
  
  if (hasRecommendations && totalOrders > 0) {
    // Usuário com histórico - recomendações personalizadas
    allRecommended = [
      ...getTopRecurrentProducts(allProducts),
      ...getSimilarProducts(allProducts),
    ].slice(0, 8);
  } else {
    // Novo usuário - produtos populares
    title = "Produtos em destaque";
    allRecommended = allProducts
      .filter(p => p.available)
      .slice(0, 8);
  }

  // Não mostrar se não houver produtos
  if (allRecommended.length === 0) {
    return null;
  }

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
            {title}
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
      {totalOrders > 0 && (
        <p className="text-[10px] text-muted-foreground/60 mt-3">
          Baseado em {totalOrders} {totalOrders === 1 ? 'pedido' : 'pedidos'}
        </p>
      )}
    </motion.div>
  );
};
