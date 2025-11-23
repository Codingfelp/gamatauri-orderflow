import { Sparkles, TrendingUp, Gift, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryProductRow } from "./CategoryProductRow";
import { useRecommendations } from "@/hooks/useRecommendations";
import type { Product } from "@/services/productsService";
import { motion } from "framer-motion";

interface RecommendedSectionProps {
  allProducts: Product[];
  onAddToCart: (product: Product) => void;
}

export const RecommendedSection = ({ allProducts, onAddToCart }: RecommendedSectionProps) => {
  const {
    recommendations,
    loading,
    hasRecommendations,
    refreshRecommendations,
    getTopRecurrentProducts,
    getSimilarProducts,
    getComboProducts,
  } = useRecommendations(allProducts);

  if (loading) {
    return (
      <div className="mb-12 bg-gradient-to-br from-primary/5 via-accent/10 to-background rounded-3xl shadow-lg p-8 animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 bg-primary/20 rounded-full" />
          <div className="h-8 w-48 bg-primary/20 rounded" />
        </div>
        <div className="h-40 bg-muted/20 rounded-xl" />
      </div>
    );
  }

  if (!hasRecommendations) {
    return null;
  }

  const topRecurrentProducts = getTopRecurrentProducts(allProducts);
  const similarProducts = getSimilarProducts(allProducts);
  const comboProducts = getComboProducts(allProducts);

  const totalOrders = recommendations?.metadata?.total_orders || 0;
  const lastUpdated = recommendations?.metadata?.last_updated 
    ? new Date(recommendations.metadata.last_updated).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      })
    : 'hoje';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12 bg-gradient-to-br from-primary/5 via-accent/10 to-background rounded-3xl shadow-2xl p-6 md:p-8 border border-primary/10"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Sparkles className="h-7 w-7 md:h-8 md:w-8 text-primary animate-pulse" />
            <div className="absolute inset-0 h-7 w-7 md:h-8 md:w-8 bg-primary/20 rounded-full blur-xl" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Recomendado para Você
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Baseado em {totalOrders} {totalOrders === 1 ? 'pedido' : 'pedidos'}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={refreshRecommendations}
          className="hidden md:flex gap-2 hover:bg-primary/10"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Tabs dinâmicas */}
      <Tabs defaultValue="recurrent" className="w-full">
        <TabsList className="w-full bg-background/80 backdrop-blur-sm border border-border/50 mb-6 h-auto flex-wrap justify-start gap-2 p-2">
          {topRecurrentProducts.length > 0 && (
            <TabsTrigger
              value="recurrent"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-data-[state=active]:animate-shimmer" />
              <TrendingUp className="h-4 w-4" />
              <span className="relative z-10">🔥 Você Sempre Pega</span>
              <Badge variant="secondary" className="ml-1 relative z-10">
                {topRecurrentProducts.length}
              </Badge>
            </TabsTrigger>
          )}
          
          {similarProducts.length > 0 && (
            <TabsTrigger
              value="similar"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Sparkles className="h-4 w-4" />
              <span>✨ Também Pode Curtir</span>
              <Badge variant="secondary" className="ml-1">
                {similarProducts.length}
              </Badge>
            </TabsTrigger>
          )}
          
          {comboProducts.length > 0 && (
            <TabsTrigger
              value="combos"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Gift className="h-4 w-4" />
              <span>🎉 Combos Inteligentes</span>
              <Badge variant="secondary" className="ml-1">
                {comboProducts.length}
              </Badge>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Conteúdo das tabs */}
        {topRecurrentProducts.length > 0 && (
          <TabsContent value="recurrent" className="mt-0">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Os produtos que você mais compra conosco
              </p>
            </div>
            <CategoryProductRow
              category="🔥 Seus Favoritos"
              products={topRecurrentProducts}
              onAddToCart={onAddToCart}
            />
          </TabsContent>
        )}

        {similarProducts.length > 0 && (
          <TabsContent value="similar" className="mt-0">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Produtos similares aos seus favoritos
              </p>
            </div>
            <CategoryProductRow
              category="✨ Sugestões Personalizadas"
              products={similarProducts}
              onAddToCart={onAddToCart}
            />
          </TabsContent>
        )}

        {comboProducts.length > 0 && (
          <TabsContent value="combos" className="mt-0">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Combinações perfeitas para você
              </p>
            </div>
            <div className="space-y-6">
              {comboProducts.map((comboData, idx) => (
                <div key={idx} className="bg-accent/20 rounded-xl p-4 border border-accent/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className="h-5 w-5 text-accent" />
                    <h3 className="font-bold text-lg">{comboData.combo.combo_name}</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {comboData.combo.metadata?.description}
                    </Badge>
                  </div>
                  <CategoryProductRow
                    category=""
                    products={comboData.products}
                    onAddToCart={onAddToCart}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Footer com info de atualização */}
      <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
        <p>
          Atualizado em <span className="font-medium">{lastUpdated}</span>
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshRecommendations}
          className="md:hidden gap-2 h-8 px-3"
        >
          <RefreshCw className="h-3 w-3" />
          Atualizar
        </Button>
      </div>
    </motion.div>
  );
};
