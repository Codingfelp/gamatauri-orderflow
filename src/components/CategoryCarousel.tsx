import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import refrigerantesEnergeticos from "@/assets/categories/refrigerantes-energeticos.png";
import refrigerantesZero from "@/assets/categories/refrigerantes-zero.png";
import cervejas from "@/assets/categories/cervejas.jpg";
import cervejasZero from "@/assets/categories/cervejas-zero.jpg";
import drinksProntos from "@/assets/categories/drinks-prontos.png";
import aguasSucos from "@/assets/categories/aguas-sucos.png";
import destilados from "@/assets/categories/destilados.png";
import vinhos from "@/assets/categories/vinhos.png";
import bomboniere from "@/assets/categories/bomboniere.png";
import balasDoces from "@/assets/categories/balas-doces.png";
import chocolates from "@/assets/categories/chocolates.jpg";
import copao from "@/assets/categories/copao.jpg";
import cigarros from "@/assets/categories/cigarros.jpg";
import gelos from "@/assets/categories/gelos.jpg";

interface Category {
  name: string;
  image: string;
  value: string;
}

const categories: Category[] = [
  { name: "Chocolates", image: chocolates, value: "Chocolates" },
  { name: "Copão", image: copao, value: "Copão" },
  { name: "Cigarros", image: cigarros, value: "Cigarros" },
  { name: "Gelos", image: gelos, value: "Gelos" },
  { name: "Refrigerantes e Energéticos", image: refrigerantesEnergeticos, value: "Refrigerantes" },
  { name: "Refrigerantes Zero", image: refrigerantesZero, value: "Refrigerantes Zero" },
  { name: "Cervejas", image: cervejas, value: "Cervejas" },
  { name: "Cervejas Zero", image: cervejasZero, value: "Cervejas Zero" },
  { name: "Drinks Prontos", image: drinksProntos, value: "Drinks" },
  { name: "Águas, Sucos e Isotônicos", image: aguasSucos, value: "Sucos" },
  { name: "Destilados", image: destilados, value: "Destilados" },
  { name: "Vinhos", image: vinhos, value: "Vinhos" },
  { name: "Bomboniere e Salgadinhos", image: bomboniere, value: "Snacks" },
  { name: "Balas, Doces e Chicletes", image: balasDoces, value: "Doces" },
];

interface CategoryCarouselProps {
  onCategoryChange: (category: string) => void;
  selectedCategory: string;
}

export const CategoryCarousel = ({ onCategoryChange, selectedCategory }: CategoryCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    skipSnaps: false,
    dragFree: true,
  });
  
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

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
    <div className="relative px-4 md:px-8">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {categories.map((category) => {
            const isSelected = selectedCategory === category.value;
            return (
              <button
                key={category.value}
                onClick={() => onCategoryChange(category.value)}
                className={cn(
                  "flex-[0_0_280px] md:flex-[0_0_320px] group relative overflow-hidden rounded-xl transition-all duration-300",
                  isSelected && "ring-4 ring-primary shadow-xl scale-[1.02]"
                )}
              >
                <div className="relative h-40 md:h-48 w-full">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div 
                    className={cn(
                      "absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300",
                      isSelected ? "opacity-70" : "opacity-60 group-hover:opacity-80"
                    )}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className={cn(
                      "text-white font-bold text-lg md:text-xl transition-all duration-300",
                      isSelected && "text-primary-foreground"
                    )}>
                      {category.name}
                    </h3>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {canScrollPrev && (
        <Button
          variant="outline"
          size="icon"
          onClick={scrollPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/95 shadow-lg backdrop-blur-sm hover:bg-background"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}

      {canScrollNext && (
        <Button
          variant="outline"
          size="icon"
          onClick={scrollNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/95 shadow-lg backdrop-blur-sm hover:bg-background"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};
