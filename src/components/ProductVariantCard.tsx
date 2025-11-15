import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductVariantModal } from "./ProductVariantModal";
import { ProductGroup, ProductVariant, getProductColor } from "@/utils/productVariants";
import { Product } from "@/services/productsService";
import { useAuth } from "@/hooks/useAuth";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";


interface ProductVariantCardProps {
  productGroup: ProductGroup;
  onAddToCart: (product: Product) => void;
}

export const ProductVariantCard = ({ productGroup, onAddToCart }: ProductVariantCardProps) => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const { baseProduct, variants, mainImage, priceRange } = productGroup;
  
  const handleVariantSelected = (variant: ProductVariant) => {
    setSelectedVariant(variant);
  };
  
  const [emblaRef] = useEmblaCarousel(
    { 
      loop: true, 
      align: 'start',
      slidesToScroll: 1,
      containScroll: 'trimSnaps'
    },
    [Autoplay({ delay: 2500, stopOnInteraction: false })]
  );
  
  const firstVariant = variants[0];
  const isOutOfStock = variants.every(v => !v.available);
  
  // Sempre usar o primeiro produto disponível (ou primeiro se todos indisponíveis)
  const initialVariant = variants.find(v => v.available) || variants[0];
  
  // Usar initialVariant para imagem e cores quando nenhum variant está selecionado
  const displayImage = selectedVariant?.image_url || initialVariant.image_url || mainImage;
  
  const productBg = selectedVariant
    ? getProductColor(selectedVariant.name, selectedVariant.flavor, productGroup.baseProduct.category)
    : getProductColor(initialVariant.name, initialVariant.flavor, productGroup.baseProduct.category);

  // DEBUG
  if (process.env.NODE_ENV === 'development') {
    console.log(`📦 Card "${baseProduct.brand}":`, {
      initialVariant: initialVariant.name,
      flavor: initialVariant.flavor,
      color: productBg.value,
      allVariants: variants.map(v => v.name)
    });
  }
  
  const backgroundStyle = productBg.type === 'image'
    ? { backgroundImage: `url(${productBg.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: productBg.value };
  
  const buttonColor = productBg.type === 'color' ? productBg.value : '#4169E1';
  
  return (
    <>
      <Card 
        className="min-h-[420px] group overflow-hidden transition-all duration-300 border-border flex flex-col hover:shadow-xl hover:scale-[1.02] cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div 
          className="relative h-48 md:h-56 overflow-hidden flex items-center justify-center"
          style={backgroundStyle}
        >
          {displayImage ? (
            <img 
              src={displayImage}
              alt={`${baseProduct.brand} ${baseProduct.size || ''}`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
        </div>
        
        <div className="overflow-hidden -mt-6 px-4 mb-3 relative z-10 max-w-[216px] mx-auto" ref={emblaRef}>
          <div className="flex gap-2">
            {variants.map((variant) => {
              // Calcular cor individual de cada variante
            const variantColor = getProductColor(
              variant.name, 
              variant.flavor, 
              productGroup.baseProduct.category
            );
            
            const thumbnailBg = variantColor.type === 'image'
              ? { backgroundImage: `url(${variantColor.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: variantColor.value };
            
            // DEBUG: Verificar cores dos thumbnails
            if (process.env.NODE_ENV === 'development') {
              console.log(`🖼️ Thumbnail ${variant.flavor}:`, {
                name: variant.name,
                flavor: variant.flavor,
                color: variantColor.value
              });
            }
              
              return (
                <div 
                  key={variant.id}
                  className="flex-[0_0_48px] w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow-md"
                  style={variant.image_url ? undefined : thumbnailBg}
                >
                  {variant.image_url ? (
                    <img 
                      src={variant.image_url} 
                      alt={variant.flavor}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div 
                      className="w-full h-full opacity-30" 
                      style={thumbnailBg}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="p-2 md:p-3 space-y-1 flex-1 flex flex-col">
          <h3 className="font-bold text-sm md:text-base text-card-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {baseProduct.category?.toLowerCase().includes('cerveja')
              ? baseProduct.brand.split(' ')[0]
              : (
                <>
                  {baseProduct.brand}
                  {baseProduct.size && variants.some(v => v.flavor && v.flavor !== 'original' && v.flavor !== baseProduct.brand.toLowerCase()) 
                    ? ` ${baseProduct.size}` 
                    : ''}
                </>
              )
            }
          </h3>
          
          <p className="text-xs text-muted-foreground">
            {variants.length} {variants.length === 1 ? 'opção' : 'opções'} disponíveis
          </p>
          
          <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
            {user ? (
              <>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">A partir de</span>
                  <span className="text-lg md:text-xl font-bold text-primary">
                    R$ {priceRange.min.toFixed(2)}
                  </span>
                </div>
                
                <Button 
                  size="sm" 
                  className="font-semibold h-8 text-xs px-3"
                  style={{ 
                    background: buttonColor,
                    color: '#fff',
                    border: 'none'
                  }}
                >
                  Ver Opções
                </Button>
              </>
            ) : (
              <>
                <span className="text-xs text-muted-foreground">Faça login</span>
                <Button 
                  size="sm" 
                  className="font-semibold h-8 text-xs px-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = '/auth';
                  }}
                >
                  Entrar
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
      
      <ProductVariantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productGroup={productGroup}
        onAddToCart={onAddToCart}
        onVariantSelected={handleVariantSelected}
      />
    </>
  );
};
