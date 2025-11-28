import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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

const Search = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const handleCategoryClick = (category: string) => {
    navigate(`/?category=${encodeURIComponent(category)}`);
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold">Buscar</h1>
          </div>
          
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar produtos ou categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-muted/50"
            />
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-md mx-auto px-4 py-6">
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
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Search;
