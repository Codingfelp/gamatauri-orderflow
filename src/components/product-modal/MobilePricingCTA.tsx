import { Button } from "@/components/ui/button";
import { Flame, Share2 } from "lucide-react";
import { ProductVariant } from "@/utils/productVariants";
import { shareProductWhatsApp } from "@/utils/shareUtils";

interface Promotion {
  promotional_price: number;
  original_price: number;
  end_date: string;
}

interface MobilePricingCTAProps {
  variant: ProductVariant;
  category?: string;
  user: any;
  promotion?: Promotion | null;
  isPromotionActive: boolean;
  onAddToCart: () => void;
  textColor?: string | null;
}

export const MobilePricingCTA = ({
  variant,
  category,
  user,
  promotion,
  isPromotionActive,
  onAddToCart,
  textColor,
}: MobilePricingCTAProps) => {
  const displayPrice = isPromotionActive && promotion ? promotion.promotional_price : variant.price;
  const endFmt = promotion
    ? new Date(promotion.end_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    : null;

  return (
    <div className="px-4 py-4 space-y-3" style={textColor ? { color: textColor } : undefined}>
      {/* Product name */}
      <div>
        <h2 className="text-lg font-bold leading-tight">{variant.name}</h2>
        {variant.size && <p className="text-sm text-muted-foreground mt-0.5">{variant.size}</p>}
      </div>

      {/* Price and promotion */}
      {user ? (
        <div className="space-y-2">
          {promotion && isPromotionActive && (
            <div className="inline-flex items-center gap-1 text-[11px] font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full">
              <Flame className="w-3 h-3" />
              <span>Promo até {endFmt}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold">R$ {displayPrice.toFixed(2)}</span>
            {isPromotionActive && promotion && (
              <span className="text-sm text-muted-foreground line-through">
                R$ {promotion.original_price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Faça login para ver preços</p>
      )}

      {/* CTA buttons */}
      {user ? (
        <div className="flex gap-2 pt-2">
          <Button
            onClick={onAddToCart}
            disabled={!variant.available}
            className="flex-1 h-11 text-base font-semibold rounded-xl"
          >
            {variant.available ? "Adicionar ao Carrinho" : "Esgotado"}
          </Button>

          <Button
            onClick={() =>
              shareProductWhatsApp({
                name: variant.name,
                price: variant.price,
                category: category,
              })
            }
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-xl flex-shrink-0"
            aria-label="Compartilhar no WhatsApp"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => (window.location.href = "/auth")}
          className="w-full h-11 text-base font-semibold rounded-xl"
        >
          Entrar para comprar
        </Button>
      )}
    </div>
  );
};
