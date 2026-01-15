import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { OrderTimeline } from "@/components/OrderTimeline";
import { useActiveOrder } from "@/contexts/ActiveOrderContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, AlertTriangle, Store, ArrowLeft, MapPin } from "lucide-react";
import { motion } from "framer-motion";

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
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');

  const mapDbStatusToContextStatus = (dbStatus: string): OrderStatus => {
    switch (dbStatus) {
      case 'preparing':
      case 'separacao':
      case 'accepted':
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
        .select('order_status, created_at, delivery_type')
        .eq('id', orderId)
        .single();
      
      if (data) {
        setOrderStatus(data.order_status);
        setCreatedAt(data.created_at);
        setDeliveryType((data.delivery_type as 'delivery' | 'pickup') || 'delivery');
        
        if (data.order_status === 'cancelled' || data.order_status === 'cancelado') {
          setIsCancelled(true);
        } else {
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
          const newStatus = payload.new.order_status;
          console.log('[Success] Status update received:', newStatus);
          setOrderStatus(newStatus);
          
          if (newStatus === 'cancelled' || newStatus === 'cancelado') {
            setIsCancelled(true);
            return;
          }
          
          setActiveOrder({
            orderId,
            orderNumber: orderNumber || '',
            status: mapDbStatusToContextStatus(newStatus),
            createdAt: payload.new.created_at || createdAt,
          });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, orderNumber, setActiveOrder, createdAt]);

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
      
      setActiveOrder({
        orderId,
        orderNumber: orderNumber || '',
        status: 'delivered',
        createdAt,
      });
      
      toast.success(deliveryType === 'pickup' ? 'Retirada confirmada! 🎉' : 'Pedido marcado como entregue! 🎉');
    } catch (error) {
      console.error('Error marking as delivered:', error);
      toast.error('Erro ao confirmar');
    }
  };

  const openMaps = () => {
    const address = "R. Aiuruoca, 192 - Loja 5 - Fernão Dias, Belo Horizonte - MG";
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  // Cancelled order view
  if (isCancelled || orderStatus === 'cancelled') {
    const displayOrderNumber = orderNumber || cancelledOrderDetails?.orderNumber || 'N/A';
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 py-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-destructive/10 mb-6"
          >
            <XCircle className="w-14 h-14 text-destructive" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-destructive mb-4"
          >
            Pedido Cancelado
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-4 mb-6 shadow-sm"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Número do Pedido</p>
            <p className="text-xl font-mono font-bold text-destructive">{displayOrderNumber}</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 mb-8"
          >
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
            <p className="text-foreground font-medium">
              Infelizmente seu pedido foi cancelado.
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Entre em contato conosco para mais informações.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={() => {
                clearCancelledOrder();
                navigate('/');
              }}
              size="lg"
              className="w-full h-14 text-base font-semibold gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Fazer Novo Pedido
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Pickup order completed view
  if (deliveryType === 'pickup' && orderStatus === 'delivered') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 py-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 mb-6"
          >
            <Store className="w-14 h-14 text-green-600" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-green-600 mb-4"
          >
            Retirada Confirmada! 🎉
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-4 mb-6 shadow-sm"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Número do Pedido</p>
            <p className="text-xl font-mono font-bold text-green-600">{orderNumber}</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5 mb-8"
          >
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <p className="text-foreground font-medium">
              Seu pedido foi retirado com sucesso!
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Obrigado pela preferência! Volte sempre! 🍺
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={() => navigate('/')}
              size="lg"
              className="w-full h-14 text-base font-semibold gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Fazer Novo Pedido
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 py-12 md:py-20">
      <div className="max-w-md mx-auto">
        {orderNumber && orderId && (
          <OrderTimeline 
            orderNumber={orderNumber} 
            orderId={orderId} 
            createdAt={createdAt}
            deliveryType={deliveryType}
          />
        )}
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-8 space-y-3"
        >
          {/* Botão de confirmar entrega/retirada - só aparece se não entregue */}
          {orderStatus !== 'delivered' && orderStatus !== 'cancelled' && (
            <Button
              onClick={markAsDelivered}
              size="lg"
              className="w-full h-14 text-base font-semibold bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              {deliveryType === 'pickup' ? 'Confirmar Retirada' : 'Confirmar Entrega'}
            </Button>
          )}
          
          {/* Botão do Google Maps - apenas para retirada e se ainda não foi retirado */}
          {deliveryType === 'pickup' && orderStatus !== 'delivered' && (
            <Button
              onClick={openMaps}
              size="lg"
              variant="outline"
              className="w-full h-14 text-base font-semibold gap-2 border-primary text-primary hover:bg-primary/5"
            >
              <MapPin className="w-5 h-5" />
              Ver Endereço no Maps
            </Button>
          )}
          
          <Button
            onClick={() => navigate('/')}
            size="lg"
            variant={orderStatus === 'delivered' ? 'default' : 'outline'}
            className="w-full h-14 text-base font-semibold gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Fazer Novo Pedido
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Success;
