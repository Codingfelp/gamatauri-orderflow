import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Package, Flame, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getProductColor } from "@/utils/productVariants";
import { usePromotions } from "@/hooks/usePromotions";
import type { Product } from "@/services/productsService";

interface CompactProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const CompactProductCard = memo(({ product, onAddToCart }: CompactProductCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getPromotionForProduct, isPromotionActive } = usePromotions();
  const isOutOfStock = !product.available;

  const promotion = getPromotionForProduct(product.id);
  const hasPromo = !!promotion;
  const promoIsActive = promotion ? isPromotionActive(promotion) : false;

  const productBg = getProductColor(product.name, "", product.category || "");

  // Determinar o estilo de background baseado no tipo
  const backgroundStyle =
    productBg.type === "image"
      ? { backgroundImage: `url(${productBg.value})`, backgroundSize: "cover", backgroundPosition: "center" }
      : { background: productBg.value };

  const displayPrice = promoIsActive && promotion ? promotion.promotional_price : product.price;
  const formattedEndDate = hasPromo
    ? new Date(promotion!.end_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    : null;

  return (
    <div className={`flex-shrink-0 w-[120px] sm:w-[140px] group transition-all duration-300 ${isOutOfStock ? "opacity-50" : "hover:-translate-y-1"}`}>
      {/* Card chip-style para Recomendados - levemente maior com sombra hover */}
      <div className="bg-white rounded-2xl border border-border/20 shadow-md hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 overflow-visible relative">
        {hasPromo && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
            <Flame className="w-2 h-2" />
            <span>{promoIsActive ? "PROMO" : "EM BREVE"}</span>
          </div>
        )}

        {/* Área colorida com produto vazando */}
        <div className="relative px-2 pt-2">
          <div className="relative h-[75px] sm:h-[90px] rounded-xl overflow-visible flex items-center justify-center" style={backgroundStyle}>
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center rounded-xl">
                <span className="text-[8px] font-bold text-white bg-destructive px-1.5 py-0.5 rounded">Esgotado</span>
              </div>
            )}
            {product.image_url &&
            product.image_url !== "SIM" &&
            !product.image_url.startsWith("data:image") &&
            product.image_url.length > 10 ? (
              <img
                src={product.image_url}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className="w-[80%] h-[115%] object-contain transition-transform duration-300 group-hover:scale-110 -translate-y-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Package className="w-6 h-6 text-white/40" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-2 pt-1 space-y-1">
          <p className="text-[10px] font-medium text-foreground line-clamp-2 leading-tight min-h-[24px]">{product.name}</p>

          {hasPromo && formattedEndDate && (
            <div className="flex items-center gap-1 text-[9px] text-orange-600 font-medium">
              <Clock className="w-2.5 h-2.5" />
              <span>{promoIsActive ? `Até ${formattedEndDate}` : `Começa em breve`}</span>
            </div>
          )}

          {user ? (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-foreground">R$ {displayPrice.toFixed(2)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isOutOfStock && (!hasPromo || promoIsActive)) {
                      onAddToCart(promoIsActive && promotion ? ({ ...product, price: promotion.promotional_price } as Product) : product);
                    }
                  }}
                  disabled={isOutOfStock || (hasPromo && !promoIsActive)}
                  className={`h-6 w-6 rounded-lg flex items-center justify-center transition-colors ${
                    isOutOfStock || (hasPromo && !promoIsActive)
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : promoIsActive
                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                        : "bg-muted/40 text-primary hover:bg-muted"
                  }`}
                  aria-label="Adicionar ao carrinho"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {promoIsActive && promotion && (
                <p className="text-[10px] text-muted-foreground line-through text-center">
                  R$ {promotion.original_price.toFixed(2)}
                </p>
              )}
            </div>
          ) : (
            <button onClick={() => navigate("/auth")} className="w-full text-[9px] text-primary font-medium hover:underline">
              Entrar para ver preço
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

CompactProductCard.displayName = "CompactProductCard";
