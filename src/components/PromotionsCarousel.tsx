import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import beatsPraiaBanner from "@/assets/promotions/beats-praia-banner.png";
import conchaYToroBanner from "@/assets/promotions/concha-y-toro-banner.png";
import destiladosBanner from "@/assets/promotions/destilados-banner.png";
import macaVerdeDesktop from "@/assets/promotions/maca-verde-desktop.png";
import macaVerdeMobile from "@/assets/promotions/maca-verde-mobile.png";

const promotions = [
  {
    id: 1,
    image: beatsPraiaBanner,
    alt: "Combo BEATS - Leve 3 por 20",
  },
  {
    id: 2,
    image: conchaYToroBanner,
    alt: "Natal - Concha Y Toro Reservado R$ 29,90",
  },
  {
    id: 3,
    image: destiladosBanner,
    alt: "Os melhores destilados - Somente na Gamatauri",
  },
  {
    id: 4,
    desktopImage: macaVerdeDesktop,
    mobileImage: macaVerdeMobile,
    alt: "Baly Maçã Verde - Energético refrescante",
    responsive: true,
  },
];

export const PromotionsCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center" },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative w-full px-4">
      <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="min-w-0 shrink-0 grow-0 basis-full"
            >
              <div className="rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                {promo.responsive ? (
                  <picture>
                    <source 
                      media="(min-width: 768px)" 
                      srcSet={promo.desktopImage} 
                    />
                    <source 
                      media="(max-width: 767px)" 
                      srcSet={promo.mobileImage} 
                    />
                    <img
                      src={promo.mobileImage}
                      alt={promo.alt}
                      className="w-full h-36 md:h-[160px] object-cover"
                    />
                  </picture>
                ) : (
                  <img
                    src={promo.image}
                    alt={promo.alt}
                    className="w-full h-36 md:h-[160px] object-cover"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-3">
        {promotions.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === selectedIndex
                ? "bg-primary w-4"
                : "bg-muted-foreground/30"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
