import { cn } from "@/lib/utils";
import { ProductVariant } from "@/utils/productVariants";

interface MobileThumbnailsProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant;
  onSelect: (variant: ProductVariant, index: number) => void;
}

export const MobileThumbnails = ({ variants, selectedVariant, onSelect }: MobileThumbnailsProps) => {
  if (variants.length <= 1) return null;

  return (
    <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-muted/30 scrollbar-hide">
      {variants.map((variant, index) => (
        <button
          key={variant.id}
          onClick={() => onSelect(variant, index)}
          className={cn(
            "flex-shrink-0 w-12 h-12 rounded-xl border-2 overflow-hidden transition-all bg-white",
            selectedVariant.id === variant.id
              ? "border-primary ring-2 ring-primary/30 scale-105"
              : "border-transparent hover:border-primary/30",
            !variant.available && "opacity-40"
          )}
        >
          {variant.image_url ? (
            <img
              src={variant.image_url}
              alt={variant.flavor}
              className="w-full h-full object-contain p-1"
            />
          ) : (
            <div className="w-full h-full bg-muted/50" />
          )}
        </button>
      ))}
    </div>
  );
};
