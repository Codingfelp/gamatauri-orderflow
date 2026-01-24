import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Package, Clock, Flame } from "lucide-react";
import { getProductColor } from "@/utils/productVariants";
import { usePromotions } from "@/hooks/usePromotions";
import { useColorEditor } from "@/contexts/ColorEditorContext";
import { ColorPicker } from "@/components/ColorPicker";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  available: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  wizardMeta?: {
    reasons: string[];
    docura?: string;
    intensidade?: string;
    ocasioes?: string[];
  };
}

export const ProductCard = memo(({ product, onAddToCart, wizardMeta }: ProductCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getPromotionForProduct, isPromotionActive } = usePromotions();
  const { isEditMode, getProductColors, updateColor } = useColorEditor();
  const isOutOfStock = !product.available;

  const promotion = getPromotionForProduct(product.id);
  const hasPromo = !!promotion;
  const promoIsActive = promotion ? isPromotionActive(promotion) : false;

  // Get custom colors if they exist
  const customColors = getProductColors(product.name, product.category);
  
  // Default product background color
  const defaultProductBg = getProductColor(product.name, "", product.category || "");

  // Determine background style - custom colors take priority
  const backgroundStyle = customColors?.card_bg_color
    ? { background: customColors.card_bg_color }
    : defaultProductBg.type === "image"
      ? { backgroundImage: `url(${defaultProductBg.value})`, backgroundSize: "cover", backgroundPosition: "center" }
      : { background: defaultProductBg.value };

  // Text color from custom colors
  const textColor = customColors?.card_text_color;

  const displayPrice = promoIsActive && promotion ? promotion.promotional_price : product.price;
  const startDate = hasPromo ? new Date(promotion!.start_date) : null;
  const endDate = hasPromo ? new Date(promotion!.end_date) : null;
  const formattedStartDate = startDate?.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const formattedEndDate = endDate?.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    // Só aplica preço promocional dentro do período
    const productToAdd = promoIsActive && promotion
      ? { ...product, price: promotion.promotional_price }
      : product;

    onAddToCart(productToAdd);
  };

  return (
    <div
      className={`flex-shrink-0 w-full group transition-all duration-300 ${
        isOutOfStock ? "opacity-50" : "hover:-translate-y-1"
      }`}
    >
      {/* Card chip-style com animação hover - formato mais retangular vertical */}
       <div className={`bg-white rounded-2xl border shadow-md hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 overflow-hidden relative ${
         hasPromo ? "border-orange-200" : "border-border/20"
       }`}>
         {/* Promo badge */}
         {hasPromo && (
           <div className="absolute top-1 left-1 z-10 flex items-center gap-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
             <Flame className="w-2 h-2" />
             <span>{promoIsActive ? "PROMO" : "EM BREVE"}</span>
           </div>
         )}

          {/* Edit mode color button - bottom of card */}
          {isEditMode && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20">
              <div className="flex gap-1 bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg">
                <ColorPicker
                  currentColor={customColors?.card_bg_color || '#ffffff'}
                  onChange={(color) => updateColor(product.name, product.category, 'card_bg_color', color)}
                  label="Fundo"
                />
                <ColorPicker
                  currentColor={customColors?.card_text_color || '#000000'}
                  onChange={(color) => updateColor(product.name, product.category, 'card_text_color', color)}
                  label="Texto"
                />
              </div>
            </div>
          )}

        {/* Área da imagem com fundo colorido na parte inferior */}
        <div className="relative h-[90px] sm:h-[100px] mx-2 mt-2">
          {/* Fundo colorido posicionado na metade inferior */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[45px] sm:h-[50px] rounded-xl"
            style={backgroundStyle}
          >
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center rounded-xl">
                <span className="text-[8px] font-bold text-white bg-destructive px-1.5 py-0.5 rounded">Esgotado</span>
              </div>
            )}
          </div>
          {/* Imagem centralizada, "vazando" para cima do fundo colorido */}
          <div className="absolute inset-0 flex items-center justify-center">
            {product.image_url &&
            product.image_url !== "SIM" &&
            !product.image_url.startsWith("data:image") &&
            product.image_url.length > 10 ? (
              <img
                src={product.image_url}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className="max-w-[85%] max-h-[85px] sm:max-h-[95px] object-contain transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Package className="w-8 h-8 text-muted-foreground/40" />
            )}
          </div>
        </div>

        {/* Info compacta */}
        <div className="p-2 pt-1 space-y-1.5">
          <p 
            className="text-[10px] sm:text-[11px] font-medium line-clamp-2 leading-tight min-h-[28px]"
            style={textColor ? { color: textColor } : undefined}
          >
            {product.name}
          </p>

           {/* Promo period info */}
           {hasPromo && formattedEndDate && (
             <div className="flex items-center gap-1 text-[9px] text-orange-600 font-medium">
               <Clock className="w-2.5 h-2.5" />
               <span>
                 {promoIsActive
                   ? `Até ${formattedEndDate}`
                   : formattedStartDate
                     ? `Começa ${formattedStartDate}`
                     : `Até ${formattedEndDate}`}
               </span>
             </div>
           )}

          {/* Por que escolhi isso (apenas quando seleção do wizard está ativa) */}
          {wizardMeta && wizardMeta.reasons?.length > 0 && (
            <div className="rounded-lg border border-border/40 bg-muted/30 p-1.5 space-y-1">
              <p className="text-[9px] font-semibold text-foreground">Por que escolhi isso</p>
              <ul className="text-[9px] text-muted-foreground space-y-0.5">
                {wizardMeta.reasons.slice(0, 3).map((r, idx) => (
                  <li key={idx} className="leading-tight">• {r}</li>
                ))}
              </ul>
              {(wizardMeta.docura || wizardMeta.intensidade) && (
                <p className="text-[9px] text-muted-foreground leading-tight">
                  {wizardMeta.docura ? `Doçura: ${wizardMeta.docura}` : ""}
                  {wizardMeta.docura && wizardMeta.intensidade ? " • " : ""}
                  {wizardMeta.intensidade ? `Intensidade: ${wizardMeta.intensidade}` : ""}
                </p>
              )}
              {wizardMeta.ocasioes && wizardMeta.ocasioes.length > 0 && (
                <p className="text-[9px] text-muted-foreground leading-tight line-clamp-1">
                  Ocasiões: {wizardMeta.ocasioes.slice(0, 3).join(", ")}
                </p>
              )}
            </div>
          )}

          {user ? (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-1">
                 <span 
                   className="text-xs sm:text-sm font-bold"
                   style={textColor ? { color: textColor } : undefined}
                 >
                   R$ {displayPrice.toFixed(2)}
                 </span>
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     handleAddToCart();
                   }}
                   disabled={isOutOfStock || (hasPromo && !promoIsActive)}
                   className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
                     isOutOfStock || (hasPromo && !promoIsActive)
                       ? "bg-muted text-muted-foreground cursor-not-allowed"
                       : promoIsActive
                         ? "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                         : "bg-muted/40 text-primary hover:bg-muted"
                   }`}
                   aria-label="Adicionar ao carrinho"
                 >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
               {/* Original price - crossed out */}
               {promoIsActive && promotion && (
                 <p className="text-[10px] text-muted-foreground line-through text-center">
                   R$ {promotion.original_price.toFixed(2)}
                 </p>
               )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="w-full text-[9px] text-primary font-medium hover:underline text-center"
            >
              Entrar para ver preço
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";
