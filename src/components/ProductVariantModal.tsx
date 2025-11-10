import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { ProductGroup, ProductVariant } from "@/utils/productVariants";
import { Product } from "@/services/productsService";
import { useToast } from "@/hooks/use-toast";

interface ProductVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  productGroup: ProductGroup;
  onAddToCart: (product: Product) => void;
  onVariantSelected?: (variant: ProductVariant) => void;
}

const getProductColor = (productName: string, flavor: string): string => {
  const key = `${productName.toLowerCase()}-${flavor.toLowerCase()}`;
  
  const colorMap: Record<string, string> = {
    // BALY
    'baly-tradicional': '#FFD700', 'baly-original': '#FFD700',
    'baly-tropicall': '#FF8C42', 'baly-tropical': '#FF8C42',
    'baly-coco e açaí': '#87CEEB', 'baly-coco e acai': '#87CEEB',
    'baly-freegels cereja': '#DC143C', 'baly-cereja': '#DC143C',
    'baly-maçã verde': '#90EE90', 'baly-maca verde': '#90EE90',
    'baly-morango': '#FFB6C1', 'baly-uva': '#9370DB',
    
    // RED BULL
    'red bull-tradicional': '#FFD700', 'red bull-original': '#FFD700',
    'red bull-blue': '#4169E1', 'red bull-azul': '#4169E1',
    'red bull-red': '#DC143C', 'red bull-vermelho': '#DC143C',
    'red bull-silver': '#C0C0C0', 'red bull-prata': '#C0C0C0',
    'red bull-verde': '#90EE90', 'red bull-green': '#90EE90',
    
    // MONSTER
    'monster-original': '#32CD32', 'monster-verde': '#32CD32',
    'monster-ultra': '#E8E8E8', 'monster-branco': '#E8E8E8',
    'monster-paradise': '#FF69B4', 'monster-rosa': '#FF69B4',
    'monster-mango': '#FFA500', 'monster-manga': '#FFA500',
    
    // COCA-COLA
    'coca-cola-original': '#DC143C', 'coca-original': '#DC143C',
    'coca-cola-zero': '#2F2F2F', 'coca-zero': '#2F2F2F',
    'coca-cola-limão': '#90EE90', 'coca-limao': '#90EE90',
    
    // PEPSI
    'pepsi-original': '#4169E1', 'pepsi-tradicional': '#4169E1',
    'pepsi-black': '#2F2F2F', 'pepsi-zero': '#2F2F2F',
    'pepsi-twist': '#90EE90', 'pepsi-limão': '#90EE90',
    
    // GUARANÁ
    'guaraná-original': '#228B22', 'guarana-original': '#228B22',
    'guaraná-zero': '#2F2F2F', 'guarana-zero': '#2F2F2F',
    'guaraná-antarctica': '#228B22', 'guarana-antarctica': '#228B22',
    
    // SPRITE
    'sprite-original': '#90EE90', 'sprite-tradicional': '#90EE90',
    'sprite-zero': '#E8E8E8',
    
    // FANTA
    'fanta-laranja': '#FF8C00', 'fanta-orange': '#FF8C00',
    'fanta-uva': '#9370DB', 'fanta-grape': '#9370DB',
    'fanta-guaraná': '#FFD700', 'fanta-guarana': '#FFD700',
    'fanta-morango': '#FFB6C1', 'fanta-strawberry': '#FFB6C1',
    
    // KUAT
    'kuat-original': '#8B4513', 'kuat-guaraná': '#8B4513',
    
    // SUCOS TIAL
    'tial-laranja': '#FF8C42', 'tial-orange': '#FF8C42',
    'tial-uva': '#9370DB', 'tial-grape': '#9370DB',
    'tial-maracujá': '#FFD700', 'tial-maracuja': '#FFD700',
    'tial-goiaba': '#FFB6C1', 'tial-guava': '#FFB6C1',
    'tial-manga': '#FFA500', 'tial-mango': '#FFA500',
    'tial-pêssego': '#FFDAB9', 'tial-pessego': '#FFDAB9',
    
    // SUCOS MAGUARY
    'maguary-laranja': '#CD5C5C', 'maguary-uva': '#8B008B',
    'maguary-maracujá': '#FFD700', 'maguary-maracuja': '#FFD700',
    'maguary-goiaba': '#FFB6C1', 'maguary-manga': '#FFA500',
    
    // DEL VALLE
    'del valle-laranja': '#FFA500', 'del valle-uva': '#9370DB',
    'del valle-maracujá': '#FFD700', 'del valle-maracuja': '#FFD700',
    'del valle-pêssego': '#FFDAB9', 'del valle-pessego': '#FFDAB9',
    'del valle-manga': '#FFA500',
    
    // BEATS
    'beats-senses': '#FF69B4', 'beats-rosa': '#FF69B4',
    'beats-gt': '#FF4500', 'beats-laranja': '#FF4500',
    'beats-zero': '#2F2F2F',
    
    // GATORADE
    'gatorade-laranja': '#FF8C00', 'gatorade-orange': '#FF8C00',
    'gatorade-limão': '#90EE90', 'gatorade-limao': '#90EE90',
    'gatorade-uva': '#9370DB', 'gatorade-morango': '#FFB6C1',
    'gatorade-azul': '#4169E1', 'gatorade-blue': '#4169E1',
  };
  
  for (const [mapKey, color] of Object.entries(colorMap)) {
    if (key.includes(mapKey)) return color;
  }
  
  const lowerName = productName.toLowerCase();
  if (lowerName.includes('baly')) return '#FFD700';
  if (lowerName.includes('red bull')) return '#FFD700';
  if (lowerName.includes('monster')) return '#32CD32';
  if (lowerName.includes('tial')) return '#FFD700';
  if (lowerName.includes('maguary')) return '#CD5C5C';
  if (lowerName.includes('coca')) return '#DC143C';
  if (lowerName.includes('pepsi')) return '#4169E1';
  if (lowerName.includes('guaraná') || lowerName.includes('guarana')) return '#228B22';
  if (lowerName.includes('sprite')) return '#90EE90';
  if (lowerName.includes('fanta')) return '#FF8C00';
  if (lowerName.includes('kuat')) return '#8B4513';
  if (lowerName.includes('del valle')) return '#FFA500';
  if (lowerName.includes('beats')) return '#FF69B4';
  if (lowerName.includes('gatorade')) return '#FF8C00';
  
  return '#E0E0E0';
};

export const ProductVariantModal = ({ isOpen, onClose, productGroup, onAddToCart, onVariantSelected }: ProductVariantModalProps) => {
  const { baseProduct, variants } = productGroup;
  const [selectedVariant, setSelectedVariant] = useState(variants[0]);
  const { toast } = useToast();
  
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
      <DialogContent className="max-w-5xl h-[85vh] p-0 overflow-hidden bg-background">
        <div className="grid md:grid-cols-2 h-full">
          <div className="flex items-center justify-center p-8 md:p-12 relative">
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
                  x: 0
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
                  opacity: { duration: 0.3 }
                }}
                className="w-full h-full flex items-center justify-center rounded-3xl"
                style={{ 
                  backgroundColor: getProductColor(selectedVariant.name, selectedVariant.flavor),
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
