import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
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
}

const categories: Category[] = [
  { name: "Cervejas", value: "Cervejas", image: cervejasImg },
  { name: "Destilados", value: "Destilados", image: destiladosImg },
  { name: "Vinhos", value: "Vinhos", image: vinhosImg },
  { name: "Drinks", value: "Drinks", image: drinksImg },
  { name: "Refrigerantes", value: "Refrigerantes", image: refrigerantesImg },
  { name: "Águas", value: "Águas", image: aguasImg },
  { name: "Sucos", value: "Sucos", image: aguasImg },
  { name: "Chocolates", value: "Chocolates", image: chocolatesImg },
  { name: "Snacks", value: "Snacks", image: snacksImg },
  { name: "Doces", value: "Doces", image: balasImg },
  { name: "Copão", value: "Copão", image: copaoImg },
  { name: "Tabacaria", value: "Tabacaria", image: cigarrosImg },
  { name: "Gelos", value: "Gelos", image: gelosImg },
];

interface CategoryChipsProps {
  onCategoryChange: (category: string) => void;
  selectedCategory: string;
}

export const CategoryChips = ({ onCategoryChange, selectedCategory }: CategoryChipsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative mb-6">
      <div 
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={cn(
          "overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-hide",
          isDragging ? "cursor-grabbing select-none" : "cursor-grab"
        )}
      >
        <div className="flex gap-3 px-4 py-2">
          {categories.map((category) => {
            const isSelected = selectedCategory === category.value;
            
            return (
              <Card
                key={category.value}
                onClick={() => onCategoryChange(isSelected ? "" : category.value)}
                className={cn(
                  "flex-shrink-0 w-24 h-28 cursor-pointer overflow-hidden transition-all duration-300",
                  "hover:scale-105 active:scale-95",
                  isSelected 
                    ? "ring-2 ring-primary scale-105 shadow-lg" 
                    : "hover:shadow-md"
                )}
              >
                <div className="h-20 overflow-hidden bg-muted">
                  <img 
                    src={category.image} 
                    alt={category.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-1.5 text-center bg-card">
                  <span className={cn(
                    "text-[10px] font-semibold leading-tight line-clamp-2",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {category.name}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
      
      {/* Gradiente fade nas bordas para indicar scroll */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background via-background to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background via-background to-transparent pointer-events-none z-10" />
    </div>
  );
};
