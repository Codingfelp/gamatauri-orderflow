import { memo } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Plus } from "lucide-react";
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
  const isOutOfStock = !product.available;
  
  // Cores de identidade do produto
  const productBg = getProductColor(
    product.name,
    '', 
    product.category || ''
  );
  
  const backgroundStyle = productBg.type === 'image'
    ? { backgroundImage: `url(${productBg.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: productBg.value };
  
  return (
    <Card className={`h-[280px] sm:h-[320px] group overflow-hidden transition-all duration-300 border-0 flex flex-col rounded-lg shadow-md ${
      isOutOfStock 
        ? 'opacity-50' 
        : 'hover:shadow-xl hover:scale-[1.01]'
    }`}>
      {/* ÁREA COLORIDA - 70% */}
      <div 
        className="relative h-[70%] overflow-hidden flex items-center justify-center p-3"
        style={backgroundStyle}
      >
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
            <div className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md font-bold text-sm">
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
            className={`w-full h-full object-contain transition-transform duration-500 ${
              !isOutOfStock && 'group-hover:scale-110'
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                parent.innerHTML = '<div class="w-full h-full flex flex-col items-center justify-center text-white/60"><svg class="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-[10px]">Imagem indisponível</span></div>';
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/60">
            <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px]">Imagem indisponível</span>
          </div>
        )}
      </div>
      
      {/* ÁREA BRANCA - 30% */}
      <div className="bg-white h-[30%] p-2.5 flex flex-col justify-between">
        <h3 className={`font-semibold text-xs line-clamp-2 text-foreground transition-colors ${
          !isOutOfStock && 'group-hover:text-primary'
        }`}>
          {product.name}
        </h3>
        
        {user ? (
          <div className="flex items-stretch gap-0 border border-border rounded-full overflow-hidden h-8">
            <div className="flex items-center justify-center px-3 bg-white">
              <span className="text-sm font-bold text-primary">
                R$ {product.price.toFixed(2)}
              </span>
            </div>
            <div className="w-px bg-border" />
            <button
              onClick={() => !isOutOfStock && onAddToCart(product)}
              disabled={isOutOfStock}
              className={`flex items-center justify-center gap-1 px-3 font-medium text-[10px] transition-colors ${
                isOutOfStock
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              }`}
            >
              <Plus className="h-3 w-3" />
              <span>{isOutOfStock ? 'Esgotado' : 'Adicionar'}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-stretch gap-0 border border-border rounded-full overflow-hidden h-8">
            <div className="flex items-center justify-center px-3 bg-white">
              <span className="text-[10px] text-muted-foreground">Login para preços</span>
            </div>
            <div className="w-px bg-border" />
            <button
              onClick={() => window.location.href = '/auth'}
              className="flex items-center justify-center gap-1 px-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-[10px] transition-colors"
            >
              <span>Entrar</span>
            </button>
          </div>
        )}
      </div>
    </Card>
  );
});