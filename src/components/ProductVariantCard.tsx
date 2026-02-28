import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductVariantModal } from "./ProductVariantModal";
import { ProductGroup, ProductVariant, getProductColor } from "@/utils/productVariants";
import { Product } from "@/services/productsService";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Package, Flame } from "lucide-react";
import { usePromotions } from "@/hooks/usePromotions";
import { useColorEditor } from "@/contexts/ColorEditorContext";

interface ProductVariantCardProps {
  productGroup: ProductGroup;
  onAddToCart: (product: Product) => void;
}

export const ProductVariantCard = ({ productGroup, onAddToCart }: ProductVariantCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const { getPromotionForProduct, isPromotionActive } = usePromotions();
  const { baseProduct, variants, mainImage, priceRange } = productGroup;

  const handleVariantSelected = (variant: ProductVariant) => {
    setSelectedVariant(variant);
  };

  const isOutOfStock = variants.every((v) => !v.available);
  const initialVariant = variants.find((v) => v.available) || variants[0];
  const displayImage = selectedVariant?.image_url || initialVariant.image_url || mainImage;

  const promoForSomeVariant = variants
    .map((v) => getPromotionForProduct(v.id))
    .find((p) => !!p);

  const promoIsActive = promoForSomeVariant ? isPromotionActive(promoForSomeVariant) : false;

  const promoMinPrice = promoForSomeVariant && promoIsActive
    ? Math.min(
        ...variants.map((v) => {
          const p = getPromotionForProduct(v.id);
          return p && isPromotionActive(p) ? p.promotional_price : v.price;
        })
      )
    : null;

  const originalMinForDisplay = promoForSomeVariant && promoIsActive ? priceRange.min : null;

  const { getProductColors } = useColorEditor();
  const displayVariant = selectedVariant || initialVariant;
  const customColors =
    getProductColors(displayVariant.name, baseProduct.category) ??
    variants
      .map((variant) => getProductColors(variant.name, baseProduct.category))
      .find((colors) => !!colors);
  const cardBackgroundColor = customColors?.card_bg_color || customColors?.modal_bg_color;

  // Get product background color for top half
  const productBg = getProductColor(displayVariant.name, displayVariant.flavor, baseProduct.category);
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
        className={`flex-shrink-0 w-full group transition-all duration-300 cursor-pointer ${
          isOutOfStock ? "opacity-50" : "hover:-translate-y-1"
        }`}
        onClick={() => setIsModalOpen(true)}
      >
        <div className={`relative bg-card rounded-xl border border-foreground/20 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
          promoForSomeVariant ? "border-destructive/30" : ""
        }`}>
          {/* Promo badge */}
          {promoForSomeVariant && (
            <div className="absolute top-2.5 left-2.5 z-10">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive text-destructive-foreground">
                <Flame className="w-2.5 h-2.5" />
                {promoIsActive ? "PROMO" : "EM BREVE"}
              </span>
            </div>
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

              {/* Badge de variantes */}
              {variants.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-foreground/60 text-background text-[9px] font-medium px-1.5 py-0.5 rounded-full z-20">
                  +{variants.length - 1}
                </div>
              )}

              {displayImage ? (
                <img
                  src={displayImage}
                  alt={`${baseProduct.brand} ${baseProduct.size || ""}`}
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
              {baseProduct.category?.toLowerCase().includes("cerveja")
                ? baseProduct.brand.split(" ")[0]
                : baseProduct.brand}
            </h3>

            {user ? (
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex flex-col">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-muted-foreground leading-tight">De</span>
                    <span className="text-sm font-bold text-foreground/90 leading-tight">
                      R$ {(promoMinPrice ?? priceRange.min).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  {originalMinForDisplay !== null && (
                    <span className="text-[9px] text-muted-foreground line-through">
                      R$ {originalMinForDisplay.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </div>

                <button
                  disabled={isOutOfStock}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                    isOutOfStock
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                  }`}
                  aria-label="Ver opções"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/auth");
                }}
                className="w-full text-[9px] text-primary font-medium hover:underline text-center mt-1.5"
              >
                Entrar para ver preço
              </button>
            )}
          </div>
        </div>
      </div>

      <ProductVariantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productGroup={productGroup}
        onAddToCart={onAddToCart}
        onVariantSelected={handleVariantSelected}
      />
    </>
  );
};
