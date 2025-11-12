import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { parseProductName, getProductColor } from "@/utils/productVariants";

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
  const isOutOfStock = !product.available;
  
  const parsed = product.category 
    ? parseProductName(product.name, product.category)
    : { flavor: 'original' };
  
  const productBg = product.category 
    ? getProductColor(product.name, parsed.flavor, product.category)
    : { type: 'color' as const, value: '#E0E0E0' };
  
  const backgroundStyle = productBg.type === 'image'
    ? { backgroundImage: `url(${productBg.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: productBg.value };
  
  return (
    <Card className={`h-full group overflow-hidden transition-all duration-300 border-border flex flex-col ${
      isOutOfStock 
        ? 'opacity-50 hover:shadow-md' 
        : 'hover:shadow-xl hover:scale-[1.01]'
    }`}>
      <div 
        className="relative aspect-[4/3] md:aspect-square overflow-hidden flex items-center justify-center"
        style={backgroundStyle}
      >
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
            <div className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md font-bold text-sm md:text-base">
              Esgotado
            </div>
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
            fetchPriority="low"
            width="300"
            height="300"
            className={`w-full h-full object-contain transition-transform duration-500 ${
              !isOutOfStock && 'group-hover:scale-110'
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                parent.innerHTML = '<div class="w-full h-full flex flex-col items-center justify-center text-muted-foreground"><svg class="w-16 h-16 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-xs">Imagem indisponível</span></div>';
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
            <svg className="w-16 h-16 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Imagem indisponível</span>
          </div>
        )}
      </div>
      <div className="p-2 md:p-2.5 space-y-1 md:space-y-1.5 flex-1 flex flex-col">
        <h3 className={`font-bold text-xs md:text-sm text-card-foreground line-clamp-1 transition-colors ${
          !isOutOfStock && 'group-hover:text-primary'
        }`}>
          {product.name}
        </h3>
        {product.description && product.description.length < 200 && (
          <p className="hidden md:block text-[10px] text-muted-foreground line-clamp-1 leading-relaxed">
            {product.description.substring(0, 100)}
          </p>
        )}
        <div className="flex items-center justify-between pt-1 md:pt-1.5 border-t border-border mt-auto">
          {user ? (
            <>
              <span className="text-base md:text-xl font-bold text-primary">
                R$ {product.price.toFixed(2)}
              </span>
              <Button
                onClick={() => !isOutOfStock && onAddToCart(product)}
                disabled={isOutOfStock}
                size="sm"
                className={`font-semibold transition-all duration-300 h-7 md:h-8 text-[10px] md:text-xs px-2 md:px-3 ${
                  isOutOfStock
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
              >
                {isOutOfStock ? 'Esgotado' : 'Adicionar'}
              </Button>
            </>
          ) : (
            <>
              <span className="text-xs text-muted-foreground">Login para ver preços</span>
              <Button 
                onClick={() => window.location.href = '/auth'} 
                size="sm"
                className="font-semibold h-7 md:h-8 text-[10px] md:text-xs px-2 md:px-3"
              >
                Entrar
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
});