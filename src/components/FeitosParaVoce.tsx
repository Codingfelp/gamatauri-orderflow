import { useState, useCallback, useEffect, useMemo } from "react";
import { ChevronRight, Plus, Check, Sparkles } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/services/productsService";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { usePromotions } from "@/hooks/usePromotions";

interface FeitosParaVoceProps {
  allProducts: Product[];
  onAddToCart: (product: Product) => void;
}

// Frases emocionais variadas - nunca repete igual
const EMOTIONAL_BADGES = [
  { text: "Seu favorito", emoji: "" },
  { text: "Você sempre leva", emoji: "" },
  { text: "Boa escolha", emoji: "😉" },
  { text: "Esse nunca falha", emoji: "" },
  { text: "Sempre com você", emoji: "" },
  { text: "Tá te esperando", emoji: "" },
];

// Badge de promoção
const PROMO_BADGE = { text: "Em promoção", emoji: "🔥" };

// Key para armazenar última interação com produtos
const LAST_INTERACTION_KEY = 'gamatauri-product-interactions';

interface ProductInteraction {
  productId: string;
  lastBought?: number;
  lastViewed?: number;
  buyCount?: number;
}

// Salvar interação do produto
const saveProductInteraction = (productId: string, type: 'bought' | 'viewed') => {
  try {
    const stored = localStorage.getItem(LAST_INTERACTION_KEY);
    const interactions: Record<string, ProductInteraction> = stored ? JSON.parse(stored) : {};
    
    const current = interactions[productId] || { productId };
    if (type === 'bought') {
      current.lastBought = Date.now();
      current.buyCount = (current.buyCount || 0) + 1;
    } else {
      current.lastViewed = Date.now();
    }
    
    interactions[productId] = current;
    localStorage.setItem(LAST_INTERACTION_KEY, JSON.stringify(interactions));
  } catch (e) {
    console.error('Error saving interaction:', e);
  }
};

