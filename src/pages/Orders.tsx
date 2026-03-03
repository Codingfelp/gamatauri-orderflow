import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Package, Clock, Truck, CheckCircle, ArrowLeft, XCircle } from "lucide-react";
import { format, isToday, isYesterday, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BottomNavigation } from "@/components/BottomNavigation";
import gamatauri from "@/assets/gamatauri-logo.png";
import { fetchOrders, type OrderData, type OrderItemData } from "@/services/api/orders";

interface Order {
  id: string;
  external_order_number: string | null;
  created_at: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  order_status: string;
  customer_address: string;
  order_items: { product_name: string; quantity: number; product_price: number; subtotal: number }[];
}

function mapApiOrder(o: OrderData): Order {
  return {
    id: o.id,
    external_order_number: o.order_number || o.external_order_number || null,
    created_at: o.created_at,
    total_amount: o.total ?? o.total_amount ?? 0,
    payment_status: o.payment_status || "paid",
    payment_method: o.payment_method || "pix",
    order_status: o.status || o.order_status || "preparing",
    customer_address: o.customer_address || "",
    order_items: (o.items || []).map((item: OrderItemData) => ({
      product_name: item.productName || item.product_name || "",
      quantity: item.quantity,
      product_price: item.unitPrice || item.product_price || 0,
      subtotal: item.totalPrice || item.subtotal || 0,
    })),
  };
}

export default function Orders() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const loadOrders = async () => {
    if (!user) return;
    try {
      const res = await fetchOrders(1, 100);
      setOrders((res.data || []).map(mapApiOrder));
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  // Polling every 30 seconds
  useEffect(() => {
    if (!user) return;
    const poll = setInterval(loadOrders, 30000);
    return () => clearInterval(poll);
  }, [user]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: any; icon: any }> = {
      preparing: { label: "Preparando", variant: "secondary", icon: Clock },
      separacao: { label: "Preparando", variant: "secondary", icon: Clock },
      in_route: { label: "A caminho", variant: "default", icon: Truck },
      delivered: { label: "Entregue", variant: "outline", icon: CheckCircle },
      entregue: { label: "Entregue", variant: "outline", icon: CheckCircle },
      cancelled: { label: "Cancelado", variant: "destructive", icon: XCircle },
      cancelado: { label: "Cancelado", variant: "destructive", icon: XCircle },
    };
    const { label, variant, icon: Icon } = config[status] || config.preparing;
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getDateLabel = (date: string) => {
    const orderDate = new Date(date);
    if (isToday(orderDate)) return "Hoje";
    if (isYesterday(orderDate)) return "Ontem";
    const days = differenceInDays(new Date(), orderDate);
    if (days <= 7) return `Há ${days} dias`;
    return format(orderDate, "dd 'de' MMMM", { locale: ptBR });
  };

  const filterOrdersByStatus = (status: string) => {
    if (status === 'preparing') {
      return orders.filter((o) => o.order_status === 'preparing' || o.order_status === 'separacao');
    }
    if (status === 'delivered') {
      return orders.filter((o) => o.order_status === 'delivered' || o.order_status === 'entregue');
    }
    if (status === 'cancelled') {
      return orders.filter((o) => o.order_status === 'cancelled' || o.order_status === 'cancelado');
    }
    return orders.filter((o) => o.order_status === status);
  };

  const groupOrdersByDate = (orders: Order[]) => {
    const groups: Record<string, Order[]> = {};
    orders.forEach((order) => {
      const label = getDateLabel(order.created_at);
      if (!groups[label]) groups[label] = [];
      groups[label].push(order);
    });
    return groups;
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <img src={gamatauri} alt="Gamatauri" className="h-8 w-8 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-bold text-base">Gamatauri Delivery</h3>
              <p className="text-xs text-muted-foreground">
                {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm")}
              </p>
            </div>
            {getStatusBadge(order.order_status)}
          </div>
          <div className="text-sm text-muted-foreground mb-3">
            {order.order_items.slice(0, 2).map((item, idx) => (
              <span key={idx}>
                {item.quantity}x {item.product_name}
                {idx < Math.min(order.order_items.length, 2) - 1 && " • "}
              </span>
            ))}
            {order.order_items.length > 2 && (
              <span className="text-xs"> +{order.order_items.length - 2} itens</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg text-primary">
              R$ {order.total_amount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );

  const OrderList = ({ status }: { status: string }) => {
    const filteredOrders = filterOrdersByStatus(status);
    const groupedOrders = groupOrdersByDate(filteredOrders);

    if (filteredOrders.length === 0) {
      const emptyMessages: Record<string, string> = {
        preparing: "Nenhum pedido em preparação",
        in_route: "Nenhum pedido a caminho",
        delivered: "Nenhum pedido entregue",
        cancelled: "Nenhum pedido cancelado",
      };
      return (
        <div className="text-center py-16">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">{emptyMessages[status]}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {Object.entries(groupedOrders).map(([dateLabel, orders]) => (
          <div key={dateLabel}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">{dateLabel}</h3>
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner size="lg" />
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-30 bg-background border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="p-2 hover:bg-muted rounded-full transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold">Pedidos</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <Tabs defaultValue="preparing" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="preparing" className="text-xs">Preparando</TabsTrigger>
            <TabsTrigger value="in_route" className="text-xs">A caminho</TabsTrigger>
            <TabsTrigger value="delivered" className="text-xs">Entregues</TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs">Cancelados</TabsTrigger>
          </TabsList>
          <TabsContent value="preparing"><OrderList status="preparing" /></TabsContent>
          <TabsContent value="in_route"><OrderList status="in_route" /></TabsContent>
          <TabsContent value="delivered"><OrderList status="delivered" /></TabsContent>
          <TabsContent value="cancelled"><OrderList status="cancelled" /></TabsContent>
        </Tabs>
      </div>
      <BottomNavigation />
    </div>
  );
}
