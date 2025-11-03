import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, Banknote, Smartphone, Loader2, User, Copy } from "lucide-react";
import { submitOrder, type OrderItem } from "@/services/orderService";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useActiveOrder } from "@/contexts/ActiveOrderContext";

type CartItem = OrderItem;

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { setActiveOrder } = useActiveOrder();
  const cart = (location.state?.cart as CartItem[]) || (() => {
    try {
      const saved = localStorage.getItem('gamatauri-cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })();

  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [pixQRCode, setPixQRCode] = useState<string>("");
  const [pixPayload, setPixPayload] = useState<string>("");
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
    payment_method: "pix",
    payment_timing: "entrega",
    notes: "",
    change_for: "",
    card_holder: "",
    card_number: "",
    card_expiry: "",
    card_cvv: "",
  });

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
            customer_address: data.address || '',
          }));
        }
      };
      fetchProfile();
    }
  }, [user]);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Generate PIX QR Code when payment method is PIX
  useEffect(() => {
    if (formData.payment_method === 'pix' && total > 0) {
      const generatePixQRCode = async () => {
        try {
          const QRCode = (await import('qrcode')).default;
          
          // Generate PIX payload (EMV format)
          const pixPayloadData = generatePixPayload(total);
          
          // Generate QR Code as base64
          const qrCodeBase64 = await QRCode.toDataURL(pixPayloadData, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          setPixPayload(pixPayloadData);
          setPixQRCode(qrCodeBase64);
        } catch (error) {
          console.error('Error generating PIX QR Code:', error);
        }
      };
      
      generatePixQRCode();
    }
  }, [formData.payment_method, total]);

  // Generate PIX EMV payload
  const generatePixPayload = (value: number) => {
    const pixKey = '54339140000118';
    const merchantName = 'Gamatauri';
    const merchantCity = 'SAO PAULO';
    const txid = `PED${Date.now()}`;
    
    // EMV format for PIX
    const payload = [
      '00020126',
      '360014BR.GOV.BCB.PIX',
      `0114${pixKey}`,
      `52040000`,
      `5303986`,
      `5402${value.toFixed(2)}`,
      `5802BR`,
      `59${String(merchantName.length).padStart(2, '0')}${merchantName}`,
      `60${String(merchantCity.length).padStart(2, '0')}${merchantCity}`,
      `62${String(txid.length + 8).padStart(2, '0')}05${String(txid.length).padStart(2, '0')}${txid}`,
      '6304'
    ].join('');
    
    // Calculate CRC16
    const crc = calculateCRC16(payload);
    return payload + crc;
  };

  // CRC16 calculation for PIX
  const calculateCRC16 = (payload: string) => {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
    }
    crc = crc & 0xFFFF;
    return crc.toString(16).toUpperCase().padStart(4, '0');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!formData.customer_name && !userProfile) || !formData.customer_phone || !formData.payment_method) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha seu nome, telefone e forma de pagamento",
        variant: "destructive",
      });
      return;
    }

    // Validate credit card fields
    if (formData.payment_method === 'cartao') {
      if (!formData.card_holder || !formData.card_number || !formData.card_expiry || !formData.card_cvv) {
        toast({
          title: "Dados do cartão incompletos",
          description: "Preencha todos os campos do cartão",
          variant: "destructive",
        });
        return;
      }
      
      const cardNumber = formData.card_number.replace(/\s/g, '');
      if (cardNumber.length < 13 || cardNumber.length > 19) {
        toast({
          title: "Cartão inválido",
          description: "Número do cartão deve ter entre 13 e 19 dígitos",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    
    try {
      const orderResult = await submitOrder({
        customer_name: formData.customer_name || userProfile?.name || formData.customer_email || formData.customer_phone,
        customer_phone: formData.customer_phone,
        customer_address: formData.customer_address?.trim() || null,
        items: cart,
        payment_method: formData.payment_method,
        payment_timing: formData.payment_timing,
        total: total,
        delivery_fee: 0,
        notes: formData.notes || undefined,
        change_for: formData.payment_method === 'dinheiro' ? formData.change_for : undefined,
        card_holder: formData.payment_method === 'cartao' ? formData.card_holder : undefined,
        card_number: formData.payment_method === 'cartao' ? formData.card_number : undefined,
        card_expiry: formData.payment_method === 'cartao' ? formData.card_expiry : undefined,
        card_cvv: formData.payment_method === 'cartao' ? formData.card_cvv : undefined,
      });

      // Set active order in context
      setActiveOrder({
        orderId: orderResult.order_id,
        orderNumber: orderResult.order_number,
        status: "separacao",
        createdAt: new Date().toISOString(),
      });

      // Clear cart from localStorage after successful order
      localStorage.removeItem('gamatauri-cart');

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Carrinho vazio</h2>
          <p className="text-muted-foreground mb-6">Adicione produtos para continuar</p>
          <Button onClick={() => navigate('/')}>Voltar para produtos</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-accent/5 to-accent/10 animate-fade-in">
      <header className="bg-card/95 backdrop-blur-md shadow-lg border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 hover:bg-accent/60 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Finalizar Pedido
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-10 animate-fade-in">
              <Card className="p-8 shadow-xl backdrop-blur-sm bg-card/80 border-2 border-border hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                <h2 className="text-2xl font-bold mb-6 flex items-center text-foreground">
                  <User className="mr-3 h-6 w-6 text-primary" />
                  Dados de Contato
                </h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base font-semibold text-foreground">
                      Nome {userProfile ? '(opcional)' : '*'}
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      placeholder="Seu nome completo"
                      required={!userProfile}
                      className="h-12 text-base border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-background"
                    />
                    {userProfile && formData.customer_name && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="text-primary">✓</span> Usando nome do perfil
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-base font-semibold text-foreground">Telefone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      required
                      className="h-12 text-base border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-base font-semibold text-foreground">Endereço de Entrega</Label>
                    <Textarea
                      id="address"
                      value={formData.customer_address}
                      onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                      placeholder="Rua, número, bairro, cidade"
                      rows={3}
                      className="text-base border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 resize-none bg-background"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-8 shadow-xl backdrop-blur-sm bg-card/80 border-2 border-border hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                <h2 className="text-2xl font-bold mb-6 text-foreground">Forma de Pagamento</h2>
                <RadioGroup
                  value={formData.payment_method}
                  onValueChange={(value) => {
                    setFormData({ 
                      ...formData, 
                      payment_method: value,
                      payment_timing: value === 'dinheiro' ? 'entrega' : formData.payment_timing
                    });
                  }}
                  className="space-y-3"
                >
                  <div className={`
                    relative flex items-center space-x-4 p-5 rounded-2xl cursor-pointer border-2 transition-all duration-300
                    ${formData.payment_method === 'pix' 
                      ? 'bg-[hsl(var(--pix))]/10 border-[hsl(var(--pix))] shadow-lg scale-[1.02]' 
                      : 'bg-accent/30 border-transparent hover:border-[hsl(var(--pix))]/40 hover:bg-[hsl(var(--pix))]/5'}
                  `}>
                    <RadioGroupItem value="pix" id="pix" className="scale-125" />
                    <Label htmlFor="pix" className="flex items-center cursor-pointer flex-1 font-semibold text-base">
                      <Smartphone className={`w-7 h-7 mr-4 transition-colors ${formData.payment_method === 'pix' ? 'text-[hsl(var(--pix))]' : 'text-muted-foreground'}`} />
                      <div>
                        <div className="font-bold">Pix</div>
                        <div className="text-xs text-muted-foreground">Instantâneo e gratuito</div>
                      </div>
                    </Label>
                  </div>
                  <div className={`
                    relative flex items-center space-x-4 p-5 rounded-2xl cursor-pointer border-2 transition-all duration-300
                    ${formData.payment_method === 'cartao' 
                      ? 'bg-[hsl(var(--card-payment))]/10 border-[hsl(var(--card-payment))] shadow-lg scale-[1.02]' 
                      : 'bg-accent/30 border-transparent hover:border-[hsl(var(--card-payment))]/40 hover:bg-[hsl(var(--card-payment))]/5'}
                  `}>
                    <RadioGroupItem value="cartao" id="cartao" className="scale-125" />
                    <Label htmlFor="cartao" className="flex items-center cursor-pointer flex-1 font-semibold text-base">
                      <CreditCard className={`w-7 h-7 mr-4 transition-colors ${formData.payment_method === 'cartao' ? 'text-[hsl(var(--card-payment))]' : 'text-muted-foreground'}`} />
                      <div>
                        <div className="font-bold">Cartão de Crédito</div>
                        <div className="text-xs text-muted-foreground">Débito ou crédito</div>
                      </div>
                    </Label>
                  </div>
                  <div className={`
                    relative flex items-center space-x-4 p-5 rounded-2xl cursor-pointer border-2 transition-all duration-300
                    ${formData.payment_method === 'dinheiro' 
                      ? 'bg-[hsl(var(--cash))]/10 border-[hsl(var(--cash))] shadow-lg scale-[1.02]' 
                      : 'bg-accent/30 border-transparent hover:border-[hsl(var(--cash))]/40 hover:bg-[hsl(var(--cash))]/5'}
                  `}>
                    <RadioGroupItem value="dinheiro" id="dinheiro" className="scale-125" />
                    <Label htmlFor="dinheiro" className="flex items-center cursor-pointer flex-1 font-semibold text-base">
                      <Banknote className={`w-7 h-7 mr-4 transition-colors ${formData.payment_method === 'dinheiro' ? 'text-[hsl(var(--cash))]' : 'text-muted-foreground'}`} />
                      <div>
                        <div className="font-bold">Dinheiro</div>
                        <div className="text-xs text-muted-foreground">Pagamento em espécie</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {/* PIX Payment Details */}
                {formData.payment_method === 'pix' && pixQRCode && (
                  <div className="mt-8 p-6 border-2 border-[hsl(var(--pix))]/30 rounded-2xl bg-gradient-to-br from-[hsl(var(--pix))]/5 to-[hsl(var(--pix))]/10 animate-fade-in backdrop-blur-sm">
                    <h3 className="text-lg font-bold mb-4 text-[hsl(var(--pix))]">Pagar com PIX</h3>
                    
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative group">
                        <div className="absolute inset-0 bg-[hsl(var(--pix))]/20 rounded-2xl blur-xl group-hover:bg-[hsl(var(--pix))]/30 transition-all duration-500" />
                        <img 
                          src={pixQRCode} 
                          alt="QR Code PIX" 
                          className="relative w-52 h-52 border-4 border-background rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-4 text-center">
                        Escaneie o QR Code ou copie a chave PIX
                      </p>
                    </div>

                    <div className="bg-background/60 backdrop-blur-sm p-4 rounded-xl mb-4 border border-border/50">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Chave PIX (CNPJ)
                      </Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input 
                          value="54339140000118" 
                          readOnly 
                          className="font-mono text-center bg-background border-2 text-foreground font-semibold"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText('54339140000118');
                            toast({ title: "✓ Chave PIX copiada!" });
                          }}
                          className="bg-[hsl(var(--pix))] hover:bg-[hsl(var(--pix))]/90 text-white transition-all duration-300 hover:scale-105"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-background/60 backdrop-blur-sm p-4 rounded-xl border border-border/50">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        PIX Copia e Cola
                      </Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input 
                          value={pixPayload} 
                          readOnly 
                          className="font-mono text-xs bg-background border-2"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(pixPayload);
                            toast({ title: "✓ Código PIX copiado!" });
                          }}
                          className="bg-[hsl(var(--pix))] hover:bg-[hsl(var(--pix))]/90 text-white transition-all duration-300 hover:scale-105"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Credit Card Form */}
                {formData.payment_method === 'cartao' && (
                  <div className="mt-8 p-6 border-2 border-[hsl(var(--card-payment))]/30 rounded-2xl bg-gradient-to-br from-[hsl(var(--card-payment))]/5 to-[hsl(var(--card-payment))]/10 animate-fade-in backdrop-blur-sm space-y-6">
                    <h3 className="text-lg font-bold text-[hsl(var(--card-payment))]">Dados do Cartão</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="card_holder" className="text-base font-semibold text-foreground">Nome do Titular *</Label>
                      <Input
                        id="card_holder"
                        type="text"
                        placeholder="NOME COMO NO CARTÃO"
                        value={formData.card_holder}
                        onChange={(e) => setFormData({ ...formData, card_holder: e.target.value.toUpperCase() })}
                        required
                        className="h-12 font-semibold bg-background border-2 focus:border-[hsl(var(--card-payment))] focus:ring-2 focus:ring-[hsl(var(--card-payment))]/20 transition-all duration-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="card_number" className="text-base font-semibold text-foreground">Número do Cartão *</Label>
                      <Input
                        id="card_number"
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        value={formData.card_number}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
                          setFormData({ ...formData, card_number: value });
                        }}
                        maxLength={19}
                        required
                        className="h-12 font-mono text-lg bg-background border-2 focus:border-[hsl(var(--card-payment))] focus:ring-2 focus:ring-[hsl(var(--card-payment))]/20 transition-all duration-300"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="card_expiry" className="text-base font-semibold text-foreground">Validade *</Label>
                        <Input
                          id="card_expiry"
                          type="text"
                          placeholder="MM/AA"
                          value={formData.card_expiry}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2, 4);
                            }
                            setFormData({ ...formData, card_expiry: value });
                          }}
                          maxLength={5}
                          required
                          className="h-12 font-mono text-center bg-background border-2 focus:border-[hsl(var(--card-payment))] focus:ring-2 focus:ring-[hsl(var(--card-payment))]/20 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="card_cvv" className="text-base font-semibold text-foreground">CVV *</Label>
                        <Input
                          id="card_cvv"
                          type="text"
                          placeholder="123"
                          value={formData.card_cvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setFormData({ ...formData, card_cvv: value });
                          }}
                          maxLength={4}
                          required
                          className="h-12 font-mono text-center bg-background border-2 focus:border-[hsl(var(--card-payment))] focus:ring-2 focus:ring-[hsl(var(--card-payment))]/20 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Cash Change Input */}
                {formData.payment_method === 'dinheiro' && (
                  <div className="mt-8 p-6 border-2 border-[hsl(var(--cash))]/30 rounded-2xl bg-gradient-to-br from-[hsl(var(--cash))]/5 to-[hsl(var(--cash))]/10 animate-fade-in backdrop-blur-sm">
                    <h3 className="text-lg font-bold mb-4 text-[hsl(var(--cash))]">Pagamento em Dinheiro</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="change_for" className="text-base font-semibold text-foreground">Troco para:</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                          R$
                        </span>
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
                          className="h-12 pl-10 text-lg font-bold bg-background border-2 focus:border-[hsl(var(--cash))] focus:ring-2 focus:ring-[hsl(var(--cash))]/20 transition-all duration-300"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Deixe vazio se não precisar de troco
                      </p>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-8 shadow-lg border-2 hover:border-primary/50 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-6 text-card-foreground">Quando Pagar?</h2>
                <RadioGroup
                  value={formData.payment_timing}
                  onValueChange={(value) => setFormData({ ...formData, payment_timing: value })}
                >
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="entrega" id="entrega" />
                    <Label htmlFor="entrega" className="cursor-pointer flex-1">
                      Pagar na Entrega
                    </Label>
                  </div>
                  <div 
                    className={`
                      flex items-center space-x-2 p-3 rounded-lg 
                      ${formData.payment_method === 'dinheiro' 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-accent cursor-pointer'
                      }
                    `}
                  >
                    <RadioGroupItem 
                      value="agora" 
                      id="agora" 
                      disabled={formData.payment_method === 'dinheiro'}
                    />
                    <Label 
                      htmlFor="agora" 
                      className={`flex-1 ${
                        formData.payment_method === 'dinheiro' 
                          ? 'cursor-not-allowed text-muted-foreground' 
                          : 'cursor-pointer'
                      }`}
                    >
                      Pagar Agora (Online)
                      {formData.payment_method === 'dinheiro' && (
                        <span className="block text-xs text-red-500 mt-1">
                          Não disponível para dinheiro
                        </span>
                      )}
                    </Label>
                  </div>
                </RadioGroup>
              </Card>

              <Card className="p-8 shadow-lg border-2 hover:border-primary/50 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-6 text-card-foreground">Observações</h2>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ex: Deixar na portaria, trocar porta, etc..."
                  rows={4}
                  className="text-base border-2 focus:border-primary transition-all resize-none"
                />
              </Card>
            </form>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-8 sticky top-24 shadow-2xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
              <h2 className="text-2xl font-bold mb-6 text-card-foreground">Resumo do Pedido</h2>
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-accent/30 border border-primary/10 hover:border-primary/30 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 text-primary font-bold text-sm">
                          {item.quantity}
                        </span>
                        <span className="font-medium text-card-foreground text-sm">{item.name}</span>
                      </div>
                    </div>
                    <span className="font-bold text-primary ml-2">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t-2 border-primary/20 pt-6 mb-8 bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-muted-foreground">Subtotal:</span>
                  <span className="text-xl font-bold text-card-foreground">
                    R$ {total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-card-foreground">Total:</span>
                  <span className="text-4xl font-bold text-primary animate-pulse">
                    R$ {total.toFixed(2)}
                  </span>
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                size="lg"
                className="w-full h-16 text-xl font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center">
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">✓</span>
                      Confirmar Pedido
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;