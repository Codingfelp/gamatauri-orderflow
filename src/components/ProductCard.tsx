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
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.01] border-border">
      <div className="relative aspect-[4/3] md:aspect-square overflow-hidden bg-accent/5">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            Sem imagem
          </div>
        )}
      </div>
      <div className="p-2 md:p-2.5 space-y-1 md:space-y-1.5">
        <h3 className="font-bold text-xs md:text-sm text-card-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="hidden md:block text-[10px] text-muted-foreground line-clamp-1 leading-relaxed">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between pt-1 md:pt-1.5 border-t border-border">
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