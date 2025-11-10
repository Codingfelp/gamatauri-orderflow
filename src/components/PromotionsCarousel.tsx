import { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import freteGratisBanner from "@/assets/promotions/frete-gratis-banner.jpg";
import beatsComboBanner from "@/assets/promotions/beats-combo-banner.jpg";
import beatsPraiaBanner from "@/assets/promotions/beats-praia-banner.png";
import primeiraCompraBanner from "@/assets/promotions/primeira-compra-banner.png";

interface Promotion {
  id: number;
  type: 'image' | 'gradient';
  image?: string;
  title: string;
  description: string;
  gradient: string;
  textColor: string;
}

const promotions: Promotion[] = [
  {
    id: 1,
    type: 'image',
    image: freteGratisBanner,
    title: 'Frete Grátis',
    description: 'Use o cupom TAURIFRETEOFF no seu primeiro pedido',
    gradient: '',
    textColor: 'text-white'
  },
  {
    id: 2,
    type: 'image',
    image: primeiraCompraBanner,
    title: 'Primeira Compra',
    description: 'Use o cupom TAURIFRETEOFF',
    gradient: '',
    textColor: 'text-white'
  },
  {
    id: 3,
    type: 'image',
    image: beatsPraiaBanner,
    title: 'Combo BEATS',
    description: 'Leve 3 por 20 - O combo pro seu MIX',
    gradient: '',
    textColor: 'text-white'
  },
  {
    id: 4,
    type: 'gradient',
    title: '🥤 Combo Especial',
    description: 'Refrigerantes + Snacks com desconto',
    gradient: 'from-blue-500 via-blue-600 to-blue-700',
    textColor: 'text-white'
  }
];

export const PromotionsCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      duration: 30,
      align: 'start',
      slidesToScroll: 1
    },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="relative w-full">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4 pl-4">
          {promotions.map((promo) => (
            <div key={promo.id} className="flex-[0_0_100%] md:flex-[0_0_396px] min-w-0 pl-4">
              <div className="rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                {promo.type === 'image' ? (
                  <div className="relative w-full h-40 md:h-[160px] bg-gradient-to-br from-red-50 to-red-100">
                    <img
                      src={promo.image}
                      alt={promo.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className={`relative w-full h-40 md:h-[160px] bg-gradient-to-br ${promo.gradient} p-6 md:p-8 flex flex-col justify-center`}
                  >
                    <h3 className={`text-2xl md:text-3xl font-bold ${promo.textColor} mb-2 drop-shadow-lg`}>
                      {promo.title}
                    </h3>
                    <p className={`text-sm md:text-base font-medium ${promo.textColor} drop-shadow-md`}>
                      {promo.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {promotions.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === selectedIndex ? 'bg-primary w-8' : 'bg-gray-300'
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
          />
        ))}
      </div>
    </div>
  );
};
