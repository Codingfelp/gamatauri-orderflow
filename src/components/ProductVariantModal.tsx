import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Share2 } from "lucide-react";
import { shareProductWhatsApp } from "@/utils/shareUtils";
import { ProductGroup, ProductVariant, getProductColor } from "@/utils/productVariants";
import { Product } from "@/services/productsService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/OptimizedImage";

interface ProductVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  productGroup: ProductGroup;
  onAddToCart: (product: Product) => void;
  onVariantSelected?: (variant: ProductVariant) => void;
}

export const ProductVariantModal = ({ isOpen, onClose, productGroup, onAddToCart, onVariantSelected }: ProductVariantModalProps) => {
  const { baseProduct, variants } = productGroup;
  const [selectedVariant, setSelectedVariant] = useState(variants[0]);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Carrossel mobile
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start' });
  
  // Sincronizar carrossel com selectedVariant
  useEffect(() => {
    if (!emblaApi) return;
    const index = variants.findIndex(v => v.id === selectedVariant.id);
    if (index !== -1) {
      emblaApi.scrollTo(index);
    }
  }, [selectedVariant, emblaApi, variants]);
  
  // Atualizar selectedVariant quando carrossel muda
  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap();
      if (variants[index] && variants[index].id !== selectedVariant.id) {
        setSelectedVariant(variants[index]);
      }
    };
    
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, variants, selectedVariant]);
  
  const handleVariantClick = (variant: typeof variants[0]) => {
    if (!variant.available) return;
    
    if (onVariantSelected) {
      onVariantSelected(variant);
    }
    
    onAddToCart({
      id: variant.id,
      name: variant.name,
      price: variant.price,
      image_url: variant.image_url,
      description: null,
      category: baseProduct.category,
      available: variant.available
    });
    toast({
      title: "✅ Adicionado ao carrinho!",
      description: `${variant.name} - R$ ${variant.price.toFixed(2)}`
    });
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0 overflow-hidden bg-background">
        {/* MOBILE: Carrossel + Thumbnails + Info */}
        <div className="flex flex-col md:hidden w-full max-w-full h-full max-h-[90vh] overflow-x-hidden">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors z-50">
            <X className="w-5 h-5 text-white" />
          </button>
          
          {/* Carrossel de imagens no topo */}
          <div className="flex-[0_0_35vh] max-h-[35vh] overflow-hidden relative" ref={emblaRef}>
            <div className="flex h-full">
              {variants.map((variant) => {
                const productBg = getProductColor(variant.name, variant.flavor, baseProduct.category);
                const bgStyle = productBg.type === 'image'
                  ? { backgroundImage: `url(${productBg.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: productBg.value };
                
                return (
                  <div
                    key={variant.id}
                    className="flex-[0_0_100%] flex items-center justify-center relative"
                    style={bgStyle}
                  >
                    {variant.image_url ? (
                      <OptimizedImage
                        src={variant.image_url}
                        alt={variant.flavor}
                        className="max-w-[70%] max-h-[70%]"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-muted opacity-40" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Thumbnails scrolláveis */}
        <div className="flex-[0_0_100px] w-full overflow-x-auto px-3 py-2 bg-background border-t border-b border-border snap-x snap-mandatory scrollbar-hide">
          <div className="flex gap-2 pb-1 min-w-max">
              {variants.map((variant, index) => (
                <button
                  key={variant.id}
                  onClick={() => {
                    setSelectedVariant(variant);
                    emblaApi?.scrollTo(index);
                  }}
                className={cn(
                  "flex-shrink-0 w-16 h-16 min-w-[64px] rounded-lg border-2 overflow-hidden transition-all bg-white snap-start",
                  selectedVariant.id === variant.id
                    ? "border-primary ring-2 ring-primary scale-105"
                    : "border-border hover:border-primary/50"
                )}
                >
                  {variant.image_url ? (
                    <img
                      src={variant.image_url}
                      alt={variant.flavor}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted/30" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Info e botão */}
          <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {baseProduct.brand} {baseProduct.size}
              </h2>
              <p className="text-xl font-semibold text-foreground mb-2">{selectedVariant.name}</p>
              {selectedVariant.size && selectedVariant.size !== baseProduct.size && (
                <p className="text-sm text-muted-foreground">{selectedVariant.size}</p>
              )}
            </div>
            
            {user ? (
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">
                    R$ {selectedVariant.price.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleVariantClick(selectedVariant)}
                    disabled={!selectedVariant.available}
                    className="flex-1 h-12 text-base font-semibold"
                  >
                    {selectedVariant.available ? 'Adicionar ao Carrinho' : 'Esgotado'}
                  </Button>
                  
                  <Button
                    onClick={() => shareProductWhatsApp({ 
                      name: selectedVariant.name, 
                      price: selectedVariant.price, 
                      category: baseProduct.category 
                    })}
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 flex-shrink-0"
                    aria-label="Compartilhar no WhatsApp"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Faça login para ver preços e adicionar ao carrinho</p>
                <Button
                  onClick={() => window.location.href = '/auth'}
                  className="w-full h-12 text-base font-semibold"
                >
                  Entrar
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* DESKTOP: Layout original */}
        <div className="hidden md:grid md:grid-cols-[35%_65%] h-full max-h-[85vh]">
          <div className="flex items-center justify-center p-8 md:p-12 relative md:min-h-[493px] md:max-h-[493px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedVariant.id}
                initial={{ 
                  opacity: 0, 
                  scale: 0.8,
                  rotateY: -25,
                  x: -30
                }}
                animate={(() => {
                  const productBg = getProductColor(selectedVariant.name, selectedVariant.flavor, baseProduct.category);
                  const baseAnimation = { 
                    opacity: 1, 
                    scale: 1,
                    rotateY: 0,
                    x: 0
                  };
                  
                  if (productBg.type === 'image') {
                    return {
                      ...baseAnimation,
                      backgroundImage: `url(${productBg.value})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    };
                  } else {
                    return {
                      ...baseAnimation,
                      backgroundColor: productBg.value
                    };
                  }
                })()}
                exit={{ 
                  opacity: 0, 
                  scale: 0.8,
                  rotateY: 25,
                  x: 30
                }}
                transition={{
                  duration: 0.5,
                  ease: [0.34, 1.56, 0.64, 1],
                  scale: { duration: 0.4 },
                  rotateY: { duration: 0.5 },
                  opacity: { duration: 0.3 }
                }}
                className="w-full h-full max-w-[392.2px] max-h-[493.31px] flex items-center justify-center rounded-3xl"
                style={{ 
                  transformStyle: 'preserve-3d',
                  perspective: '1000px'
                }}
              >
                {selectedVariant.image_url ? (
                  <OptimizedImage 
                    src={selectedVariant.image_url} 
                    alt={selectedVariant.flavor} 
                    className="object-contain" 
                    style={{ 
                      width: '280px',
                      height: '280px',
                      maxWidth: '85%',
                      maxHeight: '85%'
                    }}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-muted opacity-40" />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex flex-col h-full bg-background border-l border-border min-h-0">
            <DialogHeader className="p-4 md:p-6 border-b border-border flex-shrink-0">
              <DialogTitle className="text-2xl md:text-3xl font-bold text-foreground">
                {baseProduct.brand} {baseProduct.size}
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                Clique para adicionar • {variants.length} opções
              </DialogDescription>
            </DialogHeader>
            <div className="relative flex-1 min-h-0">
              <div className="sticky top-0 left-0 right-0 h-6 bg-gradient-to-b from-background via-background to-transparent pointer-events-none z-10" />
              
              <div className="absolute inset-0 overflow-y-auto p-4 md:p-6 space-y-2 scrollbar-hide pt-2">
              {variants.map(variant => (
                <motion.button
                  key={variant.id}
                  onClick={() => handleVariantClick(variant)}
                  onMouseEnter={() => variant.available && setSelectedVariant(variant)}
                  disabled={!variant.available}
                  whileHover={variant.available ? { scale: 1.02 } : {}}
                  whileTap={variant.available ? { scale: 0.98 } : {}}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    selectedVariant.id === variant.id
                      ? 'border-primary bg-primary/5 shadow-md'
                      : variant.available
                      ? 'border-border hover:border-primary/50 bg-card hover:shadow-sm'
                      : 'border-border bg-muted/30 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-foreground">{variant.name}</h4>
                      {variant.size && variant.size !== baseProduct.size && (
                        <p className="text-xs text-muted-foreground mt-0.5">{variant.size}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {user ? (
                        <p className="text-lg font-bold text-primary">R$ {variant.price.toFixed(2)}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Faça login para ver</p>
                      )}
                      {!variant.available && <Badge variant="destructive" className="text-xs">Esgotado</Badge>}
                      {variant.available && selectedVariant.id === variant.id && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
              </div>
              
              <div className="sticky bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background via-background to-transparent pointer-events-none z-10" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
