import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { ProductVariantCard } from "@/components/ProductVariantCard";
import { Product } from "@/services/productsService";
import { groupProductsByVariants, shouldUseVariantSystem } from "@/utils/productVariants";
import useEmblaCarousel from "embla-carousel-react";

interface CategoryProductRowProps {
  category: string;
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export const CategoryProductRow = ({ category, products, onAddToCart }: CategoryProductRowProps) => {
  const [showAll, setShowAll] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    dragFree: true,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const useVariants = shouldUseVariantSystem(category);
  const productGroups = useVariants ? groupProductsByVariants(products, category) : [];
  const hasVariants = productGroups.length > 0;
  
  const itemsToDisplay = hasVariants 
    ? (showAll ? productGroups : productGroups.slice(0, 8))
    : (showAll ? products : products.slice(0, 8));
  
  const totalCount = hasVariants ? productGroups.length : products.length;

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  const onSelect = () => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  };

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi]);

  return (
    <div className="mb-3 px-4">
      <div className="flex items-center justify-end mb-2">
        {totalCount > 8 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-7 h-7 bg-primary hover:bg-primary/90 rounded-lg flex items-center justify-center text-white font-bold text-sm transition-colors"
          >
            {showAll ? "−" : "+"}
          </button>
        )}
      </div>

      {!showAll ? (
        <div className="relative group">
          {canScrollPrev && (
            <Button
              onClick={scrollPrev}
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-2 pl-1 pr-4 py-2">
              {hasVariants ? (
                itemsToDisplay.map((group: any) => (
                  <div key={group.groupKey} className="flex-[0_0_115px] sm:flex-[0_0_135px] md:flex-[0_0_155px]">
                    <ProductVariantCard
                      productGroup={group}
                      onAddToCart={onAddToCart}
                    />
                  </div>
                ))
              ) : (
                itemsToDisplay.map((product: any) => (
                  <div key={product.id} className="flex-[0_0_115px] sm:flex-[0_0_135px] md:flex-[0_0_155px]">
                    <ProductCard product={product} onAddToCart={onAddToCart} />
                  </div>
                ))
              )}
            </div>
          </div>

          {canScrollNext && (
            <Button
              onClick={scrollNext}
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
          {hasVariants ? (
            itemsToDisplay.map((group: any) => (
              <ProductVariantCard
                key={group.groupKey}
                productGroup={group}
                onAddToCart={onAddToCart}
              />
            ))
          ) : (
            itemsToDisplay.map((product: any) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
