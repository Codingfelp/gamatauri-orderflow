import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Brand {
  id: string;
  name: string;
  searchTerm: string;
}

const brands: Brand[] = [
  { id: "1", name: "Heineken", searchTerm: "heineken" },
  { id: "2", name: "Skol", searchTerm: "skol" },
  { id: "3", name: "Brahma", searchTerm: "brahma" },
  { id: "4", name: "Budweiser", searchTerm: "budweiser" },
  { id: "5", name: "Stella Artois", searchTerm: "stella" },
  { id: "6", name: "Coca-Cola", searchTerm: "coca" },
  { id: "7", name: "Pepsi", searchTerm: "pepsi" },
  { id: "8", name: "Guaraná", searchTerm: "guarana" },
  { id: "9", name: "Red Bull", searchTerm: "red bull" },
  { id: "10", name: "Monster", searchTerm: "monster" },
  { id: "11", name: "Corona", searchTerm: "corona" },
  { id: "12", name: "Amstel", searchTerm: "amstel" },
];

interface BrandsSectionProps {
  onBrandClick: (brand: string) => void;
  selectedBrand: string;
}

export const BrandsSection = ({ onBrandClick, selectedBrand }: BrandsSectionProps) => {
  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6 px-4 md:px-8">
        <h2 className="text-2xl font-bold text-card-foreground">Marcas Famosas</h2>
        <Button 
          variant="ghost" 
          className="text-primary hover:text-primary/80 font-semibold"
          onClick={() => onBrandClick("")}
        >
          Limpar filtro
        </Button>
      </div>

      {/* Mobile: Scroll horizontal */}
      <div className="md:hidden overflow-x-auto scrollbar-hide px-4">
        <div className="flex gap-6">
          {brands.map((brand) => {
            const isSelected = selectedBrand === brand.searchTerm;
            return (
              <div
                key={brand.id}
                onClick={() => onBrandClick(isSelected ? "" : brand.searchTerm)}
                className="flex flex-col items-center gap-2 cursor-pointer group"
              >
                <div
                  className={cn(
                    "w-20 h-20 rounded-full bg-card shadow-md flex items-center justify-center",
                    "border-2 transition-all duration-300",
                    "hover:shadow-lg hover:scale-105",
                    isSelected
                      ? "border-primary ring-2 ring-primary scale-105"
                      : "border-border group-hover:border-primary/50"
                  )}
                >
                  <span className="text-2xl font-bold text-center text-foreground">
                    {brand.name.charAt(0)}
                  </span>
                </div>
                <p className={cn(
                  "text-xs font-medium text-center whitespace-nowrap transition-colors",
                  isSelected ? "text-primary font-bold" : "text-muted-foreground"
                )}>
                  {brand.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop: Grid */}
      <div className="hidden md:grid grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-6 px-4 md:px-8">
        {brands.map((brand) => {
          const isSelected = selectedBrand === brand.searchTerm;
          return (
            <div
              key={brand.id}
              onClick={() => onBrandClick(isSelected ? "" : brand.searchTerm)}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div
                className={cn(
                  "w-20 h-20 rounded-full bg-card shadow-md flex items-center justify-center",
                  "border-2 transition-all duration-300",
                  "hover:shadow-lg hover:scale-105",
                  isSelected
                    ? "border-primary ring-2 ring-primary scale-105"
                    : "border-border group-hover:border-primary/50"
                )}
              >
                <span className="text-2xl font-bold text-center text-foreground">
                  {brand.name.charAt(0)}
                </span>
              </div>
              <p className={cn(
                "text-xs font-medium text-center transition-colors",
                isSelected ? "text-primary font-bold" : "text-muted-foreground"
              )}>
                {brand.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
