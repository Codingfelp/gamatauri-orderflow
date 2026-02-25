import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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

  // Handle add to cart (with quantity support for mobile)
  const handleAddToCart = useCallback((quantity: number = 1) => {
    if (!selectedVariant.available) return;

    const promo = getPromotionForProduct(selectedVariant.id);
    const promoActive = promo ? isPromotionActive(promo) : false;
    const finalPrice = promoActive && promo ? promo.promotional_price : selectedVariant.price;

    onVariantSelected?.(selectedVariant);

    for (let i = 0; i < quantity; i++) {
      onAddToCart({
        id: selectedVariant.id,
        name: selectedVariant.name,
        price: finalPrice,
        image_url: selectedVariant.image_url,
        description: null,
        category: baseProduct.category,
        available: selectedVariant.available,
      });
    }
    onClose();
  }, [selectedVariant, getPromotionForProduct, isPromotionActive, onVariantSelected, onAddToCart, onClose, baseProduct.category]);

  // Promotion info for current variant
  const promo = getPromotionForProduct(selectedVariant.id);
  const promoActive = promo ? isPromotionActive(promo) : false;

  // Product background for desktop image area
  const productBg = getProductColor(selectedVariant.name, selectedVariant.flavor, baseProduct.category);
  const desktopBgStyle: React.CSSProperties = {};
  if (modalBgColor) {
    desktopBgStyle.backgroundColor = modalBgColor;
  } else if (productBg.type === "image") {
    desktopBgStyle.backgroundImage = `url(${productBg.value})`;
    desktopBgStyle.backgroundSize = "cover";
    desktopBgStyle.backgroundPosition = "center";
  } else if (productBg.type === "gradient") {
    desktopBgStyle.background = productBg.value;
  } else {
    desktopBgStyle.backgroundColor = productBg.value;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        {isMobileViewport ? (
          /* MOBILE: Modular design */
          <DialogContent
            className="md:hidden w-[90vw] max-w-[360px] p-0 gap-0 overflow-hidden bg-background rounded-2xl border-0 shadow-2xl [&>button:last-child]:hidden"
            onPointerDown={(e) => {
              // Allow close button clicks through
              if ((e.target as HTMLElement).closest('[data-close-button]')) return;
              e.stopPropagation();
            }}
            onPointerUp={(e) => {
              if ((e.target as HTMLElement).closest('[data-close-button]')) return;
              e.stopPropagation();
            }}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('[data-close-button]')) return;
              e.stopPropagation();
            }}
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
              onAddToCart={(qty) => handleAddToCart(qty)}
              textColor={modalTextColor}
            />
          </DialogContent>
        ) : (
          /* DESKTOP: Clean, modern layout inspired by reference */
          <DialogContent className="hidden md:grid md:grid-cols-[35%_65%] max-w-4xl max-h-[85vh] p-0 gap-0 overflow-hidden bg-background rounded-2xl border border-foreground/10 shadow-xl [&>button:last-child]:top-4 [&>button:last-child]:right-4">
            {/* Left: Product image with colored background */}
            <div className="flex items-center justify-center relative" style={{ minHeight: "420px" }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedVariant.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="w-full h-full flex items-center justify-center rounded-l-2xl"
                  style={desktopBgStyle}
                >
                  {selectedVariant.image_url ? (
                    <img
                      src={selectedVariant.image_url}
                      alt={selectedVariant.flavor}
                      loading="lazy"
                      decoding="async"
                      className="object-contain drop-shadow-lg"
                      style={{ width: "220px", height: "220px", maxWidth: "75%", maxHeight: "75%" }}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-muted/20 opacity-40" />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Edit mode button */}
              {isEditMode && (
                <button
                  onClick={() => setShowColorEditor(true)}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-foreground text-background px-3 py-1.5 rounded-full shadow-lg hover:opacity-90 transition-opacity text-xs font-medium"
                >
                  <Pencil className="w-3 h-3" />
                  Editar Cor
                </button>
              )}
            </div>

            {/* Right: Variant list */}
            <div className="flex flex-col h-full min-h-0">
              <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
                <DialogTitle className="text-2xl font-bold text-foreground tracking-tight">
                  {baseProduct.brand} {baseProduct.size}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Clique para adicionar • {variants.length} opções
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 space-y-1 scrollbar-hide">
                {variants.map((variant) => {
                  const variantPromo = getPromotionForProduct(variant.id);
                  const variantPromoActive = variantPromo ? isPromotionActive(variantPromo) : false;
                  const displayPrice = variantPromoActive && variantPromo ? variantPromo.promotional_price : variant.price;
                  const isSelected = selectedVariant.id === variant.id;

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
                      whileHover={variant.available ? { scale: 1.01 } : {}}
                      whileTap={variant.available ? { scale: 0.99 } : {}}
                      className={`w-full px-4 py-3 rounded-lg border transition-all text-left ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : variant.available
                          ? "border-border/60 hover:border-foreground/20 bg-background"
                          : "border-border/30 bg-muted/20 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                            {variant.name}
                            {variantPromo && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full">
                                <Flame className="w-2.5 h-2.5" />
                                {variantPromoActive ? "Promo" : "Em breve"}
                              </span>
                            )}
                          </h4>
                          {variantPromo && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
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
                              <p className="text-sm font-semibold text-foreground">R$ {displayPrice.toFixed(2)}</p>
                              {variantPromoActive && variantPromo && (
                                <p className="text-[11px] text-muted-foreground line-through">
                                  R$ {variantPromo.original_price.toFixed(2)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Faça login</p>
                          )}
                          {!variant.available && <Badge variant="destructive" className="text-[10px]">Esgotado</Badge>}
                          {variant.available && isSelected && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
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
