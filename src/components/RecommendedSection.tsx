import { RefreshCw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompactProductCard } from "./CompactProductCard";
import { useRecommendations } from "@/hooks/useRecommendations";
import type { Product } from "@/services/productsService";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";

interface RecommendedSectionProps {
  allProducts: Product[];
  onAddToCart: (product: Product) => void;
  hideForNewUsers?: boolean;
}

export const RecommendedSection = ({ allProducts, onAddToCart, hideForNewUsers = false }: RecommendedSectionProps) => {
  const {
    recommendations,
    loading,
    hasRecommendations,
    refreshRecommendations,
    getTopRecurrentProducts,
    getSimilarProducts,
  } = useRecommendations(allProducts);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });

  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      setCanScrollNext(emblaApi.canScrollNext());
    };
    
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    onSelect();
    
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi]);

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="h-4 w-4 bg-primary/10 rounded animate-pulse" />
          <div className="h-4 w-28 bg-primary/10 rounded animate-pulse" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-[100px] h-[140px] bg-muted/30 rounded-xl animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  const totalOrders = recommendations?.metadata?.total_orders || 0;

  // Usuário sem histórico real de pedidos = não mostrar nada
  const isNewUser = !hasRecommendations || totalOrders === 0;
  
  if (isNewUser) {
    // Nunca mostrar produtos aleatórios - seção só aparece com histórico real
    return null;
  }

  // Consolidar produtos recomendados baseados em histórico real
  const allRecommended = [
    ...getTopRecurrentProducts(allProducts),
    ...getSimilarProducts(allProducts),
  ].slice(0, 10);

  // Não mostrar se não houver produtos recomendados
  if (allRecommended.length === 0) {
    return null;
  }

  const title = "Recomendado para você";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
    >
      {/* Header - mesma fonte de Marcas Famosas */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-card-foreground">
            {title}
          </h2>
          {totalOrders > 0 && (
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
              {totalOrders} {totalOrders === 1 ? 'pedido' : 'pedidos'}
            </span>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshRecommendations}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Carrossel fluido */}
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-3">
            {allRecommended.map((product) => (
              <CompactProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </div>
        
        {/* Botão de scroll discreto */}
        {canScrollNext && (
          <button
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center hover:bg-white transition-all z-10"
          >
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>
        )}
      </div>
    </motion.div>
  );
};
