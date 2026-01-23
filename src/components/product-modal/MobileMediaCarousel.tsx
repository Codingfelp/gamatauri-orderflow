import useEmblaCarousel from "embla-carousel-react";
import { useEffect } from "react";
import { ProductVariant, getProductColor } from "@/utils/productVariants";
import { Pencil } from "lucide-react";

interface MobileMediaCarouselProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant;
  onVariantChange: (variant: ProductVariant) => void;
  modalBgColor?: string | null;
  category?: string;
  isEditMode?: boolean;
  onEditClick?: () => void;
}

export const MobileMediaCarousel = ({
  variants,
  selectedVariant,
  onVariantChange,
  modalBgColor,
  category,
  isEditMode,
  onEditClick,
}: MobileMediaCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });

  // Sync carousel with selectedVariant
  useEffect(() => {
    if (!emblaApi) return;
    const index = variants.findIndex((v) => v.id === selectedVariant.id);
    if (index !== -1 && emblaApi.selectedScrollSnap() !== index) {
      emblaApi.scrollTo(index);
    }
  }, [selectedVariant, emblaApi, variants]);

  // Update selectedVariant when carousel changes (swipe)
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap();
      const next = variants[index];
      if (next && next.id !== selectedVariant.id) {
        onVariantChange(next);
      }
    };

    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, variants, selectedVariant.id, onVariantChange]);

  const productBg = getProductColor(selectedVariant.name, selectedVariant.flavor, category);
  const bgStyle = !modalBgColor
    ? productBg.type === "image"
      ? { backgroundImage: `url(${productBg.value})`, backgroundSize: "cover", backgroundPosition: "center" }
      : { background: productBg.value }
    : {};

  return (
    <div
      className="relative h-[200px] flex items-center justify-center overflow-hidden"
      style={modalBgColor ? { backgroundColor: modalBgColor } : undefined}
    >
      {/* Edit button (admin only) */}
      {isEditMode && onEditClick && (
        <button
          onClick={onEditClick}
          className="absolute top-3 left-3 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg transition-colors z-50"
          title="Editar cor de fundo"
        >
          <Pencil className="w-4 h-4 text-foreground" />
        </button>
      )}

      {/* Background layer */}
      <div className="absolute inset-0" style={bgStyle}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
      </div>

      {/* Swipeable carousel */}
      <div ref={emblaRef} className="relative z-10 w-full h-full overflow-hidden touch-pan-y">
        <div className="flex h-full">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="flex-[0_0_100%] min-w-0 h-full flex items-center justify-center"
              aria-hidden={variant.id !== selectedVariant.id}
            >
              <img
                src={variant.image_url || ""}
                alt={variant.name}
                draggable={false}
                className="max-w-[60%] max-h-[160px] object-contain drop-shadow-lg select-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
