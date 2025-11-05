import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { Product } from "@/services/productsService";
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

  const displayedProducts = showAll ? products : products.slice(0, 6);

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
    <div className="mb-12 px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl md:text-3xl font-bold text-card-foreground">
          {category}
          <span className="text-muted-foreground text-lg ml-2">
            ({products.length})
          </span>
        </h2>
        
        {products.length > 6 && (
          <Button
            onClick={() => setShowAll(!showAll)}
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/80"
          >
            {showAll ? "Ver menos" : `Ver todos (${products.length})`}
          </Button>
        )}
      </div>

      {!showAll ? (
        <div className="relative group">
          {canScrollPrev && (
            <Button
              onClick={scrollPrev}
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {displayedProducts.map((product) => (
                <div key={product.id} className="flex-[0_0_160px] sm:flex-[0_0_200px] md:flex-[0_0_240px]">
                  <ProductCard product={product} onAddToCart={onAddToCart} />
                </div>
              ))}
            </div>
          </div>

          {canScrollNext && (
            <Button
              onClick={scrollNext}
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
};
