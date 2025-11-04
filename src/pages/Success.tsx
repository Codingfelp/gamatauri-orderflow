import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { OrderTimeline } from "@/components/OrderTimeline";
import { useActiveOrder } from "@/contexts/ActiveOrderContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

const Success = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setActiveOrder } = useActiveOrder();
  const orderNumber = location.state?.orderNumber;
  const orderId = location.state?.orderId;
  const [orderStatus, setOrderStatus] = useState<string>('preparing');
  const [createdAt, setCreatedAt] = useState<string>(new Date().toISOString());

  useEffect(() => {
    if (!orderNumber && !orderId) {
      navigate('/');
    } else if (orderNumber && orderId) {
      setActiveOrder({
        orderId,
        orderNumber,
        status: "preparing",
        createdAt: new Date().toISOString(),
      });
    }
  }, [orderNumber, orderId, navigate, setActiveOrder]);

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
      }
    };
    
    fetchOrderStatus();
    
    const channel = supabase
      .channel(`success-order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload: any) => {
          console.log('Status atualizado em Success:', payload.new.order_status);
          setOrderStatus(payload.new.order_status);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

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
      toast.success('Pedido marcado como entregue! 🎉');
    } catch (error) {
      console.error('Error marking as delivered:', error);
      toast.error('Erro ao marcar pedido como entregue');
    }
  };

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
          {orderStatus !== 'delivered' && (
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