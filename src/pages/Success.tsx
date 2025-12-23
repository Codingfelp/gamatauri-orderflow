import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { OrderTimeline } from "@/components/OrderTimeline";
import { useActiveOrder } from "@/contexts/ActiveOrderContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

type OrderStatus = "preparing" | "in_route" | "delivered" | "cancelled";

const Success = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setActiveOrder, cancelledOrderDetails, clearCancelledOrder } = useActiveOrder();
  const orderNumber = location.state?.orderNumber;
  const orderId = location.state?.orderId;
  const [orderStatus, setOrderStatus] = useState<string>('preparing');
  const [createdAt, setCreatedAt] = useState<string>(new Date().toISOString());
  const [isCancelled, setIsCancelled] = useState(false);

  // Mapear status do banco para tipo esperado pelo contexto
  const mapDbStatusToContextStatus = (dbStatus: string): OrderStatus => {
    switch (dbStatus) {
      case 'preparing':
      case 'separacao':
        return 'preparing';
      case 'in_route':
      case 'em_rota':
        return 'in_route';
      case 'delivered':
      case 'entregue':
        return 'delivered';
      case 'cancelled':
      case 'cancelado':
        return 'cancelled';
      default:
        return 'preparing';
    }
  };

  // Check if we came from a cancelled order via context
  useEffect(() => {
    if (cancelledOrderDetails) {
      setIsCancelled(true);
      setOrderStatus('cancelled');
    }
  }, [cancelledOrderDetails]);

  useEffect(() => {
    if (!orderNumber && !orderId && !cancelledOrderDetails) {
      navigate('/');
    }
  }, [orderNumber, orderId, cancelledOrderDetails, navigate]);

  useEffect(() => {
    if (!orderId) return;
    
    const fetchOrderStatus = async () => {
      const { data } = await supabase
        .from('orders')
        .select('order_status, created_at')
        .eq('id', orderId)
        .single();
      
      if (data) {
        setOrderStatus(data.order_status);
        setCreatedAt(data.created_at);
        
        // Check if order is cancelled
        if (data.order_status === 'cancelled' || data.order_status === 'cancelado') {
          setIsCancelled(true);
        } else {
          // Atualizar contexto com status real do banco
          setActiveOrder({
            orderId,
            orderNumber: orderNumber || '',
            status: mapDbStatusToContextStatus(data.order_status),
            createdAt: data.created_at,
          });
        }
      }
    };
    
    fetchOrderStatus();
    
    const channel = supabase
      .channel(`success-page-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload: any) => {
          console.log('[Success] Status atualizado em Success:', payload.new.order_status);
          const newStatus = payload.new.order_status;
          setOrderStatus(newStatus);
          
          // Check if cancelled
          if (newStatus === 'cancelled' || newStatus === 'cancelado') {
            setIsCancelled(true);
            return;
          }
          
          // Atualizar contexto quando status mudar via realtime
          setActiveOrder({
            orderId,
            orderNumber: orderNumber || '',
            status: mapDbStatusToContextStatus(newStatus),
            createdAt: payload.new.created_at || createdAt,
          });
        }
      )
      .subscribe((status) => {
        console.log('[Success] Subscription status:', status);
      });
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, orderNumber, setActiveOrder]);

  const markAsDelivered = async () => {
    if (!orderId) return;
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          order_status: 'delivered',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      
      setOrderStatus('delivered');
      
      // Atualizar contexto
      setActiveOrder({
        orderId,
        orderNumber: orderNumber || '',
        status: 'delivered',
        createdAt,
      });
      
      toast.success('Pedido marcado como entregue! 🎉');
    } catch (error) {
      console.error('Error marking as delivered:', error);
      toast.error('Erro ao marcar pedido como entregue');
    }
  };

  // Cancelled order view
  if (isCancelled || orderStatus === 'cancelled') {
    const displayOrderNumber = orderNumber || cancelledOrderDetails?.orderNumber || 'N/A';
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-destructive/5 to-destructive/10 p-4 py-20 animate-fade-in">
        <div className="max-w-lg w-full text-center">
          {/* Cancelled Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-destructive/20 to-destructive/5 mb-6 animate-scale-in">
            <XCircle className="w-12 h-12 text-destructive" />
          </div>
          
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-destructive mb-4">
            Pedido Cancelado
          </h1>
          
          {/* Order Number */}
          <div className="inline-block backdrop-blur-sm bg-white/60 dark:bg-black/60 px-6 py-3 rounded-2xl border border-destructive/20 shadow-lg mb-6">
            <p className="text-sm text-muted-foreground mb-1">Número do Pedido</p>
            <p className="text-2xl font-mono font-bold text-destructive">{displayOrderNumber}</p>
          </div>
          
          {/* Message */}
          <div className="backdrop-blur-sm bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-2xl p-6 border border-destructive/20 shadow-lg mb-8">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
            <p className="text-lg font-semibold text-destructive">
              Infelizmente seu pedido foi cancelado.
            </p>
            <p className="text-muted-foreground mt-2">
              Entre em contato conosco para mais informações.
            </p>
          </div>
          
          {/* Action Button */}
          <Button
            onClick={() => {
              clearCancelledOrder();
              navigate('/');
            }}
            size="lg"
            className="px-12 h-14 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <span className="mr-2 text-xl">←</span>
            Fazer Novo Pedido
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/10 to-primary/5 p-4 py-20 animate-fade-in">
      <div className="max-w-5xl w-full">
        {orderNumber && orderId && (
          <OrderTimeline 
            orderNumber={orderNumber} 
            orderId={orderId} 
            createdAt={createdAt} 
          />
        )}
        
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '600ms' }}>
          {orderStatus !== 'delivered' && orderStatus !== 'cancelled' && (
            <Button
              onClick={markAsDelivered}
              size="lg"
              className="px-8 h-14 text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Confirmar Entrega
            </Button>
          )}
          
          <Button
            onClick={() => navigate('/')}
            size="lg"
            variant={orderStatus === 'delivered' ? 'default' : 'outline'}
            className="px-12 h-14 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
          >
            <span className="mr-2 text-xl group-hover:animate-bounce inline-block">←</span>
            Fazer Novo Pedido
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Success;