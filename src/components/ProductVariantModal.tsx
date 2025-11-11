import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { ProductGroup, ProductVariant, getProductColor } from "@/utils/productVariants";
import { Product } from "@/services/productsService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden bg-background">
        <div className="grid md:grid-cols-[35%_65%] h-full max-h-[85vh]">
          <div className="flex items-center justify-center p-8 md:p-12 relative md:min-h-[493px] md:max-h-[493px]">
            <button onClick={onClose} className="absolute top-4 right-4 md:hidden p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors z-20">
              <X className="w-5 h-5 text-white" />
            </button>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedVariant.id}
                initial={{ 
                  opacity: 0, 
                  scale: 0.8,
                  rotateY: -25,
                  x: -30
                }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  rotateY: 0,
                  x: 0,
                  backgroundColor: getProductColor(selectedVariant.name, selectedVariant.flavor) || '#4169E1'
                }}
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
                  opacity: { duration: 0.3 },
                  backgroundColor: { duration: 0.3 }
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
