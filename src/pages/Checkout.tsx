import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, Banknote, Smartphone, Loader2, User } from "lucide-react";
import { submitOrder, type OrderItem } from "@/services/orderService";

type CartItem = OrderItem;

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const cart = (location.state?.cart as CartItem[]) || [];

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_phone: "",
    customer_email: "",
    customer_address: "",
    payment_method: "pix",
    payment_timing: "entrega",
    notes: "",
  });

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_phone || !formData.payment_method) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o telefone e a forma de pagamento",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const orderResult = await submitOrder({
        customer_name: formData.customer_email || formData.customer_phone,
        customer_phone: formData.customer_phone,
        customer_address: formData.customer_address || undefined,
        items: cart,
        payment_method: formData.payment_method,
        payment_timing: formData.payment_timing,
        total: total,
        delivery_fee: 0,
        notes: formData.notes || undefined,
      });

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
    <div className="min-h-screen bg-gradient-to-b from-background via-accent/5 to-accent/10">
      <header className="bg-card/95 backdrop-blur-sm shadow-lg border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-4xl font-bold text-primary">Finalizar Pedido</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              <Card className="p-8 shadow-lg border-2 hover:border-primary/50 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-6 flex items-center text-card-foreground">
                  <User className="mr-3 h-6 w-6 text-primary" />
                  Dados de Contato
                </h2>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-base font-semibold">Telefone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      required
                      className="h-12 text-base border-2 focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base font-semibold">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      placeholder="seu@email.com"
                      className="h-12 text-base border-2 focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-base font-semibold">Endereço de Entrega</Label>
                    <Textarea
                      id="address"
                      value={formData.customer_address}
                      onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                      placeholder="Rua, número, bairro, cidade"
                      rows={3}
                      className="text-base border-2 focus:border-primary transition-all resize-none"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-8 shadow-lg border-2 hover:border-primary/50 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-6 text-card-foreground">💳 Forma de Pagamento</h2>
                <RadioGroup
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  className="space-y-3"
                >
                  <div className={`
                    relative flex items-center space-x-4 p-5 rounded-2xl cursor-pointer border-2 transition-all duration-300
                    ${formData.payment_method === 'pix' ? 'bg-primary/10 border-primary shadow-lg scale-[1.02]' : 'bg-accent/30 border-transparent hover:border-primary/40 hover:bg-accent/50'}
                  `}>
                    <RadioGroupItem value="pix" id="pix" className="scale-125" />
                    <Label htmlFor="pix" className="flex items-center cursor-pointer flex-1 font-semibold text-base">
                      <Smartphone className="w-7 h-7 mr-4 text-primary" />
                      <div>
                        <div className="font-bold">Pix</div>
                        <div className="text-xs text-muted-foreground">Instantâneo e gratuito</div>
                      </div>
                    </Label>
                  </div>
                  <div className={`
                    relative flex items-center space-x-4 p-5 rounded-2xl cursor-pointer border-2 transition-all duration-300
                    ${formData.payment_method === 'cartao' ? 'bg-primary/10 border-primary shadow-lg scale-[1.02]' : 'bg-accent/30 border-transparent hover:border-primary/40 hover:bg-accent/50'}
                  `}>
                    <RadioGroupItem value="cartao" id="cartao" className="scale-125" />
                    <Label htmlFor="cartao" className="flex items-center cursor-pointer flex-1 font-semibold text-base">
                      <CreditCard className="w-7 h-7 mr-4 text-primary" />
                      <div>
                        <div className="font-bold">Cartão de Crédito</div>
                        <div className="text-xs text-muted-foreground">Débito ou crédito</div>
                      </div>
                    </Label>
                  </div>
                  <div className={`
                    relative flex items-center space-x-4 p-5 rounded-2xl cursor-pointer border-2 transition-all duration-300
                    ${formData.payment_method === 'dinheiro' ? 'bg-primary/10 border-primary shadow-lg scale-[1.02]' : 'bg-accent/30 border-transparent hover:border-primary/40 hover:bg-accent/50'}
                  `}>
                    <RadioGroupItem value="dinheiro" id="dinheiro" className="scale-125" />
                    <Label htmlFor="dinheiro" className="flex items-center cursor-pointer flex-1 font-semibold text-base">
                      <Banknote className="w-7 h-7 mr-4 text-primary" />
                      <div>
                        <div className="font-bold">Dinheiro</div>
                        <div className="text-xs text-muted-foreground">Pagamento em espécie</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
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
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="agora" id="agora" />
                    <Label htmlFor="agora" className="cursor-pointer flex-1">
                      Pagar Agora (Online)
                    </Label>
                  </div>
                </RadioGroup>
              </Card>

              <Card className="p-8 shadow-lg border-2 hover:border-primary/50 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-6 text-card-foreground">📝 Observações</h2>
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
              <h2 className="text-2xl font-bold mb-6 text-card-foreground flex items-center">
                <span className="mr-2">📋</span> Resumo do Pedido
              </h2>
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