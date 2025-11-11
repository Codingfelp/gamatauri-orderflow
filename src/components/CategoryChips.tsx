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
    <div className="relative mb-6">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-4 py-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.value;
            
            return (
              <button
                key={category.value}
                onClick={() => onCategoryChange(isSelected ? "" : category.value)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all duration-200",
                  "border-2 font-medium text-sm",
                  isSelected 
                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-105" 
                    : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-accent active:scale-95"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Gradiente fade nas bordas para indicar scroll */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  );
};
