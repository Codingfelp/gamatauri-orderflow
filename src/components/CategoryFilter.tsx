import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export const CategoryFilter = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) => {
  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-min px-1">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => onSelectCategory(null)}
          className={cn(
            "whitespace-nowrap transition-all",
            selectedCategory === null && "shadow-lg"
          )}
        >
          Todas
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            onClick={() => onSelectCategory(category)}
            className={cn(
              "whitespace-nowrap transition-all",
              selectedCategory === category && "shadow-lg"
            )}
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
};
