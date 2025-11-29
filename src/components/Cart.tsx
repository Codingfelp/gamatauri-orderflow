import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, ShoppingCart, Trash2, Loader2, MapPin } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "@/hooks/useAuth";
import { AddressSelectorModal } from "./AddressSelectorModal";
import { isAddressComplete } from "@/utils/addressValidator";

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
        
        // Validar endereço
        const fullAddress = `${address.street}, ${address.number}, ${address.neighborhood}`;
        const validation = isAddressComplete(fullAddress);
        setAddressValid(validation.complete);
        
        if (!validation.complete) {
          toast({
            title: "Endereço incompleto",
            description: validation.reason || "Complete seu endereço para continuar",
            variant: "destructive",
          });
          return;
        }
        
        // Se já tem frete calculado, usar
        if (address.shipping_fee !== null) {
          setShippingFee(address.shipping_fee);
        } else {
          // Calcular frete automaticamente
          await calculateAndSaveShipping(address);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar endereço:", error);
    }
  };

  const calculateAndSaveShipping = async (address: Address) => {
    setLoadingShipping(true);
    const fullAddress = `${address.street}, ${address.number}, ${address.neighborhood}, ${address.city} - ${address.state}`;
    
    try {
      const { data, error } = await supabase.functions.invoke('calculate-shipping', {
        body: { destination: fullAddress }
      });

      if (error) throw error;

      if (data?.shipping_fee) {
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
      toast({
        variant: "destructive",
        title: "Erro ao calcular frete",
        description: error.message || 'Tente novamente',
      });
    } finally {
      setLoadingShipping(false);
    }
  };

  const handleAddressSelect = async (address: Address) => {
    setSelectedAddress(address);
    
    // Validar endereço
    const fullAddress = `${address.street}, ${address.number}, ${address.neighborhood}`;
    const validation = isAddressComplete(fullAddress);
    setAddressValid(validation.complete);
    
    if (!validation.complete) {
      toast({
        title: "Endereço incompleto",
        description: validation.reason || "Complete seu endereço",
        variant: "destructive",
      });
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

  const canCheckout = items.length > 0 && shippingFee > 0 && addressValid && selectedAddress !== null;

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
          <SheetHeader className="border-b pb-4 bg-gradient-to-r from-primary/5 to-transparent rounded-t-lg">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl font-bold">🛒 Seu Carrinho</SheetTitle>
              {itemCount > 0 && (
                <span className="text-sm font-medium text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
                  {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                </span>
              )}
            </div>
          </SheetHeader>
          
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
              <div className="relative mb-6">
                <ShoppingCart className="w-24 h-24 opacity-20" />
                <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl">
                  😊
                </span>
              </div>
              <p className="text-xl font-semibold mb-2 text-card-foreground">Seu carrinho está vazio</p>
              <p className="text-sm text-muted-foreground">Adicione produtos para começar</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <ScrollArea className="flex-1 -mx-6 px-6 my-6">
                <div className="space-y-4">
                  {items.map((item) => (
                    <Card 
                      key={item.id} 
                      className="p-4 border-l-4 border-l-primary hover:shadow-md transition-all hover:scale-[1.02] bg-gradient-to-r from-card to-accent/10"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-card-foreground">{item.name}</h4>
                          <p className="text-lg font-bold text-primary mt-1">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemove(item.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                          className="h-8 w-8"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-semibold min-w-[2rem] text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="h-8 w-8"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground ml-2">
                          R$ {item.price.toFixed(2)} cada
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="border-t pt-4 space-y-4 -mx-6 px-6">
                {/* SEÇÃO DE ENDEREÇO */}
                <div>
                  <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereço de Entrega
                  </Label>
                  
                  {selectedAddress ? (
                    <Card className={`p-3 mt-2 ${!addressValid ? 'border-destructive' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">
                            {selectedAddress.street}, {selectedAddress.number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedAddress.neighborhood}, {selectedAddress.city}
                          </p>
                        </div>
                        <div className="text-right">
                          {loadingShipping ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : shippingFee > 0 ? (
                            <span className="text-sm font-bold text-primary">
                              R$ {shippingFee.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Calculando...</span>
                          )}
                        </div>
                      </div>
                      {!addressValid && (
                        <p className="text-xs text-destructive mt-2">
                          ⚠️ Endereço incompleto. Corrija para continuar.
                        </p>
                      )}
                    </Card>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2">Nenhum endereço selecionado</p>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setShowAddressModal(true)}
                  >
                    {selectedAddress ? "Alterar endereço" : "Selecionar endereço"}
                  </Button>
                </div>

                {/* CUPOM */}
                {shippingFee > 0 && (
                  <div className="border-t pt-3 space-y-2">
                    <Label htmlFor="coupon" className="text-sm font-medium">
                      Cupom de desconto
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="coupon"
                        placeholder="Digite o código"
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
                        variant="outline"
                        className="shrink-0"
                      >
                        {couponLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : appliedCoupon ? (
                          '✓'
                        ) : (
                          'Aplicar'
                        )}
                      </Button>
                    </div>
                    
                    {couponError && (
                      <p className="text-xs text-destructive">{couponError}</p>
                    )}
                    
                    {appliedCoupon && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-primary font-medium">
                          ✓ {appliedCoupon.description}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAppliedCoupon(null);
                            setCouponDiscount(0);
                            setCouponCode('');
                          }}
                          className="h-6 text-xs"
                        >
                          Remover
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t-2 border-primary/20 pt-6 pb-6 space-y-2 bg-gradient-to-t from-accent/5 to-transparent -mx-6 px-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold">
                    R$ {items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                  </span>
                </div>
                {shippingFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frete:</span>
                    <div className="text-right">
                      {couponDiscount > 0 && (
                        <span className="line-through text-muted-foreground text-sm mr-2">
                          R$ {shippingFee.toFixed(2)}
                        </span>
                      )}
                      <span className={couponDiscount > 0 ? "font-semibold text-primary" : "font-semibold text-primary"}>
                        R$ {finalShippingFee.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-primary">Desconto do cupom:</span>
                    <span className="font-semibold text-primary">
                      - R$ {couponDiscount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-primary">R$ {total.toFixed(2)}</span>
                </div>
                
                <Button
                  onClick={() => {
                    if (selectedAddress) {
                      const fullAddress = `${selectedAddress.street}, ${selectedAddress.number}, ${selectedAddress.neighborhood}, ${selectedAddress.city} - ${selectedAddress.state}`;
                      onCheckout(finalShippingFee, fullAddress, appliedCoupon?.coupon_id || null, couponDiscount);
                    }
                  }}
                  disabled={!canCheckout}
                  size="lg" 
                  className="w-full h-14 text-lg mt-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {!selectedAddress ? "Selecione um endereço" : 
                   !addressValid ? "Complete seu endereço" :
                   shippingFee === 0 ? "Calculando frete..." :
                   "Finalizar Pedido"}
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
