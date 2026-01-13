import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, Banknote, Smartphone, Loader2, User, AlertCircle, ChevronDown, MessageSquare, ShoppingBag, Eye, ShieldCheck, MapPin, Store } from "lucide-react";
import { submitOrder, type OrderItem } from "@/services/orderService";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useActiveOrder } from "@/contexts/ActiveOrderContext";
import { isAddressValidForCheckout } from "@/utils/addressValidator";
import { Alert, AlertDescription } from "@/components/ui/alert";

type CartItem = OrderItem;

// Constantes para o lock de processamento
const LOCK_DURATION_MS = 60000; // 1 minuto
const LOCK_KEY_PREFIX = 'checkout_processing_';

interface ProcessingLock {
  timestamp: number;
  phone: string;
}

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { setActiveOrder } = useActiveOrder();
  
  // Filtrar itens com quantidade <= 0 ao carregar
  const rawCart = (location.state?.cart as CartItem[]) || (() => {
    try {
      const saved = localStorage.getItem('gamatauri-cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })();
  const cart = rawCart.filter(item => item.quantity > 0 && item.price > 0);

  const shippingFee = location.state?.shippingFee || 0;
  const preFilledAddress = location.state?.deliveryAddress || '';
  const couponId = location.state?.couponId || null;
  const discountAmount = location.state?.discountAmount || 0;

  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [addressError, setAddressError] = useState<string>("");
  const [canSubmit, setCanSubmit] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [isProcessingLocked, setIsProcessingLocked] = useState(false);
  const notesRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_address: preFilledAddress || "",
    payment_method: "pix",
    payment_timing: "entrega",
    notes: "",
    change_for: "",
    delivery_type: "delivery" as 'delivery' | 'pickup', // NEW
  });

  // Verificar lock de processamento ao carregar
  useEffect(() => {
    const checkExistingLock = () => {
      const phone = formData.customer_phone.replace(/\D/g, '');
      if (!phone) return;
      
      const lockKey = `${LOCK_KEY_PREFIX}${phone}`;
      const existingLock = localStorage.getItem(lockKey);
      
      if (existingLock) {
        try {
          const lockData: ProcessingLock = JSON.parse(existingLock);
          const elapsed = Date.now() - lockData.timestamp;
          
          if (elapsed < LOCK_DURATION_MS) {
            setIsProcessingLocked(true);
            console.log('🔒 Lock de processamento ativo:', {
              elapsed_seconds: Math.floor(elapsed / 1000),
              remaining_seconds: Math.floor((LOCK_DURATION_MS - elapsed) / 1000)
            });
          } else {
            // Lock expirou, remover
            localStorage.removeItem(lockKey);
            setIsProcessingLocked(false);
          }
        } catch {
          localStorage.removeItem(lockKey);
        }
      }
    };
    
    checkExistingLock();
  }, [formData.customer_phone]);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data) {
          setUserProfile(data);
          setFormData(prev => ({
            ...prev,
            customer_name: data.name || '',
            customer_phone: data.phone || '',
            customer_address: preFilledAddress || data.address || '',
          }));
          
          const validation = isAddressValidForCheckout(preFilledAddress || data.address, shippingFee);
          setCanSubmit(validation.valid);
          if (!validation.valid) {
            setAddressError(validation.reason || "Endereço incompleto");
          } else {
            setAddressError("");
          }
        }
      };
      fetchProfile();
    }
  }, [user, preFilledAddress]);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  // Se for retirada, não cobra frete
  const effectiveShippingFee = formData.delivery_type === 'pickup' ? 0 : shippingFee;
  const total = subtotal + effectiveShippingFee;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const setProcessingLock = (phone: string) => {
    const lockKey = `${LOCK_KEY_PREFIX}${phone.replace(/\D/g, '')}`;
    const lockData: ProcessingLock = {
      timestamp: Date.now(),
      phone: phone.replace(/\D/g, '')
    };
    localStorage.setItem(lockKey, JSON.stringify(lockData));
    setIsProcessingLocked(true);
  };

  const clearProcessingLock = (phone: string) => {
    const lockKey = `${LOCK_KEY_PREFIX}${phone.replace(/\D/g, '')}`;
    localStorage.removeItem(lockKey);
    setIsProcessingLocked(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar lock ativo
    if (isProcessingLocked) {
      toast({
        title: "Pedido em processamento",
        description: "Seu pedido anterior ainda está sendo processado. Aguarde um momento.",
        variant: "destructive",
      });
      return;
    }
    
    // VALIDAÇÃO: Verificar itens com quantidade ou preço zerado
    const invalidItems = cart.filter(item => item.quantity <= 0 || item.price <= 0);
    if (invalidItems.length > 0 || cart.length === 0) {
      toast({
        title: "Pedido com valor incorreto",
        description: "Alguns itens estão com quantidade ou valor zerado. Volte ao carrinho.",
        variant: "destructive",
      });
      return;
    }
    
    if ((!formData.customer_name && !userProfile) || !formData.customer_phone || !formData.payment_method) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha seu nome, telefone e forma de pagamento",
        variant: "destructive",
      });
      return;
    }

    // Validação de frete - apenas para entrega
    if (formData.delivery_type === 'delivery' && shippingFee === 0) {
      toast({
        title: "Frete não calculado",
        description: "O valor do frete ainda não foi calculado. Volte ao carrinho e aguarde o cálculo.",
        variant: "destructive",
      });
      return;
    }

    // Validação de endereço - apenas para entrega
    if (formData.delivery_type === 'delivery') {
      if (!formData.customer_address || formData.customer_address.trim().length < 10) {
        setAddressError("Endereço muito curto");
        toast({
          title: "Endereço inválido",
          description: "Por favor, informe um endereço de entrega válido",
          variant: "destructive",
        });
        return;
      }
    }
    
    setAddressError("");
    
    // Ativar lock ANTES de iniciar loading
    setProcessingLock(formData.customer_phone);
    setLoading(true);
    
    try {
      const orderResult = await submitOrder({
        customer_name: formData.customer_name || userProfile?.name || formData.customer_email || formData.customer_phone,
        customer_phone: formData.customer_phone,
        customer_address: formData.delivery_type === 'pickup' ? null : (formData.customer_address?.trim() || null),
        items: cart,
        payment_method: formData.payment_method,
        payment_timing: formData.payment_timing,
        total: total,
        delivery_fee: effectiveShippingFee,
        notes: formData.notes || undefined,
        change_for: formData.payment_method === 'dinheiro' ? formData.change_for : undefined,
        user_id: user?.id,
        delivery_type: formData.delivery_type,
      });

      if (couponId && user) {
        await supabase.from('orders').update({
          coupon_id: couponId,
          discount_amount: discountAmount
        }).eq('id', orderResult.order_id);

        await supabase.from('coupon_usage').insert({
          coupon_id: couponId,
          user_id: user.id,
          order_id: orderResult.order_id,
          discount_applied: discountAmount
        });
      }

      setActiveOrder({
        orderId: orderResult.order_id,
        orderNumber: orderResult.order_number,
        status: "preparing",
        createdAt: new Date().toISOString(),
      });

      localStorage.removeItem('gamatauri-cart');
      
      // Limpar lock após sucesso
      clearProcessingLock(formData.customer_phone);

      toast({
        title: "Pedido realizado com sucesso!",
        description: `Pedido ${orderResult.order_number} criado`,
      });
      
      navigate('/success', { 
        state: { 
          orderNumber: orderResult.order_number,
          orderId: orderResult.order_id,
        } 
      });
    } catch (error: any) {
      console.error('Error submitting order:', error);
      
      // Limpar lock em caso de erro
      clearProcessingLock(formData.customer_phone);
      
      toast({
        title: "Erro ao processar pedido",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-6 text-center max-w-sm w-full">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Carrinho vazio</h2>
          <p className="text-muted-foreground text-sm mb-4">Adicione produtos para continuar</p>
          <Button onClick={() => navigate('/')} className="w-full">Voltar para produtos</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-8">
      {/* Overlay de processamento */}
      {loading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center">
          <Card className="p-8 text-center max-w-sm w-full mx-4 shadow-2xl">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <Loader2 className="w-16 h-16 animate-spin text-primary" />
              <ShieldCheck className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
            </div>
            <h2 className="text-lg font-bold mb-2">Processando seu pedido</h2>
            <p className="text-muted-foreground text-sm">
              Por favor, aguarde e não feche esta tela...
            </p>
          </Card>
        </div>
      )}
      
      {/* Header compacto */}
      <header className="bg-card/95 backdrop-blur-md shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="shrink-0"
              disabled={loading}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg md:text-2xl font-bold truncate">Finalizar Pedido</h1>
            <span className="ml-auto text-sm text-muted-foreground hidden md:block">
              {itemCount} {itemCount === 1 ? 'item' : 'itens'}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="grid lg:grid-cols-3 gap-4 md:gap-8">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {/* Card Tipo de Entrega - NOVO */}
              <Card className="p-4 md:p-6 shadow-md">
                <h2 className="text-base md:text-xl font-bold mb-3 md:mb-4 flex items-center">
                  <MapPin className="mr-2 h-4 w-4 md:h-5 md:w-5 text-primary" />
                  Como você quer receber?
                </h2>
                <RadioGroup
                  value={formData.delivery_type}
                  onValueChange={(value: 'delivery' | 'pickup') => setFormData({ ...formData, delivery_type: value })}
                  className="grid grid-cols-2 gap-3"
                  disabled={loading}
                >
                  <Label
                    htmlFor="delivery"
                    className={`
                      flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer border-2 transition-all
                      ${formData.delivery_type === 'delivery' 
                        ? 'bg-primary/10 border-primary shadow-md' 
                        : 'bg-accent/30 border-transparent hover:border-primary/40'}
                      ${loading ? 'opacity-50 pointer-events-none' : ''}
                    `}
                  >
                    <RadioGroupItem value="delivery" id="delivery" className="sr-only" />
                    <MapPin className={`w-6 h-6 ${formData.delivery_type === 'delivery' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">Entrega</span>
                    {shippingFee > 0 && (
                      <span className={`text-xs ${formData.delivery_type === 'delivery' ? 'text-primary' : 'text-muted-foreground'}`}>
                        + R$ {shippingFee.toFixed(2)}
                      </span>
                    )}
                  </Label>

                  <Label
                    htmlFor="pickup"
                    className={`
                      flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer border-2 transition-all
                      ${formData.delivery_type === 'pickup' 
                        ? 'bg-green-500/10 border-green-500 shadow-md' 
                        : 'bg-accent/30 border-transparent hover:border-green-500/40'}
                      ${loading ? 'opacity-50 pointer-events-none' : ''}
                    `}
                  >
                    <RadioGroupItem value="pickup" id="pickup" className="sr-only" />
                    <Store className={`w-6 h-6 ${formData.delivery_type === 'pickup' ? 'text-green-600' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">Retirada</span>
                    <span className={`text-xs ${formData.delivery_type === 'pickup' ? 'text-green-600' : 'text-muted-foreground'}`}>
                      Grátis
                    </span>
                  </Label>
                </RadioGroup>
                
                {formData.delivery_type === 'pickup' && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                      Retire na loja: R. Aiuruoca, 192 - Loja 5 - Fernão Dias
                    </p>
                    <a 
                      href="https://www.google.com/maps/search/?api=1&query=R.+Aiuruoca,+192+-+Loja+5+-+Fernão+Dias"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 dark:text-green-500 mt-1 hover:underline inline-flex items-center gap-1"
                    >
                      📍 Ver no Google Maps
                    </a>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                      Avisaremos quando seu pedido estiver pronto!
                    </p>
                  </div>
                )}
              </Card>

              {/* Card Contato - Compacto */}
              <Card className="p-4 md:p-6 shadow-md">
                <h2 className="text-base md:text-xl font-bold mb-3 md:mb-4 flex items-center">
                  <User className="mr-2 h-4 w-4 md:h-5 md:w-5 text-primary" />
                  Dados de Contato
                </h2>
                <div className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Nome {userProfile ? '(opcional)' : '*'}
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.customer_name}
                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                        placeholder="Seu nome"
                        required={!userProfile}
                        className="h-10 md:h-11 text-sm"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm font-medium">Telefone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.customer_phone}
                        onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                        placeholder="(00) 00000-0000"
                        required
                        className="h-10 md:h-11 text-sm"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  {/* Endereço - Apenas para entrega */}
                  {formData.delivery_type === 'delivery' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="address" className="text-sm font-medium">
                        Endereço de Entrega *
                      </Label>
                      <Textarea
                        id="address"
                        value={formData.customer_address}
                        onChange={(e) => {
                          setFormData({ ...formData, customer_address: e.target.value });
                          setAddressError("");
                        }}
                        placeholder="Rua, número, bairro, cidade"
                        rows={2}
                        className={`text-sm resize-none ${addressError ? 'border-destructive' : ''}`}
                        disabled={loading}
                      />
                      {addressError && (
                        <Alert variant="destructive" className="py-2">
                          <AlertCircle className="h-3 w-3" />
                          <AlertDescription className="text-xs">{addressError}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              {/* Card Pagamento - Grid 2x2 no mobile */}
              <Card className="p-4 md:p-6 shadow-md">
                <h2 className="text-base md:text-xl font-bold mb-3 md:mb-4">Forma de Pagamento</h2>
                <RadioGroup
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  className="grid grid-cols-3 md:grid-cols-1 gap-2 md:space-y-2"
                  disabled={loading}
                >
                  {/* PIX */}
                  <Label
                    htmlFor="pix"
                    className={`
                      flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-3 
                      p-3 md:p-4 rounded-xl cursor-pointer border-2 transition-all
                      ${formData.payment_method === 'pix' 
                        ? 'bg-[hsl(var(--pix))]/10 border-[hsl(var(--pix))] shadow-md' 
                        : 'bg-accent/30 border-transparent hover:border-[hsl(var(--pix))]/40'}
                      ${loading ? 'opacity-50 pointer-events-none' : ''}
                    `}
                  >
                    <RadioGroupItem value="pix" id="pix" className="sr-only md:not-sr-only" />
                    <Smartphone className={`w-6 h-6 ${formData.payment_method === 'pix' ? 'text-[hsl(var(--pix))]' : 'text-muted-foreground'}`} />
                    <span className="text-xs md:text-base font-medium text-center md:text-left">PIX</span>
                  </Label>

                  {/* Cartão */}
                  <Label
                    htmlFor="cartao"
                    className={`
                      flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-3 
                      p-3 md:p-4 rounded-xl cursor-pointer border-2 transition-all
                      ${formData.payment_method === 'cartao' 
                        ? 'bg-[hsl(var(--card-payment))]/10 border-[hsl(var(--card-payment))] shadow-md' 
                        : 'bg-accent/30 border-transparent hover:border-[hsl(var(--card-payment))]/40'}
                      ${loading ? 'opacity-50 pointer-events-none' : ''}
                    `}
                  >
                    <RadioGroupItem value="cartao" id="cartao" className="sr-only md:not-sr-only" />
                    <CreditCard className={`w-6 h-6 ${formData.payment_method === 'cartao' ? 'text-[hsl(var(--card-payment))]' : 'text-muted-foreground'}`} />
                    <span className="text-xs md:text-base font-medium text-center md:text-left">Cartão</span>
                  </Label>

                  {/* Dinheiro */}
                  <Label
                    htmlFor="dinheiro"
                    className={`
                      flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-3 
                      p-3 md:p-4 rounded-xl cursor-pointer border-2 transition-all
                      ${formData.payment_method === 'dinheiro' 
                        ? 'bg-[hsl(var(--cash))]/10 border-[hsl(var(--cash))] shadow-md' 
                        : 'bg-accent/30 border-transparent hover:border-[hsl(var(--cash))]/40'}
                      ${loading ? 'opacity-50 pointer-events-none' : ''}
                    `}
                  >
                    <RadioGroupItem value="dinheiro" id="dinheiro" className="sr-only md:not-sr-only" />
                    <Banknote className={`w-6 h-6 ${formData.payment_method === 'dinheiro' ? 'text-[hsl(var(--cash))]' : 'text-muted-foreground'}`} />
                    <span className="text-xs md:text-base font-medium text-center md:text-left">Dinheiro</span>
                  </Label>
                </RadioGroup>

                {/* Troco - apenas se dinheiro */}
                {formData.payment_method === 'dinheiro' && (
                  <div className="mt-4 p-3 border rounded-xl bg-[hsl(var(--cash))]/5">
                    <Label htmlFor="change_for" className="text-sm font-medium">Troco para:</Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                      <Input
                        id="change_for"
                        type="text"
                        placeholder="0,00"
                        value={formData.change_for}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          value = (Number(value) / 100).toFixed(2).replace('.', ',');
                          setFormData({ ...formData, change_for: value });
                        }}
                        className="h-10 pl-10 text-sm"
                        disabled={loading}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Deixe vazio se não precisar</p>
                  </div>
                )}
              </Card>

              {/* Observações - Colapsável */}
              <Collapsible 
                open={notesOpen} 
                onOpenChange={(open) => {
                  if (!loading) {
                    setNotesOpen(open);
                    if (open) {
                      setTimeout(() => {
                        notesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }
                  }
                }}
              >
                <Card className="p-0 shadow-md overflow-hidden">
                  <CollapsibleTrigger className={`w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      {formData.notes ? 'Observação adicionada' : 'Adicionar observação'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${notesOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div ref={notesRef} className="px-4 pb-4">
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Ex: Deixar na portaria, apartamento 101..."
                        rows={2}
                        className="text-sm resize-none"
                        autoFocus
                        disabled={loading}
                      />
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Botão Ver itens - Mobile apenas */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowItemsModal(true)}
                className="w-full lg:hidden"
                disabled={loading}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver {itemCount} {itemCount === 1 ? 'item' : 'itens'}
              </Button>
            </form>
          </div>

          {/* Resumo - Desktop apenas */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="p-6 sticky top-20 shadow-lg border-primary/20">
              <h2 className="text-lg font-bold mb-4">Resumo do Pedido</h2>
              <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary font-bold text-xs shrink-0">
                        {item.quantity}
                      </span>
                      <span className="truncate">{item.name}</span>
                    </div>
                    <span className="font-medium text-primary ml-2">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {formData.delivery_type === 'pickup' ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Retirada</span>
                    <span className="text-green-600 font-medium">Grátis</span>
                  </div>
                ) : effectiveShippingFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Frete</span>
                    <span className="text-primary font-medium">R$ {effectiveShippingFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">R$ {total.toFixed(2)}</span>
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={loading || !canSubmit || isProcessingLocked}
                size="lg"
                className="w-full mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : isProcessingLocked ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Aguarde...
                  </>
                ) : !canSubmit ? (
                  "Complete seu endereço"
                ) : (
                  "Confirmar Pedido"
                )}
              </Button>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer fixo - Mobile apenas */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-2xl p-4 lg:hidden z-50 safe-area-bottom">
        <div className="flex justify-between items-center mb-2">
          <div>
            <span className="text-xs text-muted-foreground">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
            {formData.delivery_type === 'pickup' ? (
              <span className="text-xs text-green-600 ml-2">• Retirada grátis</span>
            ) : effectiveShippingFee > 0 && (
              <span className="text-xs text-muted-foreground ml-2">+ Frete R$ {effectiveShippingFee.toFixed(2)}</span>
            )}
          </div>
          <span className="text-xl font-bold text-primary">R$ {total.toFixed(2)}</span>
        </div>
        <Button 
          onClick={handleSubmit}
          disabled={loading || !canSubmit || isProcessingLocked}
          size="lg"
          className="w-full h-12"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : isProcessingLocked ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Pedido em processamento...
            </>
          ) : !canSubmit ? (
            <>
              <AlertCircle className="w-4 h-4 mr-2" />
              Complete o endereço
            </>
          ) : (
            "Confirmar Pedido"
          )}
        </Button>
      </div>

      {/* Modal Ver Itens - Mobile */}
      <Sheet open={showItemsModal} onOpenChange={setShowItemsModal}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="text-lg font-bold">
              Itens do Pedido ({itemCount})
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100%-120px)] pr-4 mt-4">
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-3 border-b">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 text-primary font-bold text-sm shrink-0">
                      {item.quantity}
                    </span>
                    <span className="truncate text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-primary ml-2">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-card">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-bold text-lg">R$ {subtotal.toFixed(2)}</span>
            </div>
            <Button onClick={() => setShowItemsModal(false)} className="w-full">
              Fechar
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Checkout;