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
import { Search, Package, Mic, MicOff } from "lucide-react";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { fetchProducts, type Product } from "@/services/productsService";
import { categoryMatchesFilter, normalizeCategory } from "@/utils/categoryMapping";
import { CategoryProductRow } from "@/components/CategoryProductRow";
import { useCartAbandonment } from "@/hooks/useCartAbandonment";
import { RecommendedSection } from "@/components/RecommendedSection";
import { BottomNavigation } from "@/components/BottomNavigation";



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

  useEffect(() => {
    if (!authLoading && !user) {
      const timer = setTimeout(() => {
        setShowAuthDialog(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user]);

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    discountAmount: number = 0
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
        discountAmount
      } 
    });
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesBrand = !selectedBrand;
    if (selectedBrand) {
      const brand = brands.find(b => b.searchTerm === selectedBrand);
      if (brand?.filterLogic) {
        matchesBrand = brand.filterLogic(product.name, product.category || "");
      } else {
        matchesBrand = product.name.toLowerCase().includes(selectedBrand.toLowerCase());
      }
    }
    
    if (!selectedCategory) return matchesSearch && matchesBrand;
    
    const matchesCategory = categoryMatchesFilter(product.category || "", selectedCategory);
    return matchesSearch && matchesCategory && matchesBrand;
  });

  const groupedProducts = filteredProducts.reduce((acc, product) => {
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
      
      <main className="container mx-auto px-0 py-6 md:py-10">
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
        
        {/* 3. CHIPS DE CATEGORIAS (Padrão iFood) */}
        <CategoryChips 
          onCategoryChange={(cat) => {
            setSelectedCategory(cat);
            setSelectedBrand("");
            if (cat) scrollToProducts();
          }}
          selectedCategory={selectedCategory}
        />

        {/* 4. MARCAS */}
        <BrandsSection 
          onBrandClick={(brand) => {
            setSelectedBrand(brand);
            setSelectedCategory("");
            if (brand) scrollToProducts();
          }}
          selectedBrand={selectedBrand}
        />

        {/* 4.5. RECOMENDAÇÕES PERSONALIZADAS */}
        {!selectedCategory && !selectedBrand && !searchQuery && (
          <div className="px-4">
            <RecommendedSection 
              allProducts={products}
              onAddToCart={addToCart}
            />
          </div>
        )}

        {/* 5. PRODUTOS */}
        <div ref={productsRef} className="scroll-mt-20">
        {Object.entries(groupedProducts).length === 0 ? (
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
