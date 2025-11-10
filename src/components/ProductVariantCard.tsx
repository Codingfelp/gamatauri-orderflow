import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductVariantModal } from "./ProductVariantModal";
import { ProductGroup } from "@/utils/productVariants";
import { Product } from "@/services/productsService";

interface ProductVariantCardProps {
  productGroup: ProductGroup;
  onAddToCart: (product: Product) => void;
}

export const ProductVariantCard = ({ productGroup, onAddToCart }: ProductVariantCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { baseProduct, variants, mainImage, priceRange, availableCount } = productGroup;
  
  const previewVariants = variants.slice(0, 4);
  const hasMore = variants.length > 4;
  
  return (
    <>
      <Card 
        className="h-full group overflow-hidden transition-all duration-300 border-border flex flex-col hover:shadow-xl hover:scale-[1.02] cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="relative aspect-[4/3] md:aspect-square overflow-hidden bg-accent/10">
          {mainImage ? (
            <img 
              src={mainImage}
              alt={`${baseProduct.brand} ${baseProduct.size || ''}`}
              loading="lazy"
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground shadow-lg font-bold">
            {availableCount} {availableCount === 1 ? 'sabor' : 'sabores'}
          </Badge>
        </div>
        
        <div className="flex justify-center gap-1 px-2 -mt-4 mb-2 relative z-10">
          {previewVariants.map((variant, index) => (
            <div 
              key={variant.id}
              className="w-10 h-10 rounded-full border-2 border-white bg-white overflow-hidden shadow-md"
              style={{ marginLeft: index > 0 ? '-8px' : '0' }}
            >
              {variant.image_url ? (
                <img 
                  src={variant.image_url} 
                  alt={variant.flavor}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${productGroup.brandColor} opacity-30`} />
              )}
            </div>
          ))}
          
          {hasMore && (
            <div className="w-10 h-10 rounded-full border-2 border-white bg-primary flex items-center justify-center text-xs font-bold text-white shadow-md -ml-2">
              +{variants.length - 4}
            </div>
          )}
        </div>
        
        <div className="p-2 md:p-3 space-y-1 flex-1 flex flex-col">
          <h3 className="font-bold text-sm md:text-base text-card-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {baseProduct.brand} {baseProduct.size}
          </h3>
          
          <p className="text-xs text-muted-foreground">
            {variants.length} {variants.length === 1 ? 'opção' : 'opções'} disponíveis
          </p>
          
          <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">A partir de</span>
              <span className="text-lg md:text-xl font-bold text-primary">
                R$ {priceRange.min.toFixed(2)}
              </span>
            </div>
            
            <Button size="sm" className="font-semibold h-8 text-xs px-3">
              Ver Sabores
            </Button>
          </div>
        </div>
      </Card>
      
      <ProductVariantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productGroup={productGroup}
        onAddToCart={onAddToCart}
      />
    </>
  );
};
