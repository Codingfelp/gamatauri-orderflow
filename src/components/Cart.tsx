import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, ShoppingCart, Trash2, Loader2, MapPin, ChevronDown, Tag, Gift, Heart, Store } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { useAuth } from "@/hooks/useAuth";
import { AddressSelectorModal } from "./AddressSelectorModal";
import { isStructuredAddressComplete } from "@/utils/addressValidator";
import { useBundles } from "@/hooks/useBundles";
import { motion, AnimatePresence } from "framer-motion";
import { useStoreSettings } from "@/contexts/StoreStatusContext";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onCheckout: (shippingFee: number, deliveryAddress: string, couponId: string | null, discountAmount: number, bundleDiscount?: number, deliveryType?: 'delivery' | 'pickup') => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface Address {
  id: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  is_primary: boolean;
  shipping_fee: number | null;
  distance_km?: number | null;
}

export const Cart = ({ items, onUpdateQuantity, onRemove, onCheckout, isOpen, onOpenChange }: CartProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { calculateBundleDiscounts, getTotalBundleDiscount, getItemsRemainingForBundle } = useBundles();
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [addressValid, setAddressValid] = useState(true);
  const [isOutOfRange, setIsOutOfRange] = useState(false);
  const [outOfRangeDistance, setOutOfRangeDistance] = useState<number | null>(null);
  const [maxRadiusKm, setMaxRadiusKm] = useState<number>(5);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  
  // Hook para configurações dinâmicas da loja
  const { storeSettings } = useStoreSettings();
  
  // Estado para favoritar itens do carrinho
  const [showFavoritePrompt, setShowFavoritePrompt] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [existingFavorites, setExistingFavorites] = useState<string[]>([]);
  const [hasShownPrompt, setHasShownPrompt] = useState(false);
  
  // Calcular descontos de bundle
  const bundleDiscounts = calculateBundleDiscounts(items);
  const totalBundleDiscount = getTotalBundleDiscount(items);
  
  // Carregar endereço primário e favoritos automaticamente ao abrir carrinho
  useEffect(() => {
    if (user) {
      loadPrimaryAddress();
      loadExistingFavorites();
    }
  }, [user]);

  // Reavaliar "fora do raio" quando o raio da loja mudar (Realtime) ou quando trocar o endereço
  useEffect(() => {
    if (!selectedAddress) return;
    if (!addressValid) return;

    const distanceKm = selectedAddress.distance_km;
    if (typeof distanceKm !== 'number') return;

    const isOut = distanceKm > storeSettings.maxDeliveryRadiusKm;
    setIsOutOfRange(isOut);

    if (isOut) {
      setOutOfRangeDistance(distanceKm);
      setMaxRadiusKm(storeSettings.maxDeliveryRadiusKm);
      if (deliveryType === 'delivery') setShippingFee(0);
    } else {
      setOutOfRangeDistance(null);
      setMaxRadiusKm(storeSettings.maxDeliveryRadiusKm);
      if (selectedAddress.shipping_fee !== null) setShippingFee(selectedAddress.shipping_fee);
    }
  }, [storeSettings.maxDeliveryRadiusKm, selectedAddress, addressValid, deliveryType]);

  // Mostrar prompt de favoritar quando houver itens não favoritados
  useEffect(() => {
    if (user && items.length > 0 && !hasShownPrompt) {
      const unfavoritedItems = items.filter(item => !existingFavorites.includes(item.id));
      if (unfavoritedItems.length > 0) {
        // Mostrar prompt após 2 segundos de visualização do carrinho
        const timer = setTimeout(() => {
          setShowFavoritePrompt(true);
          setHasShownPrompt(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, items, existingFavorites, hasShownPrompt]);

  const loadExistingFavorites = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('favorite_products')
        .eq('user_id', user.id)
        .single();
      
      if (!error && data?.favorite_products) {
        setExistingFavorites(data.favorite_products);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const handleFavoriteItems = async () => {
    if (!user) return;
    
    setFavoriteLoading(true);
    try {
      // Pegar apenas itens que ainda não são favoritos
      const newFavorites = items
        .map(item => item.id)
        .filter(id => !existingFavorites.includes(id));
      
      if (newFavorites.length === 0) {
        toast({
          title: "Todos já favoritados! 💙",
          description: "Esses itens já estão nos seus favoritos",
        });
        setShowFavoritePrompt(false);
        return;
      }

      const updatedFavorites = [...existingFavorites, ...newFavorites];
      
      const { error } = await supabase
        .from('profiles')
        .update({ favorite_products: updatedFavorites })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setExistingFavorites(updatedFavorites);
      setShowFavoritePrompt(false);
      
      toast({
        title: "Favoritados! 💙",
        description: `${newFavorites.length} ${newFavorites.length === 1 ? 'produto adicionado' : 'produtos adicionados'} aos seus favoritos`,
      });
    } catch (error) {
      console.error('Error favoriting items:', error);
      toast({
        variant: "destructive",
        title: "Erro ao favoritar",
        description: "Tente novamente",
      });
    } finally {
      setFavoriteLoading(false);
    }
  };

  const loadPrimaryAddress = async () => {
    if (!user) return;
    
    try {
      const { data: address, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .maybeSingle();

      if (error) throw error;
      
      if (address) {
        setSelectedAddress(address);
        
        // Validar endereço usando estrutura direta
        const validation = isStructuredAddressComplete({
          street: address.street,
          number: address.number,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state
        });
        setAddressValid(validation.complete);
        
        if (!validation.complete) {
          toast({
            title: "Endereço incompleto",
            description: validation.reason || "Complete seu endereço para continuar",
            variant: "destructive",
          });
          // Não retornar aqui - permitir que o usuário veja o endereço e possa corrigir
        }
        
        // Se já temos distância salva, conseguimos decidir "fora do raio" sem chamar o backend
        if (validation.complete && typeof (address as any).distance_km === 'number') {
          const distanceKm = Number((address as any).distance_km);
          if (!Number.isNaN(distanceKm) && distanceKm > storeSettings.maxDeliveryRadiusKm) {
            setIsOutOfRange(true);
            setOutOfRangeDistance(distanceKm);
            setMaxRadiusKm(storeSettings.maxDeliveryRadiusKm);
            setShippingFee(0);
            return;
          }
        }

        // Calcular frete mesmo se endereço incompleto (mas não permitir checkout)
        if (address.shipping_fee !== null && validation.complete) {
          setShippingFee(address.shipping_fee);
        } else if (validation.complete) {
          // Calcular frete automaticamente apenas se endereço válido
          await calculateAndSaveShipping(address);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar endereço:", error);
    }
  };

  const calculateAndSaveShipping = async (address: Address) => {
    setLoadingShipping(true);
    setIsOutOfRange(false);
    setOutOfRangeDistance(null);
    const fullAddress = `${address.street}, ${address.number}, ${address.neighborhood}, ${address.city} - ${address.state}`;
    
    try {
      const response = await supabase.functions.invoke('calculate-shipping', {
        body: { destination: fullAddress }
      });

      // Extrair data e error
      const { data, error } = response;

      // Função auxiliar para processar resposta de "fora do raio"
      const handleOutOfRange = (distance?: number, maxRadius?: number) => {
        setIsOutOfRange(true);
        if (distance) setOutOfRangeDistance(distance);
        if (maxRadius) setMaxRadiusKm(maxRadius);
        setShippingFee(0);
        toast({
          title: "Fora da área de entrega",
          description: `Você está a ${distance ? distance.toFixed(1) + 'km' : 'além do raio'}. Opte por retirar na loja!`,
        });
      };

      // Caso 1: Sucesso com out_of_range no data (edge function retornou 200 mas com flag)
      if (data?.out_of_range) {
        // Persistir distância/frete para auditoria e para que o app consiga mostrar o aviso sem recalcular
        try {
          await supabase
            .from('user_addresses')
            .update({
              shipping_fee: data.shipping_fee ?? null,
              distance_km: data.distance_km ?? null,
            })
            .eq('id', address.id);
        } catch (e) {
          console.warn('Não foi possível salvar distância/frete (fora do raio):', e);
        }

        handleOutOfRange(data.distance_km, data.max_radius_km);
        return;
      }

      // Caso 2: Erro da Edge Function (status 400)
      if (error) {
        console.log('🔍 Erro da Edge Function:', error);
        
        // Tentar várias formas de extrair o body JSON do erro
        let errorBody: any = null;
        
        // Método 1: error.context?.body (formato padrão Supabase)
        try {
          if (error.context?.body) {
            const bodyStr = typeof error.context.body === 'string' 
              ? error.context.body 
              : JSON.stringify(error.context.body);
            errorBody = JSON.parse(bodyStr);
          }
        } catch (e) { /* ignore */ }
        
        // Método 2: Tentar parsear a mensagem de erro diretamente
        if (!errorBody && typeof error.message === 'string') {
          try {
            // A mensagem pode ser JSON puro ou conter JSON embutido
            const jsonMatch = error.message.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              errorBody = JSON.parse(jsonMatch[0]);
            }
          } catch (e) { /* ignore */ }
        }

        // Método 3: Verificar se error.context é o próprio body
        if (!errorBody && error.context && typeof error.context === 'object') {
          errorBody = error.context;
        }

        console.log('🔍 Error body parseado:', errorBody);

        // Verificar se é erro de fora do raio
        if (errorBody?.out_of_range) {
          handleOutOfRange(errorBody.distance_km, errorBody.max_radius_km);
          return;
        }

        // Fallback: verificar texto do erro
        const errorMessage = (error.message || '').toLowerCase();
        const bodyMessage = JSON.stringify(errorBody || {}).toLowerCase();
        if (
          errorMessage.includes('fora') || 
          errorMessage.includes('out_of_range') || 
          bodyMessage.includes('out_of_range') ||
          bodyMessage.includes('fora da área')
        ) {
          handleOutOfRange();
          return;
        }

        // Erro genérico - mas NÃO fazer throw para evitar crash
        console.error('Erro ao calcular frete:', error);
        toast({
          variant: "destructive",
          title: "Erro ao calcular frete",
          description: errorBody?.message || error.message || 'Tente novamente',
        });
        return;
      }

      // Caso 3: Sucesso - salvar frete e distância no banco
      if (data?.shipping_fee !== undefined) {
        setIsOutOfRange(false);
        
        // Garantir que o frete seja sempre inteiro (arredondado para cima)
        const roundedShippingFee = Math.ceil(data.shipping_fee);
        
        // Salvar frete E distância calculada no endereço
        await supabase
          .from('user_addresses')
          .update({ 
            shipping_fee: roundedShippingFee,
            distance_km: data.distance_km || null
          })
          .eq('id', address.id);
        
        setShippingFee(roundedShippingFee);
        setSelectedAddress({ ...address, shipping_fee: roundedShippingFee });
        
        toast({
          title: "Frete calculado!",
          description: `R$ ${roundedShippingFee} (${data.distance_km?.toFixed(1) || '?'}km)`,
        });
      }
    } catch (error: any) {
      console.error('Erro inesperado ao calcular frete:', error);
      
      // Verificar se o erro contém informação de fora do raio (último recurso)
      const errorStr = JSON.stringify(error).toLowerCase();
      if (errorStr.includes('out_of_range') || errorStr.includes('fora')) {
        setIsOutOfRange(true);
        setShippingFee(0);
        toast({
          title: "Fora da área de entrega",
          description: `Você pode optar por retirar na loja!`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao calcular frete",
          description: 'Verifique seu endereço e tente novamente',
        });
      }
    } finally {
      setLoadingShipping(false);
    }
  };

  const handleAddressSelect = async (address: Address) => {
    // Resetar estados antes de processar novo endereço
    setIsOutOfRange(false);
    setOutOfRangeDistance(null);
    setDeliveryType('delivery'); // Reset para entrega padrão ao trocar endereço
    setShippingFee(0);
    
    setSelectedAddress(address);
    
    // Validar endereço usando estrutura direta
    const validation = isStructuredAddressComplete({
      street: address.street,
      number: address.number,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state
    });
    setAddressValid(validation.complete);
    
    if (!validation.complete) {
      toast({
        title: "Endereço incompleto",
        description: validation.reason || "Complete seu endereço",
        variant: "destructive",
      });
      return;
    }

    // SEMPRE recalcular o frete ao trocar de endereço para garantir dados atualizados
    // Isso usa as configurações mais recentes do storeSettings (via realtime)
    await calculateAndSaveShipping(address);
  };

  const applyCoupon = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Faça login para usar cupom",
      });
      return;
    }

    if (!couponCode.trim()) {
      setCouponError('Digite um código de cupom');
      return;
    }

    // Verificar cupons expirados conhecidos no frontend
    const expiredCoupons = ['TAURIFRETEOFF'];
    if (expiredCoupons.includes(couponCode.toUpperCase().trim())) {
      setCouponError('');
      toast({
        variant: "destructive",
        title: "Cupom expirado",
        description: "Este cupom não está mais disponível.",
      });
      setCouponCode('');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const { data, error } = await supabase.rpc('validate_coupon', {
        p_code: couponCode.toUpperCase(),
        p_user_id: user.id,
        p_shipping_fee: shippingFee
      });

      if (error) throw error;

      const result = data as any;
      if (!result.valid) {
        setCouponError(result.error);
        toast({
          variant: "destructive",
          title: result.error,
        });
        return;
      }

      setAppliedCoupon(result);
      setCouponDiscount(result.discount);
      toast({
        title: "Cupom aplicado! 🎉",
        description: result.description,
      });
    } catch (error: any) {
      console.error('Erro ao aplicar cupom:', error);
      setCouponError('Erro ao validar cupom');
      toast({
        variant: "destructive",
        title: "Erro ao aplicar cupom",
        description: error.message,
      });
    } finally {
      setCouponLoading(false);
    }
  };
  
  // Se for retirada, não cobra frete
  const effectiveShippingFee = deliveryType === 'pickup' ? 0 : shippingFee;
  const finalShippingFee = Math.max(0, effectiveShippingFee - couponDiscount);
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal - totalBundleDiscount + finalShippingFee;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Permitir checkout para retirada mesmo se fora do raio
  const canCheckout = items.length > 0 && (
    (deliveryType === 'pickup') || 
    (deliveryType === 'delivery' && shippingFee > 0 && addressValid && selectedAddress !== null && !isOutOfRange)
  );

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        {/* Botão flutuante original apenas para desktop */}
        <SheetTrigger asChild className="hidden md:flex">
          <Button 
            size="lg" 
            className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl hover:shadow-xl hover:scale-110 transition-all z-50"
          >
            <ShoppingCart className="w-7 h-7" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-sm w-7 h-7 rounded-full flex items-center justify-center font-bold shadow-lg animate-in">
                {itemCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-semibold">Carrinho</SheetTitle>
              {itemCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                </span>
              )}
            </div>
          </SheetHeader>
          
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
              <ShoppingCart className="w-16 h-16 mb-4 text-muted-foreground/30" />
              <p className="text-lg font-medium text-card-foreground">Carrinho vazio</p>
              <p className="text-sm text-muted-foreground">Adicione produtos para continuar</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <ScrollArea className="flex-1 -mx-6 px-6 my-4">
                <div className="space-y-0">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-primary font-bold text-sm">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border rounded-full">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (item.quantity <= 1) {
                                onRemove(item.id);
                                toast({ title: "Item removido do carrinho" });
                              } else {
                                onUpdateQuantity(item.id, item.quantity - 1);
                              }
                            }}
                            className="h-7 w-7 rounded-l-full hover:bg-accent"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="h-7 w-7 rounded-r-full hover:bg-accent"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemove(item.id)}
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Prompt para favoritar itens */}
                <AnimatePresence>
                  {showFavoritePrompt && user && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4"
                    >
                      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-full shrink-0">
                            <Heart className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              Gostaria de favoritar esses itens?
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Assim fica mais fácil comprar de novo 💙
                            </p>
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                onClick={handleFavoriteItems}
                                disabled={favoriteLoading}
                                className="h-8 text-xs"
                              >
                                {favoriteLoading ? (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                ) : (
                                  <Heart className="w-3 h-3 mr-1" />
                                )}
                                Favoritar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowFavoritePrompt(false)}
                                className="h-8 text-xs text-muted-foreground"
                              >
                                Agora não
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </ScrollArea>
              
              {/* ENDEREÇO COMPACTO */}
              <button 
                onClick={() => setShowAddressModal(true)}
                className="w-full flex items-center justify-between py-3 px-4 border-t hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  {selectedAddress ? (
                    <span className="truncate text-sm">
                      {selectedAddress.street}, {selectedAddress.number} - {selectedAddress.neighborhood}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Selecionar endereço</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {loadingShipping ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : isOutOfRange ? (
                    <span className="text-xs text-destructive font-medium">Fora do raio</span>
                  ) : shippingFee > 0 ? (
                    <span className="text-sm font-semibold text-primary">R$ {Math.ceil(shippingFee)}</span>
                  ) : selectedAddress && !addressValid ? (
                    <span className="text-xs text-destructive">Incompleto</span>
                  ) : null}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>

              {/* Mensagem fora da área de atendimento com opção de retirada */}
              {isOutOfRange && deliveryType === 'delivery' && (
                <div className="mx-4 p-4 bg-muted/50 border border-border rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-full shrink-0">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        Endereço fora da área de entrega
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {outOfRangeDistance 
                          ? `Distância: ${outOfRangeDistance.toFixed(1)}km (máx. ${storeSettings.maxDeliveryRadiusKm}km)`
                          : `Raio máximo: ${storeSettings.maxDeliveryRadiusKm}km`}
                      </p>
                      <Button
                        size="sm"
                        className="mt-3 h-9"
                        onClick={() => setDeliveryType('pickup')}
                      >
                        <Store className="w-4 h-4 mr-2" />
                        Retirar na loja
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modo retirada na loja selecionado */}
              {deliveryType === 'pickup' && (
                <div className="mx-4 p-4 bg-muted/50 border border-border rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full shrink-0">
                        <Store className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Retirada na loja
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          R. Aiuruoca, 192 - Fernão Dias
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">
                        Grátis
                      </p>
                      {/* Só mostrar opção de alterar se o endereço está dentro do raio */}
                      {!isOutOfRange && (
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                          onClick={() => setDeliveryType('delivery')}
                        >
                          Alterar para entrega
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* CUPOM COLAPSÁVEL */}
              <Collapsible>
                <CollapsibleTrigger className="w-full flex items-center justify-between py-3 px-4 border-t hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {appliedCoupon ? appliedCoupon.description : "Adicionar cupom"}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="flex gap-2 px-4 pb-3">
                    <Input
                      placeholder="Código do cupom"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError('');
                      }}
                      className={`text-sm ${couponError ? 'border-destructive' : ''}`}
                      disabled={!!appliedCoupon}
                    />
                    <Button
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponCode || !!appliedCoupon}
                      size="sm"
                      className="shrink-0"
                    >
                      {couponLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Aplicar'
                      )}
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-destructive px-4 pb-2">{couponError}</p>
                  )}
                  {appliedCoupon && (
                    <div className="flex items-center justify-between px-4 pb-2">
                      <span className="text-sm text-primary font-medium">Aplicado</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponDiscount(0);
                          setCouponCode('');
                        }}
                        className="h-7 text-xs"
                      >
                        Remover
                      </Button>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* FOOTER COMPACTO */}
              <div className="border-t pt-3 pb-4 space-y-1 px-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                
                {/* Descontos de Bundle */}
                {bundleDiscounts.length > 0 && (
                  <div className="space-y-1">
                    {bundleDiscounts.map((bundle) => (
                      <div key={bundle.bundleId} className="flex justify-between text-sm">
                        <span className="text-emerald-600 flex items-center gap-1">
                          <Gift className="h-3 w-3" />
                          {bundle.bundleName}
                        </span>
                        <span className="text-emerald-600 font-medium">
                          - R$ {bundle.discount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                {deliveryType === 'delivery' && effectiveShippingFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Entrega</span>
                    <div className="text-right">
                      {couponDiscount > 0 && (
                        <div className="text-xs line-through text-muted-foreground">
                          R$ {Math.ceil(effectiveShippingFee)}
                        </div>
                      )}
                      <span className="text-primary font-medium">
                        R$ {Math.ceil(finalShippingFee)}
                      </span>
                    </div>
                  </div>
                )}
                {deliveryType === 'pickup' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Store className="h-3 w-3" />
                      Retirada na loja
                    </span>
                    <span className="text-primary font-medium">Grátis</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-2 border-t mt-2">
                  <span>Total</span>
                  <span className="text-primary">R$ {total.toFixed(2)}</span>
                </div>
                <Button 
                  size="lg"
                  className="w-full mt-3"
                  disabled={!canCheckout}
                  onClick={() => {
                    const deliveryAddress = deliveryType === 'pickup' 
                      ? 'Retirada na loja - R. Aiuruoca, 192 - Fernão Dias, BH'
                      : selectedAddress 
                        ? `${selectedAddress.street}, ${selectedAddress.number}${
                            selectedAddress.complement ? ', ' + selectedAddress.complement : ''
                          }, ${selectedAddress.neighborhood}, ${selectedAddress.city} - ${selectedAddress.state}`
                        : '';
                    onCheckout(
                      finalShippingFee,
                      deliveryAddress,
                      appliedCoupon?.coupon_id || null,
                      couponDiscount,
                      totalBundleDiscount,
                      deliveryType
                    );
                  }}
                  title={!canCheckout ? (deliveryType === 'delivery' && isOutOfRange ? "Escolha retirar na loja ou altere o endereço" : "Complete o endereço e aguarde o cálculo do frete") : ""}
                >
                  {deliveryType === 'pickup' 
                    ? "Finalizar - Retirar na Loja" 
                    : isOutOfRange && deliveryType === 'delivery'
                      ? "Escolha retirar na loja"
                      : !addressValid 
                        ? "Complete seu endereço" 
                        : "Finalizar Pedido"}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {user && (
        <AddressSelectorModal
          open={showAddressModal}
          onOpenChange={setShowAddressModal}
          onSelectAddress={handleAddressSelect}
        />
      )}
    </>
  );
};
