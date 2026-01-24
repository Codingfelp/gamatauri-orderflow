import { useState, useEffect, memo } from "react";
import { Flame, Clock, ChevronRight, Package, Plus, Timer, CalendarClock } from "lucide-react";
import { motion } from "framer-motion";
import { usePromotions, ProductPromotion } from "@/hooks/usePromotions";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getProductColor } from "@/utils/productVariants";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback } from "react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  available: boolean;
}

interface HotDealsSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

// Helper para formatar datas
const formatDate = (date: Date) => {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

// Countdown timer component
const CountdownTimer = memo(({ endDate, startDate }: { endDate: Date; startDate: Date }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const start = startDate.getTime();
      const end = endDate.getTime();

      // Check if promotion has started
      if (now < start) {
        // Show time until start
        const diff = start - now;
        setIsStarted(false);
        return {
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        };
      }

      // Promotion is active - show time until end
      setIsStarted(true);
      const diff = end - now;

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, [endDate, startDate]);

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-[9px] text-orange-200 font-medium">
        {isStarted ? "Termina em" : "Começa em"}
      </span>
      <div className="flex items-center gap-1 text-xs font-mono font-bold">
        <Timer className="w-3 h-3" />
        <span className="tabular-nums">
          {timeLeft.days > 0 && `${timeLeft.days}d `}
          {String(timeLeft.hours).padStart(2, "0")}:
          {String(timeLeft.minutes).padStart(2, "0")}:
          {String(timeLeft.seconds).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
});

CountdownTimer.displayName = "CountdownTimer";

// Hot Deal Product Card
const HotDealCard = memo(({ 
  product, 
  promotion, 
  onAddToCart,
  isActive 
}: { 
  product: Product; 
  promotion: ProductPromotion;
  onAddToCart: (product: Product) => void;
  isActive: boolean;
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOutOfStock = !product.available;
  const productBg = getProductColor(product.name, "", product.category || "");

  const backgroundStyle =
    productBg.type === "image"
      ? { backgroundImage: `url(${productBg.value})`, backgroundSize: "cover", backgroundPosition: "center" }
      : { background: productBg.value };

  const discountPercent = Math.round(
    ((promotion.original_price - promotion.promotional_price) / promotion.original_price) * 100
  );

  const endDate = new Date(promotion.end_date);
  const formattedEndDate = endDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock || !isActive) return;
    // Pass product with promotional price
    onAddToCart({ ...product, price: promotion.promotional_price });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`flex-shrink-0 w-[140px] sm:w-[155px] cursor-pointer ${isOutOfStock || !isActive ? "opacity-60" : ""}`}
    >
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden relative border border-orange-100">
        {/* Discount badge - orange */}
        <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-0.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
          <span>-{discountPercent}%</span>
        </div>

        {/* Image area with colored background on bottom half */}
        <div className="relative h-[100px] sm:h-[110px] mx-2 mt-2">
          {/* Colored background - bottom half */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[50px] sm:h-[55px] rounded-lg"
            style={backgroundStyle}
          >
            {(isOutOfStock || !isActive) && (
              <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center rounded-lg">
                <span className="text-[9px] font-bold text-white bg-destructive px-2 py-0.5 rounded">
                  {isOutOfStock ? "Esgotado" : "Aguarde"}
                </span>
              </div>
            )}
          </div>
          {/* Product image centered, overflowing above */}
          <div className="absolute inset-0 flex items-center justify-center">
            {product.image_url &&
            product.image_url !== "SIM" &&
            !product.image_url.startsWith("data:image") &&
            product.image_url.length > 10 ? (
              <img
                src={product.image_url}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className="max-w-[85%] max-h-[95px] sm:max-h-[105px] object-contain transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Package className="w-8 h-8 text-muted-foreground/40" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-2 pt-1.5 space-y-1.5">
          {user ? (
            <>
              {/* Promotional price - prominent orange */}
              <div className="space-y-0">
                <span className="text-sm font-bold text-orange-600">
                  R$ {promotion.promotional_price.toFixed(2).replace('.', ',')}
                </span>
                <p className="text-[10px] text-muted-foreground line-through">
                  R$ {promotion.original_price.toFixed(2).replace('.', ',')}
                </p>
              </div>

              {/* Product name */}
              <p className="text-[10px] font-medium text-foreground line-clamp-2 leading-snug min-h-[26px]">
                {product.name}
              </p>

              {/* Add button - compact orange */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || !isActive}
                className={`w-full py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 ${
                  isOutOfStock || !isActive
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:shadow-md active:scale-95"
                }`}
              >
                Adicionar
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="w-full py-1.5 text-xs text-orange-600 font-medium hover:underline text-center"
            >
              Entrar para ver preço
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

HotDealCard.displayName = "HotDealCard";

export const HotDealsSection = ({ products, onAddToCart }: HotDealsSectionProps) => {
  const { promotions, loading } = usePromotions();
  const [now, setNow] = useState(new Date());
  
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

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Filtrar APENAS promoções que estão ativas AGORA (dentro do período start_date a end_date)
  const activePromotions = promotions.filter((p) => {
    if (!(p.is_active ?? true)) return false;
    const start = new Date(p.start_date);
    const end = new Date(p.end_date);
    return now >= start && now <= end;
  });

  // Produtos que têm promoção ativa
  const promotionalProducts = products.filter((p) =>
    p.price > 0 && activePromotions.some((promo) => promo.product_id === p.id)
  );

  // Não renderizar se carregando ou sem promoções ativas
  if (loading || activePromotions.length === 0) {
    return null;
  }

  // Encontrar a promoção que termina mais tarde (para o countdown principal)
  const latestEndDate = activePromotions.reduce((latest, promo) => {
    const end = new Date(promo.end_date);
    return end > latest ? end : latest;
  }, new Date(activePromotions[0].end_date));

  // Encontrar a promoção que começou primeiro
  const earliestStartDate = activePromotions.reduce((earliest, promo) => {
    const start = new Date(promo.start_date);
    return start < earliest ? start : earliest;
  }, new Date(activePromotions[0].start_date));

  const hasDeals = promotionalProducts.length > 0;

  return (
    <section className="py-3">
      {/* Hot background container - more compact */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-xl mx-3 p-3 shadow-lg relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/20 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-red-700/30 rounded-full blur-xl" />
        
        {/* Header - more compact */}
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Flame className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-1">
                🔥 Pegando Fogo
              </h2>
              <p className="text-[10px] sm:text-xs text-white/80">
                Ofertas por tempo limitado
              </p>
            </div>
          </div>

          {/* Countdown - compact */}
          <div className="bg-black/20 backdrop-blur-sm text-white px-2 py-1.5 rounded-lg">
            <CountdownTimer startDate={earliestStartDate} endDate={latestEndDate} />
          </div>
        </div>

        {/* Promotional products carousel */}
        <div className="relative z-10">
          {hasDeals ? (
            <>
              <div className="overflow-hidden -mx-1" ref={emblaRef}>
                <div className="flex gap-3 px-1">
                  {promotionalProducts.map((product) => {
                    const promotion = activePromotions.find((p) => p.product_id === product.id);
                    if (!promotion) return null;

                    return (
                      <HotDealCard
                        key={product.id}
                        product={product}
                        promotion={promotion}
                        onAddToCart={onAddToCart}
                        isActive={true}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Scroll button */}
              {canScrollNext && (
                <button
                  onClick={scrollNext}
                  className="absolute -right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-all z-10"
                >
                  <ChevronRight className="h-4 w-4 text-foreground" />
                </button>
              )}
            </>
          ) : (
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm text-white/90 text-center">
                Nenhuma promoção ativa no momento.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
};
