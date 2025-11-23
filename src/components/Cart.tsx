import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, ShoppingCart, Trash2, Loader2, Save, MapPin, Info } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

export const Cart = ({ items, onUpdateQuantity, onRemove, onCheckout }: CartProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [shippingError, setShippingError] = useState('');
  const [addressFromProfile, setAddressFromProfile] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  
  // Carregar endereço do perfil automaticamente
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('address')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data?.address) {
          setUserProfile(data);
          setDeliveryAddress(data.address);
          setAddressFromProfile(true);
        }
      };
      fetchProfile();
    }
  }, [user]);
  
  const saveAddressToProfile = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('profiles')
        .update({ address: deliveryAddress.trim() })
        .eq('user_id', user.id);
      
      setAddressFromProfile(true);
      toast({
        title: "Endereço salvo!",
        description: "Será usado automaticamente nos próximos pedidos.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar endereço",
      });
    }
  };
  
  const calculateShipping = async () => {
    if (!deliveryAddress || deliveryAddress.trim().length < 10) {
      setShippingError('Digite um endereço válido');
      return;
    }

    setShippingLoading(true);
    setShippingError('');

    try {
      // Normalizar endereço: adicionar ", Belo Horizonte - MG" se não estiver presente
      let normalizedAddress = deliveryAddress.trim();
      const hasCityMention = /Belo Horizonte|BH|Contagem|Betim/i.test(normalizedAddress);
      
      if (!hasCityMention) {
        normalizedAddress += ', Belo Horizonte - MG';
        console.log('📍 Endereço normalizado:', normalizedAddress);
      }

      const { data, error } = await supabase.functions.invoke('calculate-shipping', {
        body: { destination: normalizedAddress }
      });

      if (error) throw error;

      setShippingFee(data.shipping_fee);
      toast({
        title: "Frete calculado!",
        description: `${data.distance_km} km - R$ ${data.shipping_fee.toFixed(2)}`,
      });
    } catch (error: any) {
      console.error('Erro ao calcular frete:', error);
      setShippingError('Não foi possível calcular o frete');
      toast({
        variant: "destructive",
        title: "Erro ao calcular frete",
        description: error.message || 'Tente novamente',
      });
    } finally {
      setShippingLoading(false);
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

  return (
    <Sheet>
      <SheetTrigger asChild>
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
            
            <div className="border-t pt-4 space-y-2 -mx-6 px-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">Endereço de Entrega</span>
                {addressFromProfile && (
                  <span className="text-xs text-primary">✓ Do perfil</span>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[250px]">
                      <p className="text-xs">Digite rua, número e bairro. Se não mencionar a cidade, assumiremos BH-MG.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="delivery-address"
                    placeholder="📍 Rua, número e bairro (BH)"
                    value={deliveryAddress}
                    onChange={(e) => {
                      setDeliveryAddress(e.target.value);
                      setAddressFromProfile(false);
                      setShippingError('');
                    }}
                    className={`pr-24 text-sm ${shippingError ? 'border-destructive' : ''}`}
                  />
                  <Button
                    onClick={calculateShipping}
                    disabled={shippingLoading || !deliveryAddress}
                    size="sm"
                    variant="ghost"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                  >
                    {shippingLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <MapPin className="h-3 w-3" />
                    )}
                    <span className="ml-1 text-xs">Calcular</span>
                  </Button>
                </div>
                
                {user && !addressFromProfile && deliveryAddress && (
                  <Button
                    onClick={saveAddressToProfile}
                    variant="outline"
                    size="icon"
                    title="Salvar endereço no perfil"
                    className="shrink-0 h-9 w-9"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {shippingError && (
                <p className="text-xs text-destructive">{shippingError}</p>
              )}
              
              {shippingFee > 0 && (
                <p className="text-xs text-primary font-medium">
                  ✓ Frete: R$ {shippingFee.toFixed(2)}
                </p>
              )}

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
              
              {items.length > 0 && shippingFee === 0 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-500 shrink-0" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">
                    Calcule o frete para continuar
                  </span>
                </div>
              )}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <Button 
                        onClick={() => onCheckout(finalShippingFee, deliveryAddress, appliedCoupon?.coupon_id || null, couponDiscount)}
                        disabled={items.length === 0 || shippingFee === 0}
                        size="lg" 
                        className="w-full h-14 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        <span className="mr-2">✓</span>
                        Finalizar Pedido
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {items.length > 0 && shippingFee === 0 && (
                    <TooltipContent>
                      <p className="font-medium">⚠️ Calcule o frete antes de finalizar</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
