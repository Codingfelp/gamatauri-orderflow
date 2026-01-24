import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductVariantModal } from "./ProductVariantModal";
import { ProductGroup, ProductVariant, getProductColor } from "@/utils/productVariants";
import { Product } from "@/services/productsService";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Package, Flame, Clock } from "lucide-react";
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

  const productBg = selectedVariant
    ? getProductColor(selectedVariant.name, selectedVariant.flavor, productGroup.baseProduct.category)
    : getProductColor(initialVariant.name, initialVariant.flavor, productGroup.baseProduct.category);

  // Determinar o estilo de background baseado no tipo
  const backgroundStyle =
    productBg.type === "image"
      ? {
          backgroundImage: `url(${productBg.value})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : { background: productBg.value };

    const promoForSomeVariant = variants
      .map((v) => getPromotionForProduct(v.id))
      .find((p) => !!p);

    const promoIsActive = promoForSomeVariant ? isPromotionActive(promoForSomeVariant) : false;

    const promoMinPrice = promoForSomeVariant && promoIsActive
      ? Math.min(
          ...variants
            .map((v) => {
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
        {/* Card chip-style com animação hover */}
        <div className={`bg-white rounded-2xl border shadow-md hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 overflow-hidden relative ${
          promoForSomeVariant ? "border-orange-200" : "border-border/20"
        }`}>
          {promoForSomeVariant && (
            <div className="absolute top-1 left-1 z-10 flex items-center gap-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
              <Flame className="w-2 h-2" />
              <span>{promoIsActive ? "PROMO" : "EM BREVE"}</span>
            </div>
          )}

          {/* Área da imagem com fundo colorido na parte inferior */}
          <div className="relative h-[90px] sm:h-[100px] mx-2 mt-2">
            {/* Fundo colorido posicionado na metade inferior */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[45px] sm:h-[50px] rounded-xl"
              style={backgroundStyle}
            >
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center rounded-xl">
                  <span className="text-[8px] font-bold text-white bg-destructive px-1.5 py-0.5 rounded">
                    Esgotado
                  </span>
                </div>
              )}

              {/* Badge de variantes */}
              {variants.length > 1 && (
                <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded-full z-20">
                  +{variants.length - 1}
                </div>
              )}
            </div>
            {/* Imagem centralizada, "vazando" para cima do fundo colorido */}
            <div className="absolute inset-0 flex items-center justify-center p-1">
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
          </div>

          {/* Info compacta */}
          <div className="p-2 pt-1 space-y-1.5">
            <p className="text-[10px] sm:text-[11px] font-medium text-foreground line-clamp-2 leading-tight min-h-[28px]">
              {baseProduct.category?.toLowerCase().includes("cerveja")
                ? baseProduct.brand.split(" ")[0]
                : baseProduct.brand}
            </p>

            {user ? (
              <div className="space-y-0.5">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[8px] text-muted-foreground">De</span>
                    <span className="text-xs sm:text-sm font-bold text-foreground">
                      R$ {(promoMinPrice ?? priceRange.min).toFixed(2)}
                    </span>
                  </div>
                  <button
                    disabled={isOutOfStock}
                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
                      isOutOfStock
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : promoIsActive
                          ? "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                          : "bg-muted/40 text-primary hover:bg-muted"
                    }`}
                    aria-label="Ver opções"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {originalMinForDisplay !== null && (
                  <p className="text-[10px] text-muted-foreground line-through text-center">
                    R$ {originalMinForDisplay.toFixed(2)}
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/auth");
                }}
                className="w-full text-[9px] text-primary font-medium hover:underline text-center"
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
