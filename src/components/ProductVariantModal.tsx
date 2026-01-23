import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Flame, Clock, Pencil } from "lucide-react";
import { ProductGroup, ProductVariant, getProductColor } from "@/utils/productVariants";
import { Product } from "@/services/productsService";
import { useAuth } from "@/hooks/useAuth";
import { usePromotions } from "@/hooks/usePromotions";
import { useColorEditor } from "@/contexts/ColorEditorContext";
import { ColorEditorModal } from "@/components/ColorEditorModal";
import { useIsMobile } from "@/hooks/use-mobile";

// Mobile subcomponents
import {
  MobileMediaCarousel,
  MobileThumbnails,
  MobilePricingCTA,
  MobileCloseButton,
} from "@/components/product-modal";

interface ProductVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  productGroup: ProductGroup;
  onAddToCart: (product: Product) => void;
  onVariantSelected?: (variant: ProductVariant) => void;
}

export const ProductVariantModal = ({
  isOpen,
  onClose,
  productGroup,
  onAddToCart,
  onVariantSelected,
}: ProductVariantModalProps) => {
  const { baseProduct, variants } = productGroup;
  const [selectedVariant, setSelectedVariant] = useState(variants[0]);
  const { user } = useAuth();
  const { getPromotionForProduct, isPromotionActive } = usePromotions();
  const { isEditMode, getProductColors } = useColorEditor();
  const [showColorEditor, setShowColorEditor] = useState(false);
  const [liveModalBgColor, setLiveModalBgColor] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const isMobileViewport =
    isMobile || (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches);

  // Custom colors
  const customColors = getProductColors(selectedVariant.name, baseProduct.category);
  const modalBgColor = liveModalBgColor || customColors?.modal_bg_color;
  const modalTextColor = customColors?.modal_text_color;

  // Reset live color when variant changes
  useEffect(() => {
    setLiveModalBgColor(null);
  }, [selectedVariant.id]);

  // Handle add to cart
  const handleAddToCart = useCallback(() => {
    if (!selectedVariant.available) return;

    const promo = getPromotionForProduct(selectedVariant.id);
    const promoActive = promo ? isPromotionActive(promo) : false;
    const finalPrice = promoActive && promo ? promo.promotional_price : selectedVariant.price;

    onVariantSelected?.(selectedVariant);

    onAddToCart({
      id: selectedVariant.id,
      name: selectedVariant.name,
      price: finalPrice,
      image_url: selectedVariant.image_url,
      description: null,
      category: baseProduct.category,
      available: selectedVariant.available,
    });
    onClose();
  }, [selectedVariant, getPromotionForProduct, isPromotionActive, onVariantSelected, onAddToCart, onClose, baseProduct.category]);

  // Promotion info for current variant
  const promo = getPromotionForProduct(selectedVariant.id);
  const promoActive = promo ? isPromotionActive(promo) : false;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        {isMobileViewport ? (
          /* MOBILE: Modular design */
          <DialogContent
            className="md:hidden w-[90vw] max-w-[360px] p-0 gap-0 overflow-hidden bg-background rounded-2xl border-0 shadow-2xl [&>button:last-child]:hidden"
            // Important: block event bubbling to avoid click-through behind the modal
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            // Keep only X / outside to close (no ESC)
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <MobileCloseButton onClose={onClose} />

            <MobileMediaCarousel
              variants={variants}
              selectedVariant={selectedVariant}
              onVariantChange={setSelectedVariant}
              modalBgColor={modalBgColor}
              category={baseProduct.category}
              isEditMode={isEditMode}
              onEditClick={() => setShowColorEditor(true)}
            />

            <MobileThumbnails
              variants={variants}
              selectedVariant={selectedVariant}
              onSelect={(variant) => setSelectedVariant(variant)}
            />

            <MobilePricingCTA
              variant={selectedVariant}
              category={baseProduct.category}
              user={user}
              promotion={promo}
              isPromotionActive={promoActive}
              onAddToCart={handleAddToCart}
              textColor={modalTextColor}
            />
          </DialogContent>
        ) : (
          /* DESKTOP: Original layout */
          <DialogContent className="hidden md:grid md:grid-cols-[35%_65%] max-w-5xl max-h-[90vh] p-0 gap-0 overflow-hidden bg-background">
          <div className="flex items-center justify-center p-8 md:p-12 relative md:min-h-[493px] md:max-h-[493px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedVariant.id}
                initial={{ opacity: 0, scale: 0.8, rotateY: -25, x: -30 }}
                animate={(() => {
                  const productBg = getProductColor(selectedVariant.name, selectedVariant.flavor, baseProduct.category);
                  const baseAnimation = { opacity: 1, scale: 1, rotateY: 0, x: 0 };

                  if (productBg.type === "image") {
                    return {
                      ...baseAnimation,
                      backgroundImage: `url(${productBg.value})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    };
                  }
                  return { ...baseAnimation, backgroundColor: productBg.value };
                })()}
                exit={{ opacity: 0, scale: 0.8, rotateY: 25, x: 30 }}
                transition={{
                  duration: 0.5,
                  ease: [0.34, 1.56, 0.64, 1],
                  scale: { duration: 0.4 },
                  rotateY: { duration: 0.5 },
                  opacity: { duration: 0.3 },
                }}
                className="w-full h-full max-w-[392.2px] max-h-[493.31px] flex items-center justify-center rounded-3xl"
                style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
              >
                {selectedVariant.image_url ? (
                  <img
                    src={selectedVariant.image_url}
                    alt={selectedVariant.flavor}
                    loading="lazy"
                    decoding="async"
                    className="object-contain"
                    style={{ width: "280px", height: "280px", maxWidth: "85%", maxHeight: "85%" }}
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
                {variants.map((variant) => {
                  const variantPromo = getPromotionForProduct(variant.id);
                  const variantPromoActive = variantPromo ? isPromotionActive(variantPromo) : false;
                  const displayPrice = variantPromoActive && variantPromo ? variantPromo.promotional_price : variant.price;

                  return (
                    <motion.button
                      key={variant.id}
                      onClick={() => {
                        if (!variant.available) return;

                        const finalPrice = variantPromoActive && variantPromo ? variantPromo.promotional_price : variant.price;
                        onVariantSelected?.(variant);

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
                      }}
                      onMouseEnter={() => variant.available && setSelectedVariant(variant)}
                      disabled={!variant.available || (!!variantPromo && !variantPromoActive)}
                      whileHover={variant.available ? { scale: 1.02 } : {}}
                      whileTap={variant.available ? { scale: 0.98 } : {}}
                      className={`w-full p-4 rounded-lg border-2 transition-all ${
                        selectedVariant.id === variant.id
                          ? "border-primary bg-primary/5 shadow-md"
                          : variant.available
                          ? "border-border hover:border-primary/50 bg-card hover:shadow-sm"
                          : "border-border bg-muted/30 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1 text-left">
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            {variant.name}
                            {variantPromo && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-0.5 rounded-full">
                                <Flame className="w-3 h-3" />
                                {variantPromoActive ? "Promo" : "Em breve"}
                              </span>
                            )}
                          </h4>
                          {variant.size && variant.size !== baseProduct.size && (
                            <p className="text-xs text-muted-foreground mt-0.5">{variant.size}</p>
                          )}
                          {variantPromo && (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {variantPromoActive
                                ? `até ${new Date(variantPromo.end_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`
                                : `começa ${new Date(variantPromo.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {user ? (
                            <div className="text-right">
                              <p className="text-lg font-bold text-foreground">R$ {displayPrice.toFixed(2)}</p>
                              {variantPromoActive && variantPromo && (
                                <p className="text-xs text-muted-foreground line-through">
                                  R$ {variantPromo.original_price.toFixed(2)}
                                </p>
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

          {/* Edit mode floating button */}
          {isEditMode && (
            <button
              onClick={() => setShowColorEditor(true)}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 hidden md:flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-xl hover:opacity-90 transition-opacity"
            >
              <Pencil className="w-4 h-4" />
              <span className="text-sm font-medium">Editar Cor de Fundo</span>
            </button>
          )}
          </DialogContent>
        )}
      </Dialog>

      {/* Color Editor Modal */}
      <ColorEditorModal
        isOpen={showColorEditor}
        onClose={() => setShowColorEditor(false)}
        productName={selectedVariant.name}
        category={baseProduct.category}
        onColorChange={(color) => setLiveModalBgColor(color)}
      />
    </>
  );
};
