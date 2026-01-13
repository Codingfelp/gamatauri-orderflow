import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Package } from "lucide-react";
import { getProductColor } from "@/utils/productVariants";

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
  const isOutOfStock = !product.available;

  const productBg = getProductColor(product.name, "", product.category || "");

  // Determinar o estilo de background baseado no tipo
  const backgroundStyle =
    productBg.type === "image"
      ? { backgroundImage: `url(${productBg.value})`, backgroundSize: "cover", backgroundPosition: "center" }
      : { background: productBg.value };

  return (
    <div
      className={`flex-shrink-0 w-full group transition-all duration-300 ${
        isOutOfStock ? "opacity-50" : "hover:-translate-y-1"
      }`}
    >
      {/* Card chip-style com animação hover */}
      <div className="bg-white rounded-2xl border border-border/20 shadow-md hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 overflow-hidden">
        {/* Área da imagem com fundo colorido na parte inferior */}
        <div className="relative h-[75px] sm:h-[85px] mx-2 mt-2">
          {/* Fundo colorido posicionado na metade inferior */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[40px] sm:h-[45px] rounded-xl"
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
                className="max-w-[85%] max-h-[70px] sm:max-h-[80px] object-contain transition-transform duration-300 group-hover:scale-105"
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
          <p className="text-[10px] sm:text-[11px] font-medium text-foreground line-clamp-2 leading-tight min-h-[28px]">
            {product.name}
          </p>

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
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs sm:text-sm font-bold text-foreground">R$ {product.price.toFixed(2)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isOutOfStock) onAddToCart(product);
                }}
                disabled={isOutOfStock}
                className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
                  isOutOfStock
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-muted/40 text-primary hover:bg-muted"
                }`}
                aria-label="Adicionar ao carrinho"
              >
                <Plus className="h-4 w-4" />
              </button>
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
