import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Package, Clock, Flame, Pencil } from "lucide-react";
import { usePromotions } from "@/hooks/usePromotions";
import { useColorEditor } from "@/contexts/ColorEditorContext";
import { ColorEditorModal } from "@/components/ColorEditorModal";
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

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  wizardMeta?: {
    reasons: string[];
    docura?: string;
    intensidade?: string;
    ocasioes?: string[];
  };
}

export const ProductCard = memo(({ product, onAddToCart, wizardMeta }: ProductCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getPromotionForProduct, isPromotionActive } = usePromotions();
  const { isEditMode, getProductColors } = useColorEditor();
  const [showColorEditor, setShowColorEditor] = useState(false);
  const isOutOfStock = !product.available;

  const promotion = getPromotionForProduct(product.id);
  const hasPromo = !!promotion;
  const promoIsActive = promotion ? isPromotionActive(promotion) : false;

  const customColors = getProductColors(product.name, product.category);
  const cardBackgroundColor = customColors?.card_bg_color || customColors?.modal_bg_color;

  const displayPrice = promoIsActive && promotion ? promotion.promotional_price : product.price;
  const endDate = hasPromo ? new Date(promotion!.end_date) : null;
  const formattedEndDate = endDate?.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const productToAdd = promoIsActive && promotion
      ? { ...product, price: promotion.promotional_price }
      : product;
    onAddToCart(productToAdd);
  };

  // Get product background color for top half
  const productBg = getProductColor(product.name, product.name, product.category || undefined);
  const bgStyle: React.CSSProperties = {};
  if (cardBackgroundColor) {
    bgStyle.backgroundColor = cardBackgroundColor;
  } else if (productBg.type === "image") {
    bgStyle.backgroundImage = `url(${productBg.value})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  } else if (productBg.type === "gradient") {
    bgStyle.background = productBg.value;
  } else {
    bgStyle.backgroundColor = productBg.value;
  }

  return (
    <>
    <div
      className={`flex-shrink-0 w-full group transition-all duration-300 ${
        isOutOfStock ? "opacity-50" : "hover:-translate-y-1"
      }`}
    >
      <div className={`relative bg-card rounded-xl border border-foreground/20 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
        hasPromo ? "border-destructive/30" : ""
      }`}>
        {/* Promo badge */}
        {hasPromo && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive text-destructive-foreground">
              <Flame className="w-2.5 h-2.5" />
              {promoIsActive ? "PROMO" : "EM BREVE"}
            </span>
          </div>
        )}

        {/* Edit mode color button */}
        {isEditMode && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowColorEditor(true); }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-foreground text-background px-3 py-1.5 rounded-full shadow-lg hover:opacity-90 transition-opacity text-[10px] font-medium"
          >
            <Pencil className="w-3 h-3" />
            Editar Cor
          </button>
        )}

        {/* Imagem com cor de fundo do produto - metade inferior */}
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-x-0 bottom-0 h-1/2 rounded-t-2xl"
            style={bgStyle}
          />
          <div className="relative aspect-square flex items-end justify-center px-3 pt-2 pb-3">
            {isOutOfStock && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <span className="text-xs font-bold text-white bg-foreground/70 px-3 py-1 rounded-full">Acabou</span>
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
                className={`w-[85%] h-[85%] object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-md ${isOutOfStock ? "grayscale opacity-60" : ""}`}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Package className="w-8 h-8 text-muted-foreground/40" />
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-2.5">
          <h3 className="text-xs font-medium text-foreground/90 leading-tight line-clamp-2 min-h-[32px]">
            {product.name}
          </h3>

          {/* Promo period */}
          {hasPromo && formattedEndDate && (
            <div className="flex items-center gap-1 text-[9px] text-destructive font-medium mt-1">
              <Clock className="w-2.5 h-2.5" />
              <span>{promoIsActive ? `Até ${formattedEndDate}` : `Começa em breve`}</span>
            </div>
          )}

          {/* Wizard meta */}
          {wizardMeta && wizardMeta.reasons?.length > 0 && (
            <div className="rounded-lg border border-border/40 bg-muted/30 p-1.5 space-y-1 mt-1">
              <p className="text-[9px] font-semibold text-foreground">Por que escolhi isso</p>
              <ul className="text-[9px] text-muted-foreground space-y-0.5">
                {wizardMeta.reasons.slice(0, 3).map((r, idx) => (
                  <li key={idx} className="leading-tight">• {r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Rodapé: Preço + Botão */}
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
                  <span className="text-sm font-bold text-foreground/90">
                    R$ {displayPrice.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart();
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
            <button
              onClick={() => navigate("/auth")}
              className="w-full text-[9px] text-primary font-medium hover:underline text-center mt-1.5"
            >
              Entrar para ver preço
            </button>
          )}
        </div>
      </div>
    </div>
    <ColorEditorModal
      isOpen={showColorEditor}
      onClose={() => setShowColorEditor(false)}
      productName={product.name}
      category={product.category}
    />
    </>
  );
});

ProductCard.displayName = "ProductCard";
