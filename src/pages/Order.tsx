import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ProductCard";
import { Cart } from "@/components/Cart";
import { CategoryChips } from "@/components/CategoryChips";
import { Header } from "@/components/Header";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { PromotionsCarousel } from "@/components/PromotionsCarousel";
import { BrandsSection, brands } from "@/components/BrandsSection";
import { UserAddressDisplay } from "@/components/UserAddressDisplay";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, Package, Mic, MicOff, Star } from "lucide-react";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { fetchProducts, type Product } from "@/services/productsService";
import { categoryMatchesFilter, normalizeCategory, CATEGORY_MAPPING } from "@/utils/categoryMapping";
import { isGenericCategorySearch, getGenericCategory, DESTILADO_SUBCATEGORY_LIST } from "@/utils/searchHelpers";
import { CategoryProductRow } from "@/components/CategoryProductRow";
import { useCartAbandonment } from "@/hooks/useCartAbandonment";
import { RecommendedSection } from "@/components/RecommendedSection";
import { BottomNavigation } from "@/components/BottomNavigation";
import { HotDealsSection } from "@/components/HotDealsSection";
import { supabase } from "@/integrations/supabase/client";



interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// Hook for persisting cart to localStorage
const usePersistedCart = (key: string, initialValue: CartItem[]) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [key, cart]);

  return [cart, setCart] as const;
};

