import { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import freteGratisBanner from "@/assets/promotions/frete-gratis-banner.jpg";

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
    type: 'gradient',
    title: '🍺 Cervejas em Promoção',
    description: 'Descontos especiais em cervejas selecionadas',
    gradient: 'from-amber-500 via-amber-600 to-amber-700',
    textColor: 'text-white'
  },
  {
    id: 3,
    type: 'gradient',
    title: '🎉 10% OFF na primeira compra',
    description: 'Ganhe 10% de desconto no seu primeiro pedido',
    gradient: 'from-green-500 via-green-600 to-green-700',
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
    { loop: true, duration: 30 },
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
      <div className="overflow-hidden rounded-2xl shadow-lg" ref={emblaRef}>
        <div className="flex">
          {promotions.map((promo) => (
            <div key={promo.id} className="flex-[0_0_100%] min-w-0">
              {promo.type === 'image' ? (
                <div className="relative w-full h-48 md:h-64 bg-gradient-to-br from-red-50 to-red-100">
                  <img
                    src={promo.image}
                    alt={promo.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className={`relative w-full h-48 md:h-64 bg-gradient-to-br ${promo.gradient} p-8 md:p-12 flex flex-col justify-center`}
                >
                  <h3 className={`text-3xl md:text-6xl font-bold ${promo.textColor} mb-3 drop-shadow-lg`}>
                    {promo.title}
                  </h3>
                  <p className={`text-lg md:text-3xl font-medium ${promo.textColor} drop-shadow-md`}>
                    {promo.description}
                  </p>
                </div>
              )}
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
