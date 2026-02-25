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
  wizardMetaById?: Record<string, { reasons: string[]; docura?: string; intensidade?: string; ocasioes?: string[] }> | null;
}

export const CategoryProductRow = ({ category, products, onAddToCart, wizardMetaById }: CategoryProductRowProps) => {
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

  const groupedProductIds = new Set(
    productGroups.flatMap((group) => group.variants.map((variant) => variant.id))
  );

  const standaloneProducts = useVariants
    ? products.filter((product) => !groupedProductIds.has(product.id))
    : [];

  const rowItems = useVariants
    ? [
        ...productGroups.map((group) => ({ kind: "group" as const, group })),
        ...standaloneProducts.map((product) => ({ kind: "product" as const, product })),
      ]
    : products.map((product) => ({ kind: "product" as const, product }));

  const itemsToDisplay = showAll ? rowItems : rowItems.slice(0, 8);
  const totalCount = rowItems.length;

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
            <div className="flex gap-2 pl-1 pr-4 py-2 items-center">
              {itemsToDisplay.map((item) => (
                <div
                  key={item.kind === "group" ? item.group.groupKey : item.product.id}
                  className="flex-[0_0_115px] sm:flex-[0_0_135px] md:flex-[0_0_155px]"
                >
                  {item.kind === "group" ? (
                    <ProductVariantCard
                      productGroup={item.group}
                      onAddToCart={onAddToCart}
                    />
                  ) : (
                    <ProductCard
                      product={item.product}
                      onAddToCart={onAddToCart}
                      wizardMeta={wizardMetaById?.[item.product.id]}
                    />
                  )}
                </div>
              ))}
              {/* Botão + no final do carrossel */}
              {totalCount > 8 && (
                <div className="flex-[0_0_40px] flex items-center justify-center">
                  <button
                    onClick={() => setShowAll(true)}
                    className="w-8 h-8 bg-primary hover:bg-primary/90 rounded-lg flex items-center justify-center text-white font-bold text-sm transition-colors"
                  >
                    +
                  </button>
                </div>
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
        <div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
            {itemsToDisplay.map((item) =>
              item.kind === "group" ? (
                <ProductVariantCard
                  key={item.group.groupKey}
                  productGroup={item.group}
                  onAddToCart={onAddToCart}
                />
              ) : (
                <ProductCard
                  key={item.product.id}
                  product={item.product}
                  onAddToCart={onAddToCart}
                  wizardMeta={wizardMetaById?.[item.product.id]}
                />
              )
            )}
          </div>
          {/* Botão − para recolher */}
          <div className="flex justify-center mt-3">
            <button
              onClick={() => setShowAll(false)}
              className="w-8 h-8 bg-primary hover:bg-primary/90 rounded-lg flex items-center justify-center text-white font-bold text-sm transition-colors"
            >
              −
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
