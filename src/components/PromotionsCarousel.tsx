import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";

interface Promotion {
  id: number;
  title: string;
  subtitle: string;
  bgGradient: string;
}

const promotions: Promotion[] = [
  {
    id: 1,
    title: "Cervejas em Oferta",
    subtitle: "Até 30% OFF",
    bgGradient: "from-amber-400 via-orange-500 to-red-500",
  },
  {
    id: 2,
    title: "Frete Grátis",
    subtitle: "Acima de R$ 50",
    bgGradient: "from-green-400 via-emerald-500 to-teal-600",
  },
  {
    id: 3,
    title: "Combos Especiais",
    subtitle: "Economize mais",
    bgGradient: "from-blue-400 via-indigo-500 to-purple-600",
  },
  {
    id: 4,
    title: "Primeira Compra",
    subtitle: "10% de desconto",
    bgGradient: "from-pink-400 via-rose-500 to-red-500",
  },
];

export const PromotionsCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      align: "start", 
      loop: true,
      skipSnaps: false,
    },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = () => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  };

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi]);

  return (
    <div className="relative w-full">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3 md:gap-4">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className={cn(
                "flex-[0_0_90%] md:flex-[0_0_48%] lg:flex-[0_0_32%] min-w-0",
                "rounded-2xl p-6 md:p-8",
                "bg-gradient-to-br shadow-lg hover:shadow-xl",
                "transition-all duration-300 cursor-pointer hover:scale-[1.02]",
                promo.bgGradient
              )}
            >
              <div className="flex flex-col justify-center h-full text-white">
                <h3 className="text-2xl md:text-3xl font-bold mb-2 drop-shadow-lg">
                  {promo.title}
                </h3>
                <p className="text-lg md:text-xl font-semibold opacity-95 drop-shadow">
                  {promo.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center gap-2 mt-4">
        {promotions.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === selectedIndex
                ? "bg-primary w-6"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            aria-label={`Ir para promoção ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