const Order = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = usePersistedCart('gamatauri-cart', []);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>([]);

  // Wizard-curated product IDs (when active, shows ONLY these products)
  const [wizardProductIds, setWizardProductIds] = useState<string[] | null>(null);
  const [wizardMetaById, setWizardMetaById] = useState<Record<string, { reasons: string[]; docura?: string; intensidade?: string; ocasioes?: string[] }> | null>(null);

  const { toast } = useToast();
  const productsRef = useRef<HTMLDivElement>(null);
  
  const { isListening, isSupported, startListening } = useVoiceSearch((text) => {
    setSearchQuery(text);
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  // Detectar abandono de carrinho
  useCartAbandonment(cart, user?.id);

  useEffect(() => {
    loadProducts();
  }, []);

  // Carregar produtos favoritados do usuário
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) {
        setFavoriteProductIds([]);
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
      }
    };
    
    loadFavorites();
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      const timer = setTimeout(() => {
        setShowAuthDialog(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user]);

  const scrollToProducts = () => {
    const el = productsRef.current;
    if (!el) return;

    // Offset para não colar no header/navegação fixa
    const headerOffset = 96;
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await fetchProducts();
      setProducts(productsData);
      
      if (productsData.length === 0) {
        toast({
          title: "Nenhum produto disponível",
          description: "Produtos serão carregados em breve",
        });
      }
    } catch (error: any) {
      console.error('Error loading products:', error);
      toast({
        title: "Erro ao carregar produtos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    // Verificar se usuário está logado
    if (!user) {
      setShowAuthDialog(true);
      toast({
        title: "Login necessário",
        description: "Faça login para adicionar produtos ao carrinho",
        variant: "default",
      });
      return;
    }
    
    setCart(current => {
      const existing = current.find(item => item.id === product.id);
      if (existing) {
        return current.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...current, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
      }];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(id);
      return;
    }
    setCart(current =>
      current.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCart(current => current.filter(item => item.id !== id));
    toast({
      title: "Item removido",
      description: "Item removido do carrinho",
    });
  };

  const handleCheckout = (
    shippingFee: number = 0, 
    deliveryAddress: string = '', 
    couponId: string | null = null,
    discountAmount: number = 0,
    bundleDiscount: number = 0
  ) => {
    if (!user) {
      navigate('/auth', { state: { from: '/checkout', cart } });
      return;
    }
    navigate('/checkout', { 
      state: { 
        cart, 
        shippingFee, 
        deliveryAddress,
        couponId,
        discountAmount,
        bundleDiscount
      } 
    });
  };

  const filteredProducts = products.filter((product) => {
    // Filter out products with zero or negative price
    if (!product.price || product.price <= 0) {
      return false;
    }

    // If wizard is active, ONLY show wizard-selected products
    if (wizardProductIds && wizardProductIds.length > 0) {
      return wizardProductIds.includes(product.id);
    }
    
    // Filtrar por marca se selecionada
    let matchesBrand = !selectedBrand;
    if (selectedBrand) {
      const brand = brands.find(b => b.searchTerm === selectedBrand);
      if (brand?.filterLogic) {
        matchesBrand = brand.filterLogic(product.name, product.category || "");
      } else {
        matchesBrand = product.name.toLowerCase().includes(selectedBrand.toLowerCase());
      }
    }
    
    // Filtrar por categoria se selecionada (chip clicado)
    if (selectedCategory) {
      // Se for subcategoria de destilados, buscar por categoria exata
      if (DESTILADO_SUBCATEGORY_LIST.includes(selectedCategory)) {
        const matchesCategory = product.category?.toLowerCase() === selectedCategory.toLowerCase();
        const matchesSearch = !searchQuery.trim() || 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch && matchesCategory && matchesBrand;
      }
      const matchesCategory = categoryMatchesFilter(product.category || "", selectedCategory);
      const matchesSearch = !searchQuery.trim() || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch && matchesCategory && matchesBrand;
    }
    
    // Se tem busca por texto
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      
      // Primeiro: buscar por nome/descrição
      const matchesText = product.name.toLowerCase().includes(searchLower) ||
                          product.description?.toLowerCase().includes(searchLower);
      
      // Verificar se é busca GENÉRICA de categoria (ex: "cervejas", "vodka", "snacks")
      if (isGenericCategorySearch(searchQuery)) {
        const genericCategory = getGenericCategory(searchQuery);
        if (genericCategory) {
          // Subcategoria de destilados → filtro exato por product.category
          if (DESTILADO_SUBCATEGORY_LIST.includes(genericCategory)) {
            return product.category?.toLowerCase() === genericCategory.toLowerCase() && matchesBrand;
          }
          // Categoria genérica → usa categoryMatchesFilter
          return categoryMatchesFilter(product.category || "", genericCategory) && matchesBrand;
        }
      }
      
      // Busca específica de produto (marca) → filtrar por texto
      return matchesText && matchesBrand;
    }
    
    return matchesBrand;
  });

  // Clear wizard selection
  const clearWizardSelection = () => {
    setWizardProductIds(null);
    setWizardMetaById(null);
  };

  // Separar produtos favoritados
  const favoriteProducts = filteredProducts.filter(p => favoriteProductIds.includes(p.id));
  const nonFavoriteProducts = filteredProducts.filter(p => !favoriteProductIds.includes(p.id));

  const groupedProducts = nonFavoriteProducts.reduce((acc, product) => {
    const category = normalizeCategory(product.category);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-accent/10">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-accent/5 to-accent/10">
      <Header />
      
      <main className="container mx-auto px-0 py-6 md:py-10 pb-32 md:pb-10">
        {/* 1. PROMOÇÕES */}
        <div className="mb-8 px-4">
          <PromotionsCarousel />
        </div>

        {/* 2. BUSCA COM VOZ */}
        <div className="mb-8 px-4 max-w-2xl mx-auto relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder={isListening ? "Ouvindo..." : "Buscar produtos..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm sm:text-lg py-4 sm:py-7 pl-12 sm:pl-14 pr-12 sm:pr-16 rounded-xl bg-white shadow-sm border border-border/50 focus:shadow-lg focus:shadow-primary/20 focus:border-primary/50 transition-all duration-300 focus-visible:outline-none focus-visible:ring-0"
          />
          {isSupported && (
            <button
              onClick={startListening}
              disabled={isListening}
              className={`absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-lg transition-colors ${
                isListening 
                  ? 'bg-primary text-primary-foreground animate-pulse' 
                  : 'hover:bg-accent'
              }`}
              aria-label="Buscar por voz"
            >
              {isListening ? <MicOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Mic className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
          )}
        </div>
        
        {/* 3. CHIPS DE CATEGORIAS (Padrão iFood) - Esconde quando pesquisando */}
        {!searchQuery && (
          <CategoryChips 
            onCategoryChange={(cat) => {
              setSelectedCategory(cat);
              setSelectedBrand("");
              if (cat) scrollToProducts();
            }}
            selectedCategory={selectedCategory}
          />
        )}

        {/* 4. MARCAS - Esconde quando pesquisando */}
        {!searchQuery && (
          <BrandsSection 
            onBrandClick={(brand) => {
              setSelectedBrand(brand);
              setSelectedCategory("");
              if (brand) scrollToProducts();
            }}
            selectedBrand={selectedBrand}
          />
        )}

        {/* 4.5. SEÇÃO PEGANDO FOGO (substitui Natal) */}
        {!selectedCategory && !selectedBrand && !searchQuery && !wizardProductIds && (
          <HotDealsSection 
            products={products}
            onAddToCart={addToCart}
          />
        )}

        {/* WIZARD ACTIVE BANNER */}
        {wizardProductIds && wizardProductIds.length > 0 && (
          <div className="px-4 mb-4">
            <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border border-red-200 dark:border-red-800/50 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎄</span>
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Seleção de Natal ativa
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {wizardProductIds.length} produtos selecionados para você
                  </p>
                </div>
              </div>
              <button
                onClick={clearWizardSelection}
                className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium px-3 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                Limpar
              </button>
            </div>
          </div>
        )}

        {/* 5. RECOMENDAÇÕES PERSONALIZADAS - Apenas para usuários com histórico */}
        {!selectedCategory && !selectedBrand && !searchQuery && !wizardProductIds && (
          <div className="px-4">
            <RecommendedSection 
              allProducts={products}
              onAddToCart={addToCart}
              hideForNewUsers={true}
            />
          </div>
        )}

        {/* SEÇÃO PRODUTOS FAVORITOS - Design Premium */}
        {favoriteProducts.length > 0 && !selectedCategory && !selectedBrand && !searchQuery && !wizardProductIds && (
          <div className="mb-8 px-4">
            <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/30 dark:to-orange-950/30 rounded-2xl p-4 border border-amber-200/50 dark:border-amber-800/30 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg">
                  <Star className="h-5 w-5 text-white fill-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Selecionados para você</h2>
                  <p className="text-xs text-muted-foreground">Produtos escolhidos especialmente para o seu perfil</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {favoriteProducts.map((product) => (
                  <div key={product.id} className="relative">
                    <div className="absolute -top-1 -right-1 z-10">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 shadow-md">
                        <Star className="h-3 w-3 text-white fill-white" />
                      </span>
                    </div>
                    <ProductCard
                      product={product}
                      onAddToCart={addToCart}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. PRODUTOS */}
        <div ref={productsRef} className="scroll-mt-20">
        {Object.entries(groupedProducts).length === 0 && favoriteProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum produto encontrado"
            description="Tente ajustar sua busca ou explorar outras categorias"
          />
        ) : (
          <>
            {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
              <CategoryProductRow
                key={category}
                category={category}
                products={categoryProducts}
                onAddToCart={addToCart}
                wizardMetaById={wizardMetaById}
              />
            ))}
          </>
        )}
        </div>
      </main>

      <Cart
        items={cart}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
      />

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Bem-vindo ao Gamatauri! 🍺
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Faça login para continuar e aproveitar promoções exclusivas
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-4">
            <Button
              onClick={() => navigate('/auth')}
              className="w-full h-12 text-base font-bold"
            >
              Entrar ou Cadastrar
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowAuthDialog(false)}
              className="w-full"
            >
              Continuar navegando sem login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <BottomNavigation />
    </div>
  );
};

export default Order;
