import { memo } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Plus } from "lucide-react";


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
  
  return (
    <Card className={`h-full group overflow-hidden transition-all duration-300 border-border flex flex-col rounded-xl ${
      isOutOfStock 
        ? 'opacity-50 hover:shadow-md' 
        : 'hover:shadow-xl hover:scale-[1.01]'
    }`}>
      <div className="relative aspect-square overflow-hidden flex items-center justify-center bg-gray-50 p-2">
        
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
            className={`w-full h-full object-contain p-2 transition-transform duration-500 ${
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
      <div className="p-2 space-y-1 flex-1 flex flex-col">
        <h3 className={`font-semibold text-sm text-foreground line-clamp-2 mb-2 transition-colors ${
          !isOutOfStock && 'group-hover:text-primary'
        }`}>
          {product.name}
        </h3>
        <div className="mt-auto">
          {user ? (
            <div className="flex items-stretch gap-0 border border-border rounded-full overflow-hidden h-9">
              <div className="flex items-center justify-center px-3 bg-background">
                <span className="text-sm font-bold text-primary">
                  R$ {product.price.toFixed(2)}
                </span>
              </div>
              <div className="w-px bg-border" />
              <button
                onClick={() => !isOutOfStock && onAddToCart(product)}
                disabled={isOutOfStock}
                className={`flex items-center justify-center gap-1.5 px-4 font-medium text-xs transition-colors ${
                  isOutOfStock
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{isOutOfStock ? 'Esgotado' : 'Adicionar'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-stretch gap-0 border border-border rounded-full overflow-hidden h-9">
              <div className="flex items-center justify-center px-3 bg-background">
                <span className="text-xs text-muted-foreground">Login para ver preços</span>
              </div>
              <div className="w-px bg-border" />
              <button
                onClick={() => window.location.href = '/auth'}
                className="flex items-center justify-center gap-1.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs transition-colors"
              >
                <span>Entrar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});