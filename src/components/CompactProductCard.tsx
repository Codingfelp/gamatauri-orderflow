import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Package } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getProductColor } from "@/utils/productVariants";
import type { Product } from "@/services/productsService";

interface CompactProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const CompactProductCard = memo(({ product, onAddToCart }: CompactProductCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOutOfStock = !product.available;

  const productBg = getProductColor(product.name, "", product.category || "");

  // Determinar o estilo de background baseado no tipo
  const backgroundStyle =
    productBg.type === "image"
      ? { backgroundImage: `url(${productBg.value})`, backgroundSize: "cover", backgroundPosition: "center" }
      : { background: productBg.value };

  return (
    <div className={`flex-shrink-0 w-[120px] sm:w-[140px] group transition-all duration-300 ${isOutOfStock ? "opacity-50" : "hover:-translate-y-1"}`}>
      {/* Card chip-style para Recomendados - levemente maior com sombra hover */}
      <div className="bg-white rounded-2xl border border-border/20 shadow-md hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 overflow-visible">
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

          {user ? (
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-primary">R$ {product.price.toFixed(2)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isOutOfStock) onAddToCart(product);
                }}
                disabled={isOutOfStock}
                className={`h-6 w-6 rounded-lg flex items-center justify-center transition-colors ${
                  isOutOfStock ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-muted/40 text-primary hover:bg-muted"
                }`}
                aria-label="Adicionar ao carrinho"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
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
