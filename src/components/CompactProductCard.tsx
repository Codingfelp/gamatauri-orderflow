import { memo } from "react";
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
  const isOutOfStock = !product.available;
  
  const productBg = getProductColor(product.name, '', product.category || '');
  
  return (
    <div 
      className={`flex-shrink-0 w-[100px] sm:w-[110px] group transition-all duration-300 ${
        isOutOfStock ? 'opacity-50' : ''
      }`}
    >
      {/* Card vertical compacto */}
      <div className="bg-white rounded-xl border border-border/30 shadow-sm hover:shadow-md transition-all overflow-hidden">
        {/* Imagem quadrada */}
        <div 
          className="relative aspect-square w-full flex items-center justify-center p-2"
          style={{ background: productBg.value }}
        >
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
              <span className="text-[8px] font-bold text-white bg-destructive px-1.5 py-0.5 rounded">
                Esgotado
              </span>
            </div>
          )}
          {product.image_url && 
           product.image_url !== 'SIM' && 
           !product.image_url.startsWith('data:image') && 
           product.image_url.length > 10 ? (
            <img
              src={product.image_url} 
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <Package className="w-6 h-6 text-muted-foreground/30" />
          )}
        </div>
        
        {/* Info */}
        <div className="p-2 space-y-1">
          <p className="text-[10px] font-medium text-foreground line-clamp-2 leading-tight min-h-[24px]">
            {product.name}
          </p>
          
          {user ? (
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-primary">
                R$ {product.price.toFixed(2)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isOutOfStock) onAddToCart(product);
                }}
                disabled={isOutOfStock}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  isOutOfStock
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-110'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => window.location.href = '/auth'}
              className="w-full text-[9px] text-primary font-medium hover:underline"
            >
              Entrar para ver preço
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

CompactProductCard.displayName = 'CompactProductCard';
