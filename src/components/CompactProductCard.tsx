import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Package, Flame, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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

  const displayPrice = promoIsActive && promotion ? promotion.promotional_price : product.price;
  const formattedEndDate = hasPromo
    ? new Date(promotion!.end_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    : null;

  return (
    <div className={`flex-shrink-0 w-[150px] sm:w-[165px] group transition-all duration-300 ${isOutOfStock ? "opacity-50" : "hover:-translate-y-1"}`}>
      {/* Card elegante estilo FeitosParaVoce */}
      <div className="relative bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        {hasPromo && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive text-destructive-foreground">
              <Flame className="w-2.5 h-2.5" />
              {promoIsActive ? "PROMO" : "EM BREVE"}
            </span>
          </div>
        )}

        {/* Imagem aspect-square */}
        <div className="aspect-square bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center p-6 relative overflow-hidden">
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/60 z-10 flex items-center justify-center">
              <span className="text-[10px] font-bold text-destructive-foreground bg-destructive px-2 py-0.5 rounded">Esgotado</span>
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
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <Package className="w-6 h-6 text-muted-foreground/40" />
          )}
        </div>

        {/* Info */}
        <div className="p-2.5">
          <h3 className="text-xs font-medium text-foreground/90 line-clamp-2 leading-tight min-h-[32px]">{product.name}</h3>

          {hasPromo && formattedEndDate && (
            <div className="flex items-center gap-1 text-[9px] text-destructive font-medium mt-1">
              <Clock className="w-2.5 h-2.5" />
              <span>{promoIsActive ? `Até ${formattedEndDate}` : `Começa em breve`}</span>
            </div>
          )}

          {user ? (
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex flex-col">
                {promoIsActive && promotion ? (
                  <>
                    <span className="text-[9px] text-muted-foreground line-through">
                      R$ {promotion.original_price.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-sm font-bold text-destructive">
                      R$ {displayPrice.toFixed(2).replace('.', ',')}
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-foreground/90">R$ {displayPrice.toFixed(2).replace('.', ',')}</span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isOutOfStock && (!hasPromo || promoIsActive)) {
                    onAddToCart(promoIsActive && promotion ? ({ ...product, price: promotion.promotional_price } as Product) : product);
                  }
                }}
                disabled={isOutOfStock || (hasPromo && !promoIsActive)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                  isOutOfStock || (hasPromo && !promoIsActive)
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                }`}
                aria-label="Adicionar ao carrinho"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button onClick={() => navigate("/auth")} className="w-full text-[9px] text-primary font-medium hover:underline mt-1.5">
              Entrar para ver preço
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

CompactProductCard.displayName = "CompactProductCard";
