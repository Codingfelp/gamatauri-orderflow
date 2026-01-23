import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, ArrowLeft, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { fetchProducts, type Product } from "@/services/productsService";
import { ProductCard } from "@/components/ProductCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { categoryMatchesFilter } from "@/utils/categoryMapping";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/BottomNavigation";
import cervejasImg from "@/assets/categories/cervejas.jpg";
import destiladosImg from "@/assets/categories/destilados.png";
import vinhosImg from "@/assets/categories/vinhos.png";
import drinksImg from "@/assets/categories/drinks-prontos.png";
import refrigerantesImg from "@/assets/categories/refrigerantes-energeticos.png";
import aguasImg from "@/assets/categories/aguas-sucos.png";
import chocolatesImg from "@/assets/categories/chocolates.jpg";
import balasImg from "@/assets/categories/balas-doces.png";
import snacksImg from "@/assets/categories/snacks.png";
import copaoImg from "@/assets/categories/copao.jpg";
import cigarrosImg from "@/assets/categories/cigarros.jpg";
import gelosImg from "@/assets/categories/gelos.jpg";

interface Category {
  name: string;
  value: string;
  image: string;
  color: string;
}

const categories: Category[] = [
  { name: "Cervejas", value: "Cervejas", image: cervejasImg, color: "from-amber-400 to-amber-600" },
  { name: "Destilados", value: "Destilados", image: destiladosImg, color: "from-orange-400 to-orange-600" },
  { name: "Vinhos", value: "Vinhos", image: vinhosImg, color: "from-purple-400 to-purple-600" },
  { name: "Drinks", value: "Drinks", image: drinksImg, color: "from-pink-400 to-pink-600" },
  { name: "Refrigerantes", value: "Refrigerantes", image: refrigerantesImg, color: "from-red-400 to-red-600" },
  { name: "Águas", value: "Águas", image: aguasImg, color: "from-blue-400 to-blue-600" },
  { name: "Sucos", value: "Sucos", image: aguasImg, color: "from-green-400 to-green-600" },
  { name: "Chocolates", value: "Chocolates", image: chocolatesImg, color: "from-brown-400 to-brown-600" },
  { name: "Snacks", value: "Snacks", image: snacksImg, color: "from-yellow-400 to-yellow-600" },
  { name: "Doces", value: "Doces", image: balasImg, color: "from-pink-300 to-pink-500" },
  { name: "Copão", value: "Copão", image: copaoImg, color: "from-indigo-400 to-indigo-600" },
  { name: "Tabacaria", value: "Tabacaria", image: cigarrosImg, color: "from-gray-400 to-gray-600" },
  { name: "Gelos", value: "Gelos", image: gelosImg, color: "from-cyan-300 to-cyan-500" },
];

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const usePersistedCart = (key: string, initialValue: CartItem[]) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }, [key, cart]);

  return [cart, setCart] as const;
};

