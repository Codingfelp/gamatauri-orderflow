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

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.01] border-border">
      <div className="relative aspect-[4/3] overflow-hidden bg-accent/5">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            Sem imagem
          </div>
        )}
        {product.category && (
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/90 text-primary-foreground backdrop-blur-sm">
              {product.category}
            </span>
          </div>
        )}
      </div>
      <div className="p-3 space-y-2">
        <h3 className="font-bold text-base text-card-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-2xl font-bold text-primary">
            R$ {product.price.toFixed(2)}
          </span>
          <Button
            onClick={() => onAddToCart(product)}
            size="default"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-300"
          >
            Adicionar
          </Button>
        </div>
      </div>
    </Card>
  );
};
