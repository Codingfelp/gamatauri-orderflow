import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Package } from "lucide-react";
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
}

export const ProductCard = memo(({ product, onAddToCart }: ProductCardProps) => {
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
    <div
      className={`flex-shrink-0 w-full group transition-all duration-300 ${
        isOutOfStock ? "opacity-50" : "hover:-translate-y-1"
      }`}
    >
      {/* Card chip-style com animação hover */}
      <div className="bg-white rounded-2xl border border-border/20 shadow-md hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 overflow-visible">
        {/* Área colorida menor com produto vazando mais */}
        <div className="relative px-2 pt-2">
          <div
            className="relative h-[82px] sm:h-[92px] rounded-xl overflow-visible flex items-center justify-center"
            style={backgroundStyle}
          >
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
                className="w-[95%] h-[160%] object-contain transition-transform duration-300 group-hover:scale-110 -translate-y-5"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Package className="w-8 h-8 text-white/40" />
            )}
          </div>
        </div>

        {/* Info compacta */}
        <div className="p-2 pt-1 space-y-1.5">
          <p className="text-[10px] sm:text-[11px] font-medium text-foreground line-clamp-2 leading-tight min-h-[28px]">
            {product.name}
          </p>

          {user ? (
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs sm:text-sm font-bold text-primary">R$ {product.price.toFixed(2)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isOutOfStock) onAddToCart(product);
                }}
                disabled={isOutOfStock}
                className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
                  isOutOfStock
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-muted/40 text-primary hover:bg-muted"
                }`}
                aria-label="Adicionar ao carrinho"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="w-full text-[9px] text-primary font-medium hover:underline text-center"
            >
              Entrar para ver preço
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";
