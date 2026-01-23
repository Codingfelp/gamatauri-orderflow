import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Share2, Flame, Clock, Pencil } from "lucide-react";
import { shareProductWhatsApp } from "@/utils/shareUtils";
import { ProductGroup, ProductVariant, getProductColor } from "@/utils/productVariants";
import { Product } from "@/services/productsService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePromotions } from "@/hooks/usePromotions";
import { useColorEditor } from "@/contexts/ColorEditorContext";
import { ColorPicker } from "@/components/ColorPicker";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";


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
  const { getPromotionForProduct, isPromotionActive } = usePromotions();
  const { isEditMode, getProductColors, updateColor, saveColors } = useColorEditor();
  const [showColorEditor, setShowColorEditor] = useState(false);
  
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

    const promo = getPromotionForProduct(variant.id);
    const promoActive = promo ? isPromotionActive(promo) : false;
    const finalPrice = promoActive && promo ? promo.promotional_price : variant.price;

    if (onVariantSelected) {
      onVariantSelected(variant);
    }

    onAddToCart({
      id: variant.id,
      name: variant.name,
      price: finalPrice,
      image_url: variant.image_url,
      description: null,
      category: baseProduct.category,
      available: variant.available,
    });
    onClose();
  };
  
  // Obter cores customizadas do produto
  const customColors = getProductColors(selectedVariant.name, baseProduct.category);
  const modalBgColor = customColors?.modal_bg_color;
  const modalTextColor = customColors?.modal_text_color;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        {/* MOBILE: Design moderno e simplificado */}
        <DialogContent className="md:hidden w-[90vw] max-w-[360px] p-0 gap-0 overflow-hidden bg-background rounded-2xl border-0 shadow-2xl">
          {/* Close button */}
          <button 
            onClick={onClose} 
            className="absolute top-3 right-3 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors z-50"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Edit mode button */}
          {isEditMode && (
            <button
              onClick={() => setShowColorEditor(true)}
              className="absolute top-3 left-3 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors z-50"
            >
              <Pencil className="w-4 h-4 text-white" />
            </button>
          )}
          
          {/* Imagem principal com background dinâmico */}
          <div 
            className="relative h-[200px] flex items-center justify-center overflow-hidden"
            style={modalBgColor ? { backgroundColor: modalBgColor } : undefined}
          >
            {(() => {
              const productBg = getProductColor(selectedVariant.name, selectedVariant.flavor, baseProduct.category);
              const bgStyle = !modalBgColor ? (
                productBg.type === 'image'
                  ? { backgroundImage: `url(${productBg.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: productBg.value }
              ) : {};
              
              return (
                <div className="absolute inset-0" style={bgStyle}>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
                </div>
              );
            })()}
            
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedVariant.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                src={selectedVariant.image_url || ''}
                alt={selectedVariant.name}
                className="relative z-10 max-w-[60%] max-h-[160px] object-contain drop-shadow-lg"
              />
            </AnimatePresence>
          </div>

          {/* Thumbnails horizontais */}
          {variants.length > 1 && (
            <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-muted/30 scrollbar-hide">
              {variants.map((variant, index) => (
                <button
                  key={variant.id}
                  onClick={() => {
                    setSelectedVariant(variant);
                    emblaApi?.scrollTo(index);
                  }}
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-xl border-2 overflow-hidden transition-all bg-white",
                    selectedVariant.id === variant.id
                      ? "border-primary ring-2 ring-primary/30 scale-105"
                      : "border-transparent hover:border-primary/30",
                    !variant.available && "opacity-40"
                  )}
                >
                  {variant.image_url ? (
                    <img
                      src={variant.image_url}
                      alt={variant.flavor}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted/50" />
                  )}
                </button>
              ))}
            </div>
          )}
          
          {/* Informações do produto */}
          <div className="px-4 py-4 space-y-3" style={modalTextColor ? { color: modalTextColor } : undefined}>
            {/* Nome do produto selecionado (PRINCIPAL) */}
            <div>
              <h2 className="text-lg font-bold leading-tight">
                {selectedVariant.name}
              </h2>
              {selectedVariant.size && (
                <p className="text-sm text-muted-foreground mt-0.5">{selectedVariant.size}</p>
              )}
            </div>

            {/* Preço e promoção */}
            {(() => {
              const promo = getPromotionForProduct(selectedVariant.id);
              const promoActive = promo ? isPromotionActive(promo) : false;
              const displayPrice = promoActive && promo ? promo.promotional_price : selectedVariant.price;
              const endFmt = promo ? new Date(promo.end_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : null;

              return user ? (
                <div className="space-y-2">
                  {promo && promoActive && (
                    <div className="inline-flex items-center gap-1 text-[11px] font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full">
                      <Flame className="w-3 h-3" />
                      <span>Promo até {endFmt}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">
                      R$ {displayPrice.toFixed(2)}
                    </span>
                    {promoActive && promo && (
                      <span className="text-sm text-muted-foreground line-through">
                        R$ {promo.original_price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Faça login para ver preços</p>
              );
            })()}

            {/* Botão de adicionar */}
            {user ? (
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleVariantClick(selectedVariant)}
                  disabled={!selectedVariant.available}
                  className="flex-1 h-11 text-base font-semibold rounded-xl"
                >
                  {selectedVariant.available ? "Adicionar ao Carrinho" : "Esgotado"}
                </Button>

                <Button
                  onClick={() =>
                    shareProductWhatsApp({
                      name: selectedVariant.name,
                      price: selectedVariant.price,
                      category: baseProduct.category,
                    })
                  }
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-xl flex-shrink-0"
                  aria-label="Compartilhar no WhatsApp"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => (window.location.href = "/auth")} 
                className="w-full h-11 text-base font-semibold rounded-xl"
              >
                Entrar para comprar
              </Button>
            )}
          </div>
        </DialogContent>
        
        {/* DESKTOP: Layout original */}
        <DialogContent className="hidden md:grid md:grid-cols-[35%_65%] max-w-5xl max-h-[90vh] p-0 gap-0 overflow-hidden bg-background">
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
                  <img 
                    src={selectedVariant.image_url} 
                    alt={selectedVariant.flavor} 
                    loading="lazy"
                    decoding="async"
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
              {variants.map(variant => {
                const promo = getPromotionForProduct(variant.id);
                const promoActive = promo ? isPromotionActive(promo) : false;
                const displayPrice = promoActive && promo ? promo.promotional_price : variant.price;

                return (
                  <motion.button
                    key={variant.id}
                    onClick={() => handleVariantClick(variant)}
                    onMouseEnter={() => variant.available && setSelectedVariant(variant)}
                    disabled={!variant.available || (!!promo && !promoActive)}
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
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          {variant.name}
                          {promo && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-0.5 rounded-full">
                              <Flame className="w-3 h-3" />
                              {promoActive ? 'Promo' : 'Em breve'}
                            </span>
                          )}
                        </h4>
                        {variant.size && variant.size !== baseProduct.size && (
                          <p className="text-xs text-muted-foreground mt-0.5">{variant.size}</p>
                        )}
                        {promo && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {promoActive
                              ? `até ${new Date(promo.end_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
                              : `começa ${new Date(promo.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {user ? (
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">R$ {displayPrice.toFixed(2)}</p>
                            {promoActive && promo && (
                              <p className="text-xs text-muted-foreground line-through">R$ {promo.original_price.toFixed(2)}</p>
                            )}
                          </div>
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
                );
              })}
              </div>
              
              <div className="sticky bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background via-background to-transparent pointer-events-none z-10" />
            </div>
          </div>
        
        {/* Edit mode color picker - floating at bottom (DESKTOP ONLY) */}
        {isEditMode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 hidden md:block">
            <div className="flex gap-2 bg-black/90 backdrop-blur-md rounded-full px-4 py-2 shadow-xl border border-white/20">
              <ColorPicker
                currentColor={getProductColors(selectedVariant.name, baseProduct.category)?.modal_bg_color || '#ffffff'}
                onChange={(color) => updateColor(selectedVariant.name, baseProduct.category, 'modal_bg_color', color)}
                label="Fundo Modal"
              />
              <ColorPicker
                currentColor={getProductColors(selectedVariant.name, baseProduct.category)?.modal_text_color || '#000000'}
                onChange={(color) => updateColor(selectedVariant.name, baseProduct.category, 'modal_text_color', color)}
                label="Texto Modal"
              />
            </div>
          </div>
        )}
        </DialogContent>
      </Dialog>

      {/* Color Editor Sheet for Mobile */}
      <Sheet open={showColorEditor} onOpenChange={setShowColorEditor}>
        <SheetContent side="bottom" className="rounded-t-2xl z-[100]">
          <SheetHeader>
            <SheetTitle>Editar Cores - {selectedVariant.name}</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Cor de Fundo do Modal</label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-border shadow-inner"
                  style={{ backgroundColor: getProductColors(selectedVariant.name, baseProduct.category)?.modal_bg_color || '#f5f5f5' }}
                />
                <ColorPicker
                  currentColor={getProductColors(selectedVariant.name, baseProduct.category)?.modal_bg_color || '#f5f5f5'}
                  onChange={(color) => updateColor(selectedVariant.name, baseProduct.category, 'modal_bg_color', color)}
                  label="Alterar"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Cor do Texto</label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-border shadow-inner flex items-center justify-center"
                  style={{ backgroundColor: getProductColors(selectedVariant.name, baseProduct.category)?.modal_text_color || '#1a1a1a' }}
                >
                  <span className="text-white text-xs font-bold drop-shadow">Aa</span>
                </div>
                <ColorPicker
                  currentColor={getProductColors(selectedVariant.name, baseProduct.category)?.modal_text_color || '#1a1a1a'}
                  onChange={(color) => updateColor(selectedVariant.name, baseProduct.category, 'modal_text_color', color)}
                  label="Alterar"
                />
              </div>
            </div>
            
            <Button 
              onClick={async () => {
                try {
                  await saveColors();
                  toast({ 
                    title: "✅ Cores salvas!",
                    description: `Cores do produto "${selectedVariant.name}" foram atualizadas.`
                  });
                  setShowColorEditor(false);
                } catch (error) {
                  console.error('Erro ao salvar cores:', error);
                  toast({ 
                    title: "❌ Erro ao salvar",
                    description: "Tente novamente.",
                    variant: "destructive"
                  });
                }
              }} 
              className="w-full h-12 text-base font-semibold"
            >
              💾 Salvar Cores
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
