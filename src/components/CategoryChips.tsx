import { cn } from "@/lib/utils";
import { 
  Wine, Beer, Coffee, IceCream, Flame, 
  Droplets, Apple, Cookie, Package, Candy
} from "lucide-react";

interface Category {
  name: string;
  value: string;
  icon: React.ComponentType<any>;
}

const categories: Category[] = [
  { name: "Cervejas", value: "Cervejas", icon: Beer },
  { name: "Cervejas Zero", value: "Cervejas Zero", icon: Beer },
  { name: "Destilados", value: "Destilados", icon: Wine },
  { name: "Vinhos", value: "Vinhos", icon: Wine },
  { name: "Drinks", value: "Drinks", icon: Coffee },
  { name: "Refrigerantes", value: "Refrigerantes", icon: Droplets },
  { name: "Refrigerantes Zero", value: "Refrigerantes Zero", icon: Droplets },
  { name: "Águas", value: "Águas", icon: Droplets },
  { name: "Sucos", value: "Sucos", icon: Apple },
  { name: "Chocolates", value: "Chocolates", icon: Cookie },
  { name: "Snacks", value: "Snacks", icon: Package },
  { name: "Doces", value: "Doces", icon: Candy },
  { name: "Copão", value: "Copão", icon: Flame },
  { name: "Cigarros", value: "Cigarros", icon: Package },
  { name: "Gelos", value: "Gelos", icon: IceCream },
];

interface CategoryChipsProps {
  onCategoryChange: (category: string) => void;
  selectedCategory: string;
}

export const CategoryChips = ({ onCategoryChange, selectedCategory }: CategoryChipsProps) => {
  return (
    <div className="relative mb-8">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 px-4 py-3">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.value;
            
            return (
              <button
                key={category.value}
                onClick={() => onCategoryChange(isSelected ? "" : category.value)}
                className={cn(
                  "flex items-center gap-2.5 px-6 py-4 rounded-full whitespace-nowrap",
                  "border-2 font-semibold text-base",
                  "transition-all duration-300 ease-out",
                  "hover:shadow-lg hover:shadow-primary/20",
                  isSelected 
                    ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/30 scale-110" 
                    : "bg-card text-foreground border-border hover:border-primary hover:bg-accent hover:scale-105 active:scale-95"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Gradiente fade nas bordas para indicar scroll */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background via-background to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background via-background to-transparent pointer-events-none z-10" />
    </div>
  );
};
