import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard = memo(({ product, onAddToCart }: ProductCardProps) => {
  return (
    <Card className="h-full group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.01] border-border flex flex-col">
      <div className="relative aspect-[4/3] md:aspect-square overflow-hidden bg-accent/10">
        {product.image_url && 
         product.image_url !== 'SIM' && 
         !product.image_url.startsWith('data:image') && 
         product.image_url.length > 10 ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            loading="lazy"
            decoding="async"
            width="300"
            height="300"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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
        <h3 className="font-bold text-xs md:text-sm text-card-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        {product.description && product.description.length < 200 && (
          <p className="hidden md:block text-[10px] text-muted-foreground line-clamp-1 leading-relaxed">
            {product.description.substring(0, 100)}
          </p>
        )}
        <div className="flex items-center justify-between pt-1 md:pt-1.5 border-t border-border mt-auto">
          <span className="text-base md:text-xl font-bold text-primary">
            R$ {product.price.toFixed(2)}
          </span>
          <Button
            onClick={() => onAddToCart(product)}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-300 h-7 md:h-8 text-[10px] md:text-xs px-2 md:px-3"
          >
            Adicionar
          </Button>
        </div>
      </div>
    </Card>
  );
});