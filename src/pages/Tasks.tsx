import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, Clock, Truck, CheckCircle, XCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  payment_method: string;
  payment_timing: string;
  payment_status: string;
  order_status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
}

const Tasks = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    
    // Realtime subscription
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar pedidos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: "O status do pedido foi atualizado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'separacao':
        return <Package className="w-5 h-5" />;
      case 'preparando':
        return <Clock className="w-5 h-5" />;
      case 'saiu_entrega':
        return <Truck className="w-5 h-5" />;
      case 'entregue':
        return <CheckCircle className="w-5 h-5" />;
      case 'cancelado':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      separacao: 'Em Separação',
      preparando: 'Preparando',
      saiu_entrega: 'Saiu para Entrega',
      entregue: 'Entregue',
      cancelado: 'Cancelado',
    };
    return labels[status] || status;
  };

  const getPaymentLabel = (method: string) => {
    const labels: Record<string, string> = {
      pix: 'Pix',
      cartao: 'Cartão',
      dinheiro: 'Dinheiro',
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20">
      <header className="bg-card shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-primary">Gerenciar Pedidos</h1>
          <p className="text-muted-foreground mt-1">
            {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'} no sistema
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-2xl font-semibold mb-2">Nenhum pedido ainda</h2>
            <p className="text-muted-foreground">
              Os pedidos dos clientes aparecerão aqui
            </p>
          </Card>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <Card key={order.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="text-primary mt-1">
                        {getStatusIcon(order.order_status)}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-card-foreground">
                          {order.customer_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {order.customer_phone}
                        </p>
                        {order.customer_address && (
                          <p className="text-sm text-muted-foreground mt-1">
                            📍 {order.customer_address}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline">
                        {getPaymentLabel(order.payment_method)}
                      </Badge>
                      <Badge variant={order.payment_timing === 'agora' ? 'default' : 'secondary'}>
                        {order.payment_timing === 'agora' ? 'Pago Online' : 'Pagar na Entrega'}
                      </Badge>
                      <Badge variant={order.payment_status === 'pago' ? 'default' : 'secondary'}>
                        {order.payment_status === 'pago' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </div>

                    {order.notes && (
                      <div className="bg-accent/50 rounded p-3 mb-4">
                        <p className="text-sm text-muted-foreground">
                          <strong>Obs:</strong> {order.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-primary">
                        R$ {order.total_amount.toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        • {new Date(order.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="lg:min-w-[200px]">
                    <Select
                      value={order.order_status}
                      onValueChange={(value) => updateOrderStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="separacao">Em Separação</SelectItem>
                        <SelectItem value="preparando">Preparando</SelectItem>
                        <SelectItem value="saiu_entrega">Saiu para Entrega</SelectItem>
                        <SelectItem value="entregue">Entregue</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Tasks;