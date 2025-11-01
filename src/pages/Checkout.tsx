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
    customer_name: "",
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
    
    if (!formData.customer_name || !formData.customer_phone || !formData.payment_method) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const orderResult = await submitOrder({
        customer_name: formData.customer_name,
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
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      placeholder="Seu nome"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Endereço de Entrega</Label>
                    <Textarea
                      id="address"
                      value={formData.customer_address}
                      onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                      placeholder="Rua, número, bairro, cidade"
                      rows={3}
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-8 shadow-lg border-2 hover:border-primary/50 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-6 text-card-foreground">Forma de Pagamento</h2>
                <RadioGroup
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                >
                  <div className="flex items-center space-x-3 p-4 rounded-xl hover:bg-accent/50 cursor-pointer border-2 border-transparent hover:border-primary/30 transition-all">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix" className="flex items-center cursor-pointer flex-1 font-medium">
                      <Smartphone className="w-6 h-6 mr-3 text-primary" />
                      Pix
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-xl hover:bg-accent/50 cursor-pointer border-2 border-transparent hover:border-primary/30 transition-all">
                    <RadioGroupItem value="cartao" id="cartao" />
                    <Label htmlFor="cartao" className="flex items-center cursor-pointer flex-1 font-medium">
                      <CreditCard className="w-6 h-6 mr-3 text-primary" />
                      Cartão de Crédito
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-xl hover:bg-accent/50 cursor-pointer border-2 border-transparent hover:border-primary/30 transition-all">
                    <RadioGroupItem value="dinheiro" id="dinheiro" />
                    <Label htmlFor="dinheiro" className="flex items-center cursor-pointer flex-1 font-medium">
                      <Banknote className="w-6 h-6 mr-3 text-primary" />
                      Dinheiro
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
                <h2 className="text-2xl font-bold mb-6 text-card-foreground">Observações</h2>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Alguma observação sobre o pedido?"
                  rows={4}
                />
              </Card>
            </form>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-8 sticky top-24 shadow-2xl border-2 border-primary/20 bg-gradient-to-br from-card to-accent/10">
              <h2 className="text-2xl font-bold mb-6 text-card-foreground">Resumo do Pedido</h2>
              <div className="space-y-3 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-semibold">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t-2 border-primary/20 pt-6 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-card-foreground">Total:</span>
                  <span className="text-4xl font-bold text-primary">
                    R$ {total.toFixed(2)}
                  </span>
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                size="lg"
                className="w-full h-16 text-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Confirmar Pedido'
                )}
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;