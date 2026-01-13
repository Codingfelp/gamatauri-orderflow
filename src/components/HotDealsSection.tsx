import { useState, useEffect, memo } from "react";
import { Flame, Clock, ChevronRight, Package, Plus, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { usePromotions, ProductPromotion } from "@/hooks/usePromotions";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getProductColor } from "@/utils/productVariants";

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

// Countdown timer component
const CountdownTimer = memo(({ endDate }: { endDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endDate).getTime();
      const now = Date.now();
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
  }, [endDate]);

  return (
    <div className="flex items-center gap-1 text-xs font-mono">
      <Timer className="w-3 h-3" />
      <span className="tabular-nums">
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {String(timeLeft.hours).padStart(2, "0")}:
        {String(timeLeft.minutes).padStart(2, "0")}:
        {String(timeLeft.seconds).padStart(2, "0")}
      </span>
    </div>
  );
});

CountdownTimer.displayName = "CountdownTimer";

// Hot Deal Product Card
const HotDealCard = memo(({ 
  product, 
  promotion, 
  onAddToCart 
}: { 
  product: Product; 
  promotion: ProductPromotion;
  onAddToCart: (product: Product) => void;
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`flex-shrink-0 w-[140px] sm:w-[160px] ${isOutOfStock ? "opacity-50" : ""}`}
    >
      <div className="bg-white rounded-2xl border-2 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
        {/* Fire badge */}
        <div className="absolute top-1 right-1 z-10 flex items-center gap-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
          <Flame className="w-2.5 h-2.5" />
          <span>-{discountPercent}%</span>
        </div>

        {/* Image area */}
        <div className="relative h-[80px] sm:h-[90px] mx-2 mt-2">
          <div
            className="absolute bottom-0 left-0 right-0 h-[45px] sm:h-[50px] rounded-xl"
            style={backgroundStyle}
          >
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center rounded-xl">
                <span className="text-[8px] font-bold text-white bg-destructive px-1.5 py-0.5 rounded">Esgotado</span>
              </div>
            )}
          </div>
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
                className="max-w-[90%] max-h-[75px] sm:max-h-[85px] object-contain transition-transform duration-300 hover:scale-105"
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
        <div className="p-2 pt-1 space-y-1">
          <p className="text-[10px] sm:text-[11px] font-medium text-foreground line-clamp-2 leading-tight min-h-[26px]">
            {product.name}
          </p>

          {/* End date badge */}
          <div className="flex items-center gap-1 text-[9px] text-orange-600 font-medium">
            <Clock className="w-2.5 h-2.5" />
            <span>Até {formattedEndDate}</span>
          </div>

          {user ? (
            <div className="space-y-0.5">
              {/* Promotional price */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">
                  R$ {promotion.promotional_price.toFixed(2)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isOutOfStock) {
                      // Pass product with promotional price
                      onAddToCart({ ...product, price: promotion.promotional_price });
                    }
                  }}
                  disabled={isOutOfStock}
                  className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
                    isOutOfStock
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                  }`}
                  aria-label="Adicionar ao carrinho"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {/* Original price - crossed out */}
              <p className="text-[10px] text-muted-foreground line-through text-center">
                R$ {promotion.original_price.toFixed(2)}
              </p>
            </div>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="w-full text-[9px] text-orange-600 font-medium hover:underline text-center"
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
  const { getActivePromotions, loading } = usePromotions();
  const activePromotions = getActivePromotions();

  // Find earliest end date for the main timer
  const earliestEndDate = activePromotions.length > 0
    ? activePromotions.reduce((min, p) => {
        const endDate = new Date(p.end_date);
        return endDate < min ? endDate : min;
      }, new Date(activePromotions[0].end_date))
    : null;

  // Get products with active promotions
  const promotionalProducts = products.filter((p) =>
    activePromotions.some((promo) => promo.product_id === p.id)
  );

  if (loading || promotionalProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-4 px-4">
      {/* Header with fire theme */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
            <Flame className="w-6 h-6 text-red-500 absolute inset-0 animate-ping opacity-30" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-1">
              Pegando Fogo
              <span className="text-orange-500">🔥</span>
            </h2>
            <p className="text-[10px] text-muted-foreground">
              Preços válidos apenas durante a promoção
            </p>
          </div>
        </div>

        {/* Main countdown */}
        {earliestEndDate && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full shadow-lg">
            <CountdownTimer endDate={earliestEndDate.toISOString()} />
          </div>
        )}
      </div>

      {/* Warning message */}
      <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 rounded-lg p-2 mb-3">
        <p className="text-[10px] text-orange-700 dark:text-orange-300 text-center">
          ⚠️ Preços promocionais válidos apenas dentro do período. Fora do prazo, o preço normal será aplicado.
        </p>
      </div>

      {/* Promotional products carousel */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {promotionalProducts.map((product) => {
          const promotion = activePromotions.find((p) => p.product_id === product.id);
          if (!promotion) return null;

          return (
            <HotDealCard
              key={product.id}
              product={product}
              promotion={promotion}
              onAddToCart={onAddToCart}
            />
          );
        })}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
};
