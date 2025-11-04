import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Package, Clock, Truck, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
          .or(`customer_phone.eq.${userProfile.phone},customer_email.eq.${user.email}`)
          .order("created_at", { ascending: false });

        if (error) throw error;
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
    return orders.filter((order) => order.order_status === status);
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
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Meus Pedidos</h1>
          <p className="text-muted-foreground">Acompanhe o status dos seus pedidos</p>
        </div>

        <Tabs defaultValue="separacao" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="separacao" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Em Separação
            </TabsTrigger>
            <TabsTrigger value="rota" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Em Rota
            </TabsTrigger>
            <TabsTrigger value="entregue" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Entregue
            </TabsTrigger>
          </TabsList>

          <TabsContent value="separacao" className="mt-6">
            <OrderList
              status="separacao"
              emptyIcon={Clock}
              emptyMessage="Você não tem pedidos em separação"
            />
          </TabsContent>

          <TabsContent value="rota" className="mt-6">
            <OrderList
              status="rota"
              emptyIcon={Truck}
              emptyMessage="Você não tem pedidos em rota"
            />
          </TabsContent>

          <TabsContent value="entregue" className="mt-6">
            <OrderList
              status="entregue"
              emptyIcon={CheckCircle}
              emptyMessage="Você ainda não tem pedidos entregues"
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