const Search = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [cart, setCart] = usePersistedCart('gamatauri-cart', []);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await fetchProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    if (!user) {
      setShowAuthDialog(true);
      toast({
        title: "Login necessário",
        description: "Faça login para adicionar produtos ao carrinho",
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

    toast({
      title: "Adicionado ao carrinho",
      description: `${product.name} foi adicionado ao seu carrinho`,
    });
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setSearchTerm("");
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSearchTerm("");
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if search matches a category keyword or subcategory (for destilados)
  const getMatchingCategory = (search: string): string | null => {
    if (!search.trim()) return null;
    const searchLower = search.toLowerCase().trim();
    
    // Subcategorias específicas de destilados (prioridade sobre "destilados" genérico)
    const subcategoryMap: Record<string, string[]> = {
      "Vodka": ["vodka", "absolut", "smirnoff", "grey goose", "ciroc"],
      "Whisky": ["whisky", "whiskey", "johnnie", "jack daniels", "chivas", "red label", "black label", "buchanans"],
      "Gin": ["gin", "tanqueray", "bombay", "beefeater", "gordons"],
      "Cachaca": ["cachaca", "cachaça", "51", "velho barreiro", "ypioca"],
      "Rum": ["rum", "bacardi", "montilla"],
      "Tequila": ["tequila", "jose cuervo"],
      "Licor": ["licor", "amarula", "baileys", "jagermeister"],
      "Conhaque": ["conhaque", "dreher"],
    };
    
    // Verificar subcategorias primeiro (retorna a categoria exata do banco)
    for (const [dbCategory, keywords] of Object.entries(subcategoryMap)) {
      if (keywords.some(kw => searchLower.includes(kw) || kw.includes(searchLower))) {
        return dbCategory; // Retorna a categoria exata do banco de dados
      }
    }
    
    // Mapa geral de categorias
    const keywordMap: Record<string, string[]> = {
      "Águas": ["agua", "águas", "water", "mineral", "crystal", "minalba", "pureza"],
      "Sucos": ["suco", "sucos", "tial", "gatorade", "isoton", "del valle"],
      "Cervejas": ["cerveja", "cervejas", "beer", "brahma", "skol", "heineken", "budweiser"],
      "Destilados": ["destilado", "destilados"], // Só quando buscar "destilados" genérico
      "Vinhos": ["vinho", "vinhos", "wine", "tinto", "branco", "rose"],
      "Refrigerantes": ["refrigerante", "coca", "pepsi", "fanta", "guarana", "energetico", "red bull"],
      "Drinks": ["drink", "drinks", "beats", "ice", "smirnoff ice"],
      "Chocolates": ["chocolate", "chocolates", "bis", "oreo", "kitkat"],
      "Snacks": ["snack", "snacks", "batata", "salgadinho", "doritos", "lays", "ruffles"],
      "Doces": ["doce", "doces", "bala", "chiclete", "mentos"],
      "Tabacaria": ["cigarro", "cigarros", "seda", "isqueiro", "tabaco"],
      "Gelos": ["gelo", "gelos"],
      "Copão": ["copao", "copão", "combo"],
    };
    
    for (const [category, keywords] of Object.entries(keywordMap)) {
      if (keywords.some(kw => searchLower.includes(kw) || kw.includes(searchLower))) {
        return category;
      }
    }
    return null;
  };

  const matchingCategory = getMatchingCategory(searchTerm);

  const filteredProducts = products.filter((product) => {
    // Filter out products with zero or negative prices
    if (product.price <= 0) return false;
    
    // If search matches a specific subcategory (like "Vodka"), match exactly
    if (matchingCategory) {
      // Se for subcategoria de destilados, buscar por categoria exata
      const destSubcats = ["Vodka", "Whisky", "Gin", "Cachaca", "Rum", "Tequila", "Licor", "Conhaque"];
      if (destSubcats.includes(matchingCategory)) {
        return product.category?.toLowerCase() === matchingCategory.toLowerCase();
      }
      // Para categorias gerais, usar o mapeamento
      return categoryMatchesFilter(product.category || "", matchingCategory);
    }
    
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedCategory) {
      return matchesSearch && categoryMatchesFilter(product.category || "", selectedCategory);
    }
    
    return matchesSearch;
  });

  const showProducts = searchTerm.length > 0 || selectedCategory !== null;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => selectedCategory ? handleBackToCategories() : navigate("/")}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold flex-1">
              {selectedCategory || "Buscar"}
            </h1>
            {selectedCategory && (
              <button
                onClick={handleBackToCategories}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-muted/50"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        {loading ? (
          <LoadingSpinner />
        ) : showProducts ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {filteredProducts.length} produto(s) encontrado(s)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                />
              ))}
            </div>
            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <SearchIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum produto encontrado</p>
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className="text-sm font-semibold text-muted-foreground mb-4">
              CATEGORIAS
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              {filteredCategories.map((category) => (
                <Card
                  key={category.value}
                  onClick={() => handleCategoryClick(category.value)}
                  className="overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  <div className={`relative h-32 bg-gradient-to-br ${category.color}`}>
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover mix-blend-overlay opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-bold text-lg leading-tight drop-shadow-lg">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredCategories.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <SearchIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma categoria encontrada</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login necessário</DialogTitle>
            <DialogDescription>
              Você precisa fazer login para adicionar produtos ao carrinho.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/auth")} className="flex-1">
              Fazer Login
            </Button>
            <Button variant="outline" onClick={() => setShowAuthDialog(false)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
};

export default Search;
