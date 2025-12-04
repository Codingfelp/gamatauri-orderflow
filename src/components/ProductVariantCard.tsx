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
  
  const buttonColor = productBg.type === 'color' ? productBg.value : '#F5F5F5';
  
  return (
    <>
      <Card 
        className="h-[280px] sm:h-[320px] group overflow-hidden transition-all duration-300 border-0 flex flex-col rounded-lg shadow-md hover:shadow-xl hover:scale-[1.02] cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
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
          {displayImage ? (
            <img 
              src={displayImage}
              alt={`${baseProduct.brand} ${baseProduct.size || ''}`}
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
        
        {/* Carrossel de variantes - sobre a área colorida */}
        <div className="overflow-hidden -mt-6 px-4 mb-2 relative z-10 max-w-[216px] mx-auto" ref={emblaRef}>
          <div className="flex gap-2">
            {variants.map((variant) => {
              const variantColor = getProductColor(
                variant.name, 
                variant.flavor, 
                productGroup.baseProduct.category
              );
              
              const thumbnailBg = variantColor.type === 'image'
                ? { backgroundImage: `url(${variantColor.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: variantColor.value };
              
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
        
        {/* ÁREA BRANCA - 30% */}
        <div className="bg-white h-[30%] p-2.5 flex flex-col justify-between">
          <h3 className={`font-semibold text-xs line-clamp-2 text-foreground transition-colors ${
            !isOutOfStock && 'group-hover:text-primary'
          }`}>
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
          
          {user ? (
            <div className="flex items-stretch gap-0 border border-border rounded-full overflow-hidden h-8">
              <div className="flex items-center gap-1 px-3 bg-white flex-shrink-0">
                <span className="text-[9px] text-muted-foreground whitespace-nowrap">De</span>
                <span className="text-xs font-bold text-primary whitespace-nowrap">
                  R$ {priceRange.min.toFixed(2)}
                </span>
              </div>
              <div className="w-px bg-border" />
              <button
                className={`flex items-center justify-center gap-1 px-3 font-medium text-[10px] transition-colors whitespace-nowrap rounded-r-full ${
                  isOutOfStock
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
                disabled={isOutOfStock}
              >
                <span>{isOutOfStock ? 'Esgotado' : 'Ver Opções'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-stretch gap-0 border border-border rounded-full overflow-hidden h-8">
              <div className="flex items-center justify-center px-3 bg-white">
                <span className="text-[10px] text-muted-foreground">Login para preços</span>
              </div>
              <div className="w-px bg-border" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = '/auth';
                }}
                className="flex items-center justify-center gap-1 px-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-[10px] transition-colors rounded-r-full"
              >
                <span>Entrar</span>
              </button>
            </div>
          )}
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