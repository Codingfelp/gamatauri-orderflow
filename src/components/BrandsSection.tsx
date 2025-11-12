import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";

interface Brand {
  id: string;
  name: string;
  searchTerm: string;
  logo: string;
  filterLogic?: (productName: string, productCategory: string) => boolean;
}

const getLogoClasses = (brandName: string) => {
  const needsContain = [
    'Heineken', 'Original', 'Coca-Cola', 'Red Bull', 
    'Corona', 'Tial', 'Doritos', 'Lays'
  ];
  
  return needsContain.includes(brandName)
    ? "w-full h-full object-contain p-1 scale-110 transition-transform duration-300 group-hover:scale-125"
    : "w-full h-full object-cover transition-transform duration-300 group-hover:scale-110";
};

const brands: Brand[] = [
  { 
    id: "1", 
    name: "Heineken", 
    searchTerm: "heineken",
    logo: "https://i.pinimg.com/474x/ef/37/02/ef370240d9d98d42c197e5d6461c5033.jpg"
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
    logo: "https://www.caite.com.br/jan/prod/cerveja/imagensCerveja/AntarcticaOriginallogo.jpg",
    filterLogic: (name, category) => {
      const hasOriginal = name.toLowerCase().includes("original");
      const isBeer = category?.toLowerCase().includes("cerveja") || 
                     category?.toLowerCase().includes("beer");
      return hasOriginal && isBeer;
    }
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
    logo: "https://pbs.twimg.com/profile_images/1744786283531059200/lrggJynL_400x400.jpg"
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
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnChHQIW0jGXOYBgzUtGLYOkBBDg9Ge2jO2A&s",
    filterLogic: (name) => {
      const normalized = name.toLowerCase();
      return normalized.includes("guarana") && !normalized.includes("fanta");
    }
  },
  { 
    id: "9", 
    name: "Red Bull", 
    searchTerm: "red bull",
    logo: "https://cdn.escharts.com/uploads/public/600/1be/d7d/6001bed7ded2a618223398.jpg"
  },
  { 
    id: "10", 
    name: "Monster", 
    searchTerm: "monster",
    logo: "https://pbs.twimg.com/profile_images/908065834022645760/t7gHe2Ds_400x400.jpg"
  },
  { 
    id: "11", 
    name: "Baly", 
    searchTerm: "baly",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNBWNwdk7vSFXg-fMsOfBlsbnZnk2r0-t-Rw&s",
    filterLogic: (name) => {
      const normalized = name.toLowerCase();
      return normalized.includes("baly");
    }
  },
  { 
    id: "12", 
    name: "Corona", 
    searchTerm: "corona",
    logo: "https://cdn.cookielaw.org/logos/11821760-d248-4745-b43e-10d85e89e988/9886c9d8-a55a-4da5-96ac-b35949fd330c/9ac9dee6-b5d3-462a-acfe-99369a84480f/Corona_Logo12.jpg",
    filterLogic: (name) => {
      const normalized = name.toLowerCase();
      return normalized.includes("corona") || normalized.includes("coronita");
    }
  },
  { 
    id: "13", 
    name: "Laut",
    searchTerm: "laut",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1XWm7F9O3V8debMSWC9iSV4yJQCOvw5rdRQ&s"
  },
  { 
    id: "14", 
    name: "Tial", 
    searchTerm: "tial",
    logo: "https://d3p2amk7tvag7f.cloudfront.net/brands/e823404ef2b4737dd3e61b11ce924b3298e46360.png",
    filterLogic: (name) => name.toLowerCase().includes("tial")
  },
  { 
    id: "15", 
    name: "Doritos", 
    searchTerm: "doritos",
    logo: "https://pbs.twimg.com/profile_images/1214557821749972992/OXfyImwY.jpg",
    filterLogic: (name) => name.toLowerCase().includes("doritos")
  },
  { 
    id: "16", 
    name: "Lays", 
    searchTerm: "lays",
    logo: "https://pbs.twimg.com/profile_images/1174678997374033920/5_6IucF8_400x400.png",
    filterLogic: (name) => {
      const normalized = name.toLowerCase();
      return normalized.includes("lays") || normalized.includes("lay's");
    }
  },
];

interface BrandsSectionProps {
  onBrandClick: (brand: string) => void;
  selectedBrand: string;
}

export const BrandsSection = ({ onBrandClick, selectedBrand }: BrandsSectionProps) => {
  // Carousel para desktop também
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps"
  });

  // Scroll horizontal com mouse wheel (desktop)
  useEffect(() => {
    const emblaNode = emblaApi?.rootNode();
    if (!emblaNode) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        emblaNode.scrollLeft += e.deltaY;
      }
    };

    emblaNode.addEventListener('wheel', handleWheel, { passive: false });
    return () => emblaNode.removeEventListener('wheel', handleWheel);
  }, [emblaApi]);

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
                    "hover:shadow-xl hover:shadow-primary/20 hover:scale-105 active:scale-95",
                    isSelected
                      ? "border-primary ring-2 ring-primary scale-105"
                      : "border-border group-hover:border-primary/50"
                  )}
                >
                  <img 
                    src={brand.logo} 
                    alt={`Logo ${brand.name}`}
                    className={getLogoClasses(brand.name)}
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

      {/* Desktop: Carousel horizontal */}
      <div className="hidden md:block overflow-hidden px-4 md:px-8" ref={emblaRef}>
        <div className="flex gap-6">
        {brands.map((brand) => {
          const isSelected = selectedBrand === brand.searchTerm;
          return (
            <div
              key={brand.id}
              onClick={() => onBrandClick(isSelected ? "" : brand.searchTerm)}
              className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div
                className={cn(
                  "w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden",
                  "border-2 transition-all duration-300",
                  "hover:shadow-xl hover:shadow-primary/20 hover:scale-105 active:scale-95",
                  isSelected
                    ? "border-primary ring-2 ring-primary scale-105"
                    : "border-border group-hover:border-primary/50"
                )}
              >
                <img 
                  src={brand.logo} 
                  alt={`Logo ${brand.name}`}
                  className={getLogoClasses(brand.name)}
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
    </div>
  );
};

export { brands };
