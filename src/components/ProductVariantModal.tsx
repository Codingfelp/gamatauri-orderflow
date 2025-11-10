import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { ProductGroup } from "@/utils/productVariants";
import { Product } from "@/services/productsService";
import { useToast } from "@/hooks/use-toast";

interface ProductVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  productGroup: ProductGroup;
  onAddToCart: (product: Product) => void;
}

export const ProductVariantModal = ({ 
  isOpen, 
  onClose, 
  productGroup, 
  onAddToCart 
}: ProductVariantModalProps) => {
  const { baseProduct, variants, brandColor } = productGroup;
  const [selectedVariant, setSelectedVariant] = useState(variants[0]);
  const { toast } = useToast();
  
  const handleAddToCart = () => {
    if (!selectedVariant.available) return;
    
    onAddToCart({
      id: selectedVariant.id,
      name: selectedVariant.name,
      price: selectedVariant.price,
      image_url: selectedVariant.image_url,
      description: null,
      category: baseProduct.category,
      available: selectedVariant.available
    });
    
    toast({
      title: "✅ Adicionado ao carrinho!",
      description: `${selectedVariant.name} - R$ ${selectedVariant.price.toFixed(2)}`
    });
    
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${brandColor} opacity-15`}>
          <motion.div
            className="absolute inset-0"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              backgroundImage: `radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.1) 100%)`
            }}
          />
        </div>
        
        <div className="grid md:grid-cols-2 h-full relative z-10">
          <div className="flex flex-col items-center justify-center p-4 md:p-8 bg-white/60 backdrop-blur-sm">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 md:hidden p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            
            <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${brandColor} rounded-full opacity-20 blur-xl`}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.35, 0.2]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedVariant.id}
                  initial={{ 
                    rotateY: -180, 
                    opacity: 0,
                    scale: 0.8
                  }}
                  animate={{ 
                    rotateY: 0, 
                    opacity: 1,
                    scale: 1
                  }}
                  exit={{ 
                    rotateY: 180, 
                    opacity: 0,
                    scale: 0.8
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                    duration: 0.7
                  }}
                  className="relative z-10 w-4/5 h-4/5"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {selectedVariant.image_url ? (
                    <img
                      src={selectedVariant.image_url}
                      alt={selectedVariant.flavor}
                      className="w-full h-full object-contain drop-shadow-2xl"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${brandColor} opacity-40`} />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            
            <motion.div 
              className="md:hidden mt-4 text-center"
              key={selectedVariant.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-xl font-bold">{selectedVariant.flavor}</h3>
              <p className="text-2xl font-bold text-primary mt-1">
                R$ {selectedVariant.price.toFixed(2)}
              </p>
            </motion.div>
          </div>
          
          <div className="flex flex-col h-full bg-white">
            <DialogHeader className="p-4 md:p-6 border-b">
              <DialogTitle className="text-2xl md:text-3xl font-bold">
                {baseProduct.brand} {baseProduct.size}
              </DialogTitle>
              <DialogDescription className="text-base">
                Escolha seu sabor favorito • {variants.length} opções
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
              {variants.map(variant => (
                <motion.button
                  key={variant.id}
                  onClick={() => variant.available && setSelectedVariant(variant)}
                  disabled={!variant.available}
                  whileHover={variant.available ? { scale: 1.02 } : {}}
                  whileTap={variant.available ? { scale: 0.98 } : {}}
                  className={`w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border-2 transition-all ${
                    selectedVariant.id === variant.id
                      ? `border-primary bg-gradient-to-r ${brandColor} bg-opacity-10 shadow-lg`
                      : variant.available
                      ? 'border-border hover:border-primary/50 bg-white hover:shadow-md'
                      : 'border-border bg-gray-50 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-accent flex-shrink-0 border border-border">
                    {variant.image_url ? (
                      <img 
                        src={variant.image_url}
                        alt={variant.flavor}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${brandColor} opacity-30`} />
                    )}
                  </div>
                  
                  <div className="flex-1 text-left">
                    <h4 className="font-bold text-sm md:text-base">{variant.flavor}</h4>
                    {variant.size && variant.size !== baseProduct.size && (
                      <p className="text-xs text-muted-foreground">{variant.size}</p>
                    )}
                    <p className="text-sm md:text-base font-semibold text-primary mt-0.5">
                      R$ {variant.price.toFixed(2)}
                    </p>
                  </div>
                  
                  {!variant.available ? (
                    <Badge variant="destructive" className="text-xs">Esgotado</Badge>
                  ) : selectedVariant.id === variant.id ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
                    >
                      <Check className="w-5 h-5 text-white" />
                    </motion.div>
                  ) : null}
                </motion.button>
              ))}
            </div>
            
            <div className="p-4 md:p-6 border-t bg-gradient-to-t from-white via-white to-transparent">
              <Button
                onClick={handleAddToCart}
                disabled={!selectedVariant.available}
                className="w-full h-12 md:h-14 text-base md:text-lg font-bold shadow-xl"
                size="lg"
              >
                {selectedVariant.available 
                  ? `Adicionar • R$ ${selectedVariant.price.toFixed(2)}`
                  : 'Produto Indisponível'
                }
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
