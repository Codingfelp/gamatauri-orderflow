import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Flame, Share2, Minus, Plus } from "lucide-react";
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
  onAddToCart: (quantity: number) => void;
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
  const [quantity, setQuantity] = useState(1);
  const displayPrice = isPromotionActive && promotion ? promotion.promotional_price : variant.price;
  const unitTotal = displayPrice * quantity;
  const endFmt = promotion
    ? new Date(promotion.end_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    : null;
  
  const handleIncrement = () => setQuantity((q) => q + 1);
  const handleDecrement = () => setQuantity((q) => Math.max(1, q - 1));
  
  const handleAddToCart = () => {
    onAddToCart(quantity);
    setQuantity(1); // Reset após adicionar
  };

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

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">R$ {displayPrice.toFixed(2)}</span>
              {isPromotionActive && promotion && (
                <span className="text-sm text-muted-foreground line-through">
                  R$ {promotion.original_price.toFixed(2)}
                </span>
              )}
            </div>
            
            {/* Quantity selector */}
            <div className="flex items-center border border-border rounded-full bg-muted/30">
              <button
                onClick={handleDecrement}
                disabled={quantity <= 1}
                className="h-9 w-9 flex items-center justify-center rounded-l-full hover:bg-muted disabled:opacity-40 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-semibold text-base">{quantity}</span>
              <button
                onClick={handleIncrement}
                className="h-9 w-9 flex items-center justify-center rounded-r-full hover:bg-muted transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Faça login para ver preços</p>
      )}

      {/* CTA buttons */}
      {user ? (
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleAddToCart}
            disabled={!variant.available}
            className="flex-1 h-11 text-base font-semibold rounded-xl"
          >
            {variant.available ? (
              <span className="flex items-center gap-2">
                Adicionar
                <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm">
                  R$ {unitTotal.toFixed(2)}
                </span>
              </span>
            ) : (
              "Esgotado"
            )}
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
