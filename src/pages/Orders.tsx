import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Package, Clock, Truck, CheckCircle, ArrowLeft, Store } from "lucide-react";
import { format, isToday, isYesterday, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { normalizePhone } from "@/utils/phoneUtils";
import { toast } from "sonner";
import { BottomNavigation } from "@/components/BottomNavigation";
import gamatauri from "@/assets/gamatauri-logo.png";

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
        const normalizedProfilePhone = normalizePhone(userProfile.phone);

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
      .channel("orders-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload: any) => {
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
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
        .from("orders")
        .update({
          order_status: "delivered",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, order_status: "delivered" } : order
        )
      );

      toast.success("Pedido confirmado como entregue! 🎉");
    } catch (error) {
      console.error("Error marking as delivered:", error);
      toast.error("Erro ao marcar pedido como entregue");
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: any; icon: any }> = {
      preparing: { label: "Preparando", variant: "secondary", icon: Clock },
      in_route: { label: "A caminho", variant: "default", icon: Truck },
      delivered: { label: "Entregue", variant: "outline", icon: CheckCircle },
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
    return orders.filter((order) => order.order_status === status);
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
        {/* Logo */}
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <img src={gamatauri} alt="Gamatauri" className="h-8 w-8 object-contain" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-bold text-base">Gamatauri Delivery</h3>
              <p className="text-xs text-muted-foreground">
                {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm")}
              </p>
            </div>
            {getStatusBadge(order.order_status)}
          </div>

          {/* Items Preview */}
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

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg text-primary">
              R$ {order.total_amount.toFixed(2)}
            </span>
            {order.order_status === "in_route" && (
              <Button
                size="sm"
                onClick={() => markAsDelivered(order.id)}
                className="h-8"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Confirmar
              </Button>
            )}
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
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
              {dateLabel}
            </h3>
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
      {/* Simple Header */}
      <div className="sticky top-0 z-30 bg-background border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold">Pedidos</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        <Tabs defaultValue="preparing" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="preparing" className="text-xs">
              Preparando
            </TabsTrigger>
            <TabsTrigger value="in_route" className="text-xs">
              A caminho
            </TabsTrigger>
            <TabsTrigger value="delivered" className="text-xs">
              Entregues
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preparing">
            <OrderList status="preparing" />
          </TabsContent>

          <TabsContent value="in_route">
            <OrderList status="in_route" />
          </TabsContent>

          <TabsContent value="delivered">
            <OrderList status="delivered" />
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
}
