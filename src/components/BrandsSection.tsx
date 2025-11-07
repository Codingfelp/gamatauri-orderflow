import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Brand {
  id: string;
  name: string;
  searchTerm: string;
  logo: string;
}

const brands: Brand[] = [
  { 
    id: "1", 
    name: "Heineken", 
    searchTerm: "heineken",
    logo: "https://www.caviarcriativo.com/storage/2025/01/Significados-da-Marca-Heineken-.jpg"
  },
  { 
    id: "2", 
    name: "Spaten",
    searchTerm: "spaten",
    logo: "https://mir-s3-cdn-cf.behance.net/projects/404/996516132852121.Y3JvcCwxMTYyLDkwOSwxMTcsMA.jpg"
  },
  { 
    id: "3", 
    name: "Brahma", 
    searchTerm: "brahma",
    logo: "https://pbs.twimg.com/profile_images/1943780446594068480/SIS1whHZ.jpg"
  },
  { 
    id: "4", 
    name: "Original",
    searchTerm: "original",
    logo: "https://www.caite.com.br/jan/prod/cerveja/imagensCerveja/AntarcticaOriginallogo.jpg"
  },
  { 
    id: "5", 
    name: "Stella Artois", 
    searchTerm: "stella",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwDrCN-vhoE_YzTJFi5S4kUAff8_7o5lOrVA&s"
  },
  { 
    id: "6", 
    name: "Coca-Cola", 
    searchTerm: "coca",
    logo: "https://png.pngtree.com/thumb_back/fh260/background/20220502/pngtree-coca--cola-logo-cold-trademark-up-photo-image_2850629.jpg"
  },
  { 
    id: "7", 
    name: "Pepsi", 
    searchTerm: "pepsi",
    logo: "https://www.caviarcriativo.com/storage/2025/01/Logotipo-da-Pepsi-2024.jpg"
  },
  { 
    id: "8", 
    name: "Guaraná", 
    searchTerm: "guarana",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnChHQIW0jGXOYBgzUtGLYOkBBDg9Ge2jO2A&s"
  },
  { 
    id: "9", 
    name: "Red Bull", 
    searchTerm: "red bull",
    logo: "https://focalizando.com.br/sites/default/files/inline-images/ecd1bf4aa8781e0e4761106cebffce16.webp"
  },
  { 
    id: "10", 
    name: "Monster", 
    searchTerm: "monster",
    logo: "https://pbs.twimg.com/profile_images/908065834022645760/t7gHe2Ds_400x400.jpg"
  },
  { 
    id: "11", 
    name: "Corona", 
    searchTerm: "corona",
    logo: "https://cdn.cookielaw.org/logos/11821760-d248-4745-b43e-10d85e89e988/9886c9d8-a55a-4da5-96ac-b35949fd330c/9ac9dee6-b5d3-462a-acfe-99369a84480f/Corona_Logo12.jpg"
  },
  { 
    id: "12", 
    name: "Laut",
    searchTerm: "laut",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1XWm7F9O3V8debMSWC9iSV4yJQCOvw5rdRQ&s"
  },
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
                    "w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden",
                    "border-2 transition-all duration-300",
                    "hover:shadow-lg hover:scale-105",
                    isSelected
                      ? "border-primary ring-2 ring-primary scale-105"
                      : "border-border group-hover:border-primary/50"
                  )}
                >
                  <img 
                    src={brand.logo} 
                    alt={`Logo ${brand.name}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const span = document.createElement('span');
                      span.className = 'text-2xl font-bold text-center text-foreground';
                      span.textContent = brand.name.charAt(0);
                      e.currentTarget.parentElement?.appendChild(span);
                    }}
                  />
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
                  "w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden",
                  "border-2 transition-all duration-300",
                  "hover:shadow-lg hover:scale-105",
                  isSelected
                    ? "border-primary ring-2 ring-primary scale-105"
                    : "border-border group-hover:border-primary/50"
                )}
              >
                <img 
                  src={brand.logo} 
                  alt={`Logo ${brand.name}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const span = document.createElement('span');
                    span.className = 'text-2xl font-bold text-center text-foreground';
                    span.textContent = brand.name.charAt(0);
                    e.currentTarget.parentElement?.appendChild(span);
                  }}
                />
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
