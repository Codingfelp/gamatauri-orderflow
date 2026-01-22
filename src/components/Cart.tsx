import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, ShoppingCart, Trash2, Loader2, MapPin, ChevronDown, Tag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { useAuth } from "@/hooks/useAuth";
import { AddressSelectorModal } from "./AddressSelectorModal";
import { isStructuredAddressComplete } from "@/utils/addressValidator";

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
  onCheckout: (shippingFee: number, deliveryAddress: string, couponId: string | null, discountAmount: number) => void;
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
}

export const Cart = ({ items, onUpdateQuantity, onRemove, onCheckout }: CartProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
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
  
  // Carregar endereço primário automaticamente ao abrir carrinho
  useEffect(() => {
    if (user) {
      loadPrimaryAddress();
    }
  }, [user]);

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
      const { data, error } = await supabase.functions.invoke('calculate-shipping', {
        body: { destination: fullAddress }
      });

      // Verificar se está fora do raio de atendimento
      if (data?.out_of_range) {
        setIsOutOfRange(true);
        setOutOfRangeDistance(data.distance_km);
        setShippingFee(0);
        toast({
          variant: "destructive",
          title: "Fora da área de atendimento",
          description: data.message || `Sua localização está a ${data.distance_km?.toFixed(1)}km. Entregamos até 5km.`,
        });
        return;
      }

      if (error) throw error;

      if (data?.shipping_fee) {
        setIsOutOfRange(false);
        // Salvar frete calculado no endereço
        await supabase
          .from('user_addresses')
          .update({ shipping_fee: data.shipping_fee })
          .eq('id', address.id);
        
        setShippingFee(data.shipping_fee);
        setSelectedAddress({ ...address, shipping_fee: data.shipping_fee });
        
        toast({
          title: "Frete calculado!",
          description: `R$ ${data.shipping_fee.toFixed(2)}`,
        });
      }
    } catch (error: any) {
      console.error('Erro ao calcular frete:', error);
      
      // Verificar se o erro é de fora da área
      if (error?.message?.includes('out_of_range') || error?.message?.includes('Fora da área')) {
        setIsOutOfRange(true);
        toast({
          variant: "destructive",
          title: "Fora da área de atendimento",
          description: "Infelizmente não entregamos nessa região. Máximo 5km.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao calcular frete",
          description: error.message || 'Tente novamente',
        });
      }
    } finally {
      setLoadingShipping(false);
    }
  };

  const handleAddressSelect = async (address: Address) => {
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
      setShippingFee(0); // Resetar frete
      return;
    }
    
    // Se já tem frete, usar. Senão, calcular
    if (address.shipping_fee !== null) {
      setShippingFee(address.shipping_fee);
    } else {
      await calculateAndSaveShipping(address);
    }
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
  
  const finalShippingFee = Math.max(0, shippingFee - couponDiscount);
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + finalShippingFee;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const canCheckout = items.length > 0 && shippingFee > 0 && addressValid && selectedAddress !== null && !isOutOfRange;

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            size="lg" 
            className="fixed bottom-20 right-6 h-16 w-16 rounded-full shadow-2xl hover:shadow-xl hover:scale-110 transition-all z-50 md:bottom-6"
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
                    <span className="text-sm font-semibold text-primary">R$ {shippingFee.toFixed(2)}</span>
                  ) : selectedAddress && !addressValid ? (
                    <span className="text-xs text-destructive">Incompleto</span>
                  ) : null}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>

              {/* Mensagem fora da área de atendimento */}
              {isOutOfRange && (
                <div className="mx-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive font-medium">
                    📍 Fora da área de entrega
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {outOfRangeDistance 
                      ? `Sua localização está a ${outOfRangeDistance.toFixed(1)}km. Entregamos apenas até 5km da nossa loja.`
                      : 'Infelizmente não entregamos nessa região. Nosso raio de entrega é de 5km.'}
                  </p>
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
                  <span>R$ {items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                </div>
                {shippingFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Entrega</span>
                    <div className="text-right">
                      {couponDiscount > 0 && (
                        <div className="text-xs line-through text-muted-foreground">
                          R$ {shippingFee.toFixed(2)}
                        </div>
                      )}
                      <span className="text-primary font-medium">
                        R$ {finalShippingFee.toFixed(2)}
                      </span>
                    </div>
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
                    if (!selectedAddress) return;
                    const deliveryAddress = `${selectedAddress.street}, ${selectedAddress.number}${
                      selectedAddress.complement ? ', ' + selectedAddress.complement : ''
                    }, ${selectedAddress.neighborhood}, ${selectedAddress.city} - ${selectedAddress.state}`;
                    onCheckout(
                      finalShippingFee,
                      deliveryAddress,
                      appliedCoupon?.coupon_id || null,
                      couponDiscount
                    );
                  }}
                  title={!canCheckout ? (isOutOfRange ? "Endereço fora da área de entrega" : "Complete o endereço e aguarde o cálculo do frete") : ""}
                >
                  {isOutOfRange ? "Fora da área de entrega" : !addressValid ? "Complete seu endereço" : "Finalizar Pedido"}
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
