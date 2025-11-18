import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Package, Clock, Truck, CheckCircle, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { normalizePhone } from "@/utils/phoneUtils";
import { toast } from "sonner";

interface OrderItem {
  product_name: string;
  quantity: number;
  product_price: number;
  subtotal: number;
}

interface Order {
  id: string;
  external_order_number: string | null;
  created_at: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  order_status: string;
  customer_address: string;
  order_items: OrderItem[];
}

export default function Orders() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setUserProfile(profile);
    };

    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !userProfile) return;

      try {
        // Normalizar telefone do perfil para comparação
        const normalizedProfilePhone = normalizePhone(userProfile.phone);
        
        console.log('Fetching orders for user:', {
          email: user.email,
          profilePhone: userProfile.phone,
          normalizedPhone: normalizedProfilePhone
        });

        const { data, error } = await supabase
          .from("orders")
          .select(`
            *,
            order_items (
              product_name,
              quantity,
              product_price,
              subtotal
            )
          `)
          .or(`customer_phone.eq.${normalizedProfilePhone},customer_email.eq.${user.email}`)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        console.log('Orders fetched:', data?.length || 0);
        console.log('Orders:', data);
        
        setOrders(data || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userProfile) {
      fetchOrders();
    }
  }, [user, userProfile]);

  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('orders-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload: any) => {
          console.log('Pedido atualizado:', payload.new);
          setOrders(prevOrders => 
            prevOrders.map(order => 
              order.id === payload.new.id 
                ? { ...order, order_status: payload.new.order_status }
                : order
            )
          );
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsDelivered = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          order_status: 'delivered',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, order_status: 'delivered' }
          : order
      ));
      
      toast.success('Pedido marcado como entregue! 🎉');
    } catch (error) {
      console.error('Error marking as delivered:', error);
      toast.error('Erro ao marcar pedido como entregue');
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      pix: "PIX",
      credito: "Cartão de Crédito",
      debito: "Cartão de Débito",
      dinheiro: "Dinheiro",
    };
    return methods[method] || method;
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pago: "default",
      pendente: "secondary",
    };
    const labels: Record<string, string> = {
      pago: "Pago",
      pendente: "Pendente",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const filterOrdersByStatus = (status: string) => {
    const filtered = orders.filter((order) => order.order_status === status);
    console.log(`Filtering orders by status "${status}":`, filtered.length);
    return filtered;
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg">
            Pedido #{order.external_order_number || order.id.slice(0, 8)}
          </h3>
          <p className="text-sm text-muted-foreground">
            {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        {getPaymentStatusBadge(order.payment_status)}
      </div>

      <div className="space-y-2 border-t pt-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Pagamento:</span>
          <span className="font-medium">{getPaymentMethodLabel(order.payment_method)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Endereço:</span>
          <span className="font-medium text-right max-w-[200px] truncate">
            {order.customer_address}
          </span>
        </div>
      </div>

      <div className="border-t pt-3 space-y-1">
        <p className="text-sm font-semibold">Itens:</p>
        {order.order_items.map((item, idx) => (
          <div key={idx} className="text-sm flex justify-between">
            <span className="text-muted-foreground">
              {item.quantity}x {item.product_name}
            </span>
            <span>R$ {item.subtotal.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-t pt-3 flex justify-between items-center">
        <span className="font-bold">Total:</span>
        <span className="text-xl font-bold text-primary">
          R$ {order.total_amount.toFixed(2)}
        </span>
      </div>

      {order.order_status === 'in_route' && (
        <div className="border-t pt-3">
          <Button
            onClick={() => markAsDelivered(order.id)}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Confirmar Entrega
          </Button>
        </div>
      )}
    </Card>
  );

  const OrderList = ({ status, emptyIcon, emptyMessage }: { status: string; emptyIcon: any; emptyMessage: string }) => {
    const filteredOrders = filterOrdersByStatus(status);

    if (filteredOrders.length === 0) {
      return (
        <EmptyState
          icon={emptyIcon}
          title="Nenhum pedido"
          description={emptyMessage}
        />
      );
    }

    return (
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 hover:bg-accent/60 transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Início
        </Button>
      </div>
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Meus Pedidos</h1>
          <p className="text-muted-foreground">Acompanhe o status dos seus pedidos</p>
        </div>

        <Tabs defaultValue="preparing" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preparing" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Em Preparação
            </TabsTrigger>
            <TabsTrigger value="in_route" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Em Rota
            </TabsTrigger>
            <TabsTrigger value="delivered" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Entregues
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preparing" className="mt-6">
            <OrderList
              status="preparing"
              emptyIcon={Clock}
              emptyMessage="Você não tem pedidos em preparação"
            />
          </TabsContent>

          <TabsContent value="in_route" className="mt-6">
            <OrderList
              status="in_route"
              emptyIcon={Truck}
              emptyMessage="Você não tem pedidos em rota de entrega"
            />
          </TabsContent>

          <TabsContent value="delivered" className="mt-6">
            <OrderList
              status="delivered"
              emptyIcon={CheckCircle}
              emptyMessage="Nenhum pedido entregue ainda"
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
