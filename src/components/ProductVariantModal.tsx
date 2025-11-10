import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

const getProductColor = (productName: string, flavor: string): string => {
  const key = `${productName.toLowerCase()}-${flavor.toLowerCase()}`;
  const colorMap: Record<string, string> = {
    'baly-tradicional': '#FFD700', 'baly-original': '#FFD700', 'baly-tropicall': '#FFA500',
    'baly-coco e açaí': '#87CEEB', 'baly-coco e acai': '#87CEEB', 'baly-freegels cereja': '#DC143C',
    'baly-maçã verde': '#90EE90', 'baly-maca verde': '#90EE90',
    'tial-laranja': '#FFD700', 'tial-uva': '#9370DB', 'maguary-laranja': '#CD5C5C', 'maguary-uva': '#8B008B',
    'del valle-laranja': '#FFA500', 'red bull-tradicional': '#4169E1', 'monster-original': '#90EE90'
  };
  for (const [mapKey, color] of Object.entries(colorMap)) {
    if (key.includes(mapKey)) return color;
  }
  const lowerName = productName.toLowerCase();
  if (lowerName.includes('baly')) return '#FFD700';
  if (lowerName.includes('tial')) return '#FFD700';
  if (lowerName.includes('maguary')) return '#CD5C5C';
  if (lowerName.includes('coca')) return '#DC143C';
  if (lowerName.includes('pepsi')) return '#4169E1';
  return '#E0E0E0';
};

export const ProductVariantModal = ({ isOpen, onClose, productGroup, onAddToCart }: ProductVariantModalProps) => {
  const { baseProduct, variants } = productGroup;
  const [selectedVariant, setSelectedVariant] = useState(variants[0]);
  const { toast } = useToast();
  
  const handleVariantClick = (variant: typeof variants[0]) => {
    if (!variant.available) return;
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
      <DialogContent className="max-w-5xl h-[85vh] p-0 overflow-hidden bg-background">
        <div className="grid md:grid-cols-2 h-full">
          <div className="flex items-center justify-center p-8 md:p-12 relative">
            <button onClick={onClose} className="absolute top-4 right-4 md:hidden p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors z-20">
              <X className="w-5 h-5 text-white" />
            </button>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedVariant.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full h-full flex items-center justify-center rounded-3xl"
                style={{ backgroundColor: getProductColor(selectedVariant.name, selectedVariant.flavor) }}
              >
                {selectedVariant.image_url ? (
                  <img src={selectedVariant.image_url} alt={selectedVariant.flavor} className="w-[85%] h-[85%] object-contain" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-muted opacity-40" />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex flex-col h-full bg-background border-l border-border">
            <DialogHeader className="p-4 md:p-6 border-b border-border">
              <DialogTitle className="text-2xl md:text-3xl font-bold text-foreground">
                {baseProduct.brand} {baseProduct.size}
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                Clique para adicionar • {variants.length} opções
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2">
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
                      <h4 className="font-semibold text-foreground">{variant.flavor}</h4>
                      {variant.size && variant.size !== baseProduct.size && (
                        <p className="text-xs text-muted-foreground mt-0.5">{variant.size}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-bold text-primary">R$ {variant.price.toFixed(2)}</p>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
