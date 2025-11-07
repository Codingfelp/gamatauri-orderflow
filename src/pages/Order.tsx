import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ProductCard";
import { Cart } from "@/components/Cart";
import { CategoryCarousel } from "@/components/CategoryCarousel";
import { Header } from "@/components/Header";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { PromotionsCarousel } from "@/components/PromotionsCarousel";
import { BrandsSection, brands } from "@/components/BrandsSection";
import { useToast } from "@/hooks/use-toast";
import { Search, Package } from "lucide-react";
import { fetchProducts, type Product } from "@/services/productsService";
import { categoryMatchesFilter, normalizeCategory } from "@/utils/categoryMapping";
import { CategoryProductRow } from "@/components/CategoryProductRow";



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
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    loadProducts();
  }, []);

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

    toast({
      title: "Adicionado ao carrinho",
      description: `${product.name} foi adicionado`,
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

  const handleCheckout = (shippingFee: number = 0, deliveryAddress: string = '') => {
    if (!user) {
      navigate('/auth', { state: { from: '/checkout', cart } });
      return;
    }
    navigate('/checkout', { state: { cart, shippingFee, deliveryAddress } });
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

        {/* 2. BUSCA */}
        <div className="mb-8 px-4 max-w-2xl mx-auto relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-lg py-7 pl-14 pr-4 rounded-xl bg-white shadow-sm border border-border/50 focus:shadow-lg focus:shadow-primary/20 focus:border-primary/50 transition-all duration-300 focus-visible:outline-none focus-visible:ring-0"
          />
        </div>
        
        {/* 3. CATEGORIAS */}
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4 px-4 md:px-8 text-card-foreground">Categorias</h2>
          <CategoryCarousel 
            onCategoryChange={(cat) => {
              setSelectedCategory(cat);
              setSelectedBrand("");
            }}
            selectedCategory={selectedCategory}
          />
        </div>

        {/* 4. MARCAS */}
        <BrandsSection 
          onBrandClick={(brand) => {
            setSelectedBrand(brand);
            setSelectedCategory("");
          }}
          selectedBrand={selectedBrand}
        />

        {/* 5. PRODUTOS */}

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
      </main>

      <Cart
        items={cart}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
      />
    </div>
  );
};

export default Order;
