import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductVariantModal } from "./ProductVariantModal";
import { ProductGroup, ProductVariant, getProductColor } from "@/utils/productVariants";
import { Product } from "@/services/productsService";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Package } from "lucide-react";

interface ProductVariantCardProps {
  productGroup: ProductGroup;
  onAddToCart: (product: Product) => void;
}

export const ProductVariantCard = ({ productGroup, onAddToCart }: ProductVariantCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
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

  return (
    <>
      <div
        className={`flex-shrink-0 w-full group transition-all duration-300 cursor-pointer ${
          isOutOfStock ? "opacity-50" : "hover:-translate-y-1"
        }`}
        onClick={() => setIsModalOpen(true)}
      >
        {/* Card chip-style com animação hover */}
        <div className="bg-white rounded-2xl border border-border/20 shadow-md hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 overflow-visible">
          {/* Área colorida menor com produto vazando mais */}
          <div className="relative px-2 pt-2">
            <div
              className="relative h-[82px] sm:h-[92px] rounded-xl overflow-hidden flex items-center justify-center"
              style={backgroundStyle}
            >
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center rounded-xl">
                  <span className="text-[8px] font-bold text-white bg-destructive px-1.5 py-0.5 rounded">
                    Esgotado
                  </span>
                </div>
              )}
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={`${baseProduct.brand} ${baseProduct.size || ""}`}
                  loading="lazy"
                  decoding="async"
                  className="max-w-[85%] max-h-[90%] object-contain transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <Package className="w-8 h-8 text-white/40" />
              )}

              {/* Badge de variantes */}
              {variants.length > 1 && (
                <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded-full">
                  +{variants.length - 1}
                </div>
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
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[8px] text-muted-foreground">De</span>
                  <span className="text-xs sm:text-sm font-bold text-primary">R$ {priceRange.min.toFixed(2)}</span>
                </div>
                <button
                  disabled={isOutOfStock}
                  className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
                    isOutOfStock
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-muted/40 text-primary hover:bg-muted"
                  }`}
                  aria-label="Ver opções"
                >
                  <Plus className="h-4 w-4" />
                </button>
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
