import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductVariantModal } from "./ProductVariantModal";
import { ProductGroup, ProductVariant } from "@/utils/productVariants";
import { Product } from "@/services/productsService";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Package, Flame } from "lucide-react";
import { usePromotions } from "@/hooks/usePromotions";

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

  return (
    <>
      <div
        className={`flex-shrink-0 w-full group transition-all duration-300 cursor-pointer ${
          isOutOfStock ? "opacity-50" : "hover:-translate-y-1"
        }`}
        onClick={() => setIsModalOpen(true)}
      >
        {/* Card elegante estilo FeitosParaVoce */}
        <div className={`relative bg-card rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
          promoForSomeVariant ? "border-destructive/30" : "border-border"
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

          {/* Imagem aspect-square */}
          <div className="aspect-square bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center p-6 relative overflow-hidden">
            {isOutOfStock && (
              <div className="absolute inset-0 bg-background/60 z-10 flex items-center justify-center">
                <span className="text-[10px] font-bold text-destructive-foreground bg-destructive px-2 py-0.5 rounded">Esgotado</span>
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
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Package className="w-8 h-8 text-muted-foreground/40" />
            )}
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
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[8px] text-muted-foreground">De</span>
                    <span className="text-sm font-bold text-foreground/90">
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