// Carregar interações
const getProductInteractions = (): Record<string, ProductInteraction> => {
  try {
    const stored = localStorage.getItem(LAST_INTERACTION_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const FeitosParaVoce = ({ allProducts, onAddToCart }: FeitosParaVoceProps) => {
  const { user } = useAuth();
  const { getPromotionForProduct, isPromotionActive } = usePromotions();
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());
  const [badgeMap, setBadgeMap] = useState<Map<string, typeof EMOTIONAL_BADGES[0]>>(new Map());

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });

  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      setCanScrollNext(emblaApi.canScrollNext());
    };
    
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    onSelect();
    
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi]);

  // Carregar favoritos do usuário
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) {
        setFavoriteProductIds([]);
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('favorite_products')
          .eq('user_id', user.id)
          .single();
        
        if (!error && data?.favorite_products) {
          setFavoriteProductIds(data.favorite_products);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadFavorites();
  }, [user]);

  // Atribuir badges únicas a cada produto
  useEffect(() => {
    const newBadgeMap = new Map<string, typeof EMOTIONAL_BADGES[0]>();
    const shuffledBadges = [...EMOTIONAL_BADGES].sort(() => Math.random() - 0.5);
    
    favoriteProductIds.forEach((id, index) => {
      newBadgeMap.set(id, shuffledBadges[index % shuffledBadges.length]);
    });
    
    setBadgeMap(newBadgeMap);
  }, [favoriteProductIds]);

  // Handler de adicionar com animação e salvar interação
  const handleAddToCart = useCallback((product: Product) => {
    setAddedProducts(prev => new Set(prev).add(product.id));
    onAddToCart(product);
    saveProductInteraction(product.id, 'bought');
    
    // Reset animation after 1.5s
    setTimeout(() => {
      setAddedProducts(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1500);
  }, [onAddToCart]);

  // Filtrar e ordenar produtos favoritos por interação recente
  const favoriteProducts = useMemo(() => {
    const interactions = getProductInteractions();
    
    return allProducts
      .filter(p => favoriteProductIds.includes(p.id) && p.available)
      .sort((a, b) => {
        const intA = interactions[a.id];
        const intB = interactions[b.id];
        
        // Priorizar por última compra, depois por última visualização
        const scoreA = (intA?.lastBought || 0) * 2 + (intA?.lastViewed || 0) + (intA?.buyCount || 0) * 1000;
        const scoreB = (intB?.lastBought || 0) * 2 + (intB?.lastViewed || 0) + (intB?.buyCount || 0) * 1000;
        
        return scoreB - scoreA;
      });
  }, [allProducts, favoriteProductIds]);

  // Loading state
  if (loading) {
    return (
      <div className="mb-8">
        <div className="px-4 mb-4">
          <div className="h-8 w-48 bg-muted/30 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-muted/20 rounded mt-2 animate-pulse" />
        </div>
        <div className="flex gap-4 px-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-[160px] h-[220px] bg-muted/20 rounded-2xl animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  // Não mostrar se não houver favoritos
  if (!user || favoriteProducts.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mb-8"
    >
      {/* Background sutil diferenciado */}
      <div className="bg-gradient-to-r from-primary/[0.03] via-transparent to-primary/[0.03] py-6">
        {/* Header emocional */}
        <div className="px-4 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              Feitos pra você
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Seus favoritos, do jeito que você costuma comprar
          </p>
        </div>

        {/* Carrossel fluido */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4 px-4">
              <AnimatePresence>
                {favoriteProducts.map((product, index) => {
                  const promo = getPromotionForProduct(product.id);
                  const hasPromo = promo && isPromotionActive(promo);
                  const badge = hasPromo ? PROMO_BADGE : badgeMap.get(product.id);
                  const isAdded = addedProducts.has(product.id);

                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ 
                        opacity: 1, 
                        scale: isAdded ? 0.95 : 1,
                        y: isAdded ? 4 : 0 
                      }}
                      transition={{ 
                        duration: 0.3,
                        delay: index * 0.05,
                      }}
                      className="flex-shrink-0 w-[130px] sm:w-[140px]"
                    >
                      {/* Card elegante - mais compacto */}
                      <div className="relative bg-card rounded-xl border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
                        {/* Badge elegante e pequeno */}
                        {badge && (
                          <div className="absolute top-2.5 left-2.5 z-10">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm ${
                              hasPromo 
                                ? 'bg-red-500/90 text-white' 
                                : 'bg-white/90 text-foreground/80 border border-border/30'
                            }`}>
                              {badge.text}
                              {badge.emoji && <span className="ml-0.5">{badge.emoji}</span>}
                            </span>
                          </div>
                        )}

                        {/* Imagem limpa - mais compacta */}
                        <div className="aspect-[4/3] bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center p-2 relative overflow-hidden">
                          <img
                            src={product.image_url || '/placeholder.svg'}
                            alt={product.name}
                            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>

                        {/* Conteúdo - mais compacto */}
                        <div className="p-2">
                          {/* Nome - max 2 linhas */}
                          <h3 className="text-[11px] font-medium text-foreground/90 leading-tight line-clamp-2 min-h-[28px]">
                            {product.name}
                          </h3>

                          {/* Rodapé: Preço + Botão */}
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="flex flex-col">
                              {hasPromo ? (
                                <>
                                  <span className="text-[9px] text-muted-foreground line-through">
                                    R$ {promo.original_price.toFixed(2).replace('.', ',')}
                                  </span>
                                  <span className="text-sm font-bold text-red-600">
                                    R$ {promo.promotional_price.toFixed(2).replace('.', ',')}
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm font-bold text-foreground/90">
                                  R$ {product.price.toFixed(2).replace('.', ',')}
                                </span>
                              )}
                            </div>

                            {/* Botão flutuante convite - menor */}
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleAddToCart(product)}
                              disabled={isAdded}
                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                                isAdded
                                  ? 'bg-green-500 text-white'
                                  : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
                              }`}
                            >
                              <AnimatePresence mode="wait">
                                {isAdded ? (
                                  <motion.div
                                    key="check"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0 }}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="plus"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Botão de scroll discreto */}
          {canScrollNext && (
            <button
              onClick={scrollNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center hover:bg-white transition-all z-10 border border-border/20"
            >
              <ChevronRight className="h-4 w-4 text-foreground/70" />
            </button>
          )}
        </div>
      </div>
    </motion.section>
  );
};
