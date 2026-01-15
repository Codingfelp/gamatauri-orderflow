import { useEffect, useState } from "react";
import { CheckCircle, Clock, Package, XCircle, Store, MapPin, ThumbsUp, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface OrderTimelineProps {
  orderNumber: string;
  orderId: string;
  createdAt: string;
  deliveryType?: 'delivery' | 'pickup';
}

type OrderStatus = "received" | "preparing" | "delivering" | "delivered" | "cancelled" | "accepted";

export const OrderTimeline = ({ orderNumber, orderId, createdAt, deliveryType = 'delivery' }: OrderTimelineProps) => {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>("received");
  const [confettiShown, setConfettiShown] = useState(false);

  // Buscar status inicial do banco
  useEffect(() => {
    const fetchInitialStatus = async () => {
      const { data } = await supabase
        .from('orders')
        .select('order_status')
        .eq('id', orderId)
        .single();
      
      if (data?.order_status) {
        const uiStatus = mapDbStatusToUI(data.order_status);
        setCurrentStatus(uiStatus);
      }
    };
    
    fetchInitialStatus();
  }, [orderId, deliveryType]);

  // Escutar mudanças em tempo real
  useEffect(() => {
    const channel = supabase
      .channel(`order-timeline-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload: any) => {
          console.log('[OrderTimeline] Status atualizado:', payload.new.order_status);
          const newStatus = payload.new.order_status;
          const uiStatus = mapDbStatusToUI(newStatus);
          setCurrentStatus(uiStatus);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, deliveryType]);

  // Confetti effect when delivered
  useEffect(() => {
    if (currentStatus === 'delivered' && !confettiShown) {
      setConfettiShown(true);
      createConfetti();
    }
  }, [currentStatus, confettiShown]);

  const mapDbStatusToUI = (dbStatus: string): OrderStatus => {
    // For pickup orders
    if (deliveryType === 'pickup') {
      switch (dbStatus) {
        case 'preparing':
        case 'separacao':
        case 'preparando':
          return 'accepted'; // Pedido Aceito for pickup
        case 'in_route':
        case 'saiu_entrega':
        case 'rota':
        case 'em_rota':
          return 'accepted'; // Skip in_route for pickup, show as accepted
        case 'delivered':
        case 'entregue':
          return 'delivered';
        case 'cancelled':
        case 'cancelado':
          return 'cancelled';
        default:
          return 'received';
      }
    }
    
    // Standard delivery flow
    switch (dbStatus) {
      case 'preparing':
      case 'separacao':
      case 'preparando':
        return 'preparing';
      case 'in_route':
      case 'saiu_entrega':
      case 'rota':
      case 'em_rota':
        return 'delivering';
      case 'delivered':
      case 'entregue':
        return 'delivered';
      case 'cancelled':
      case 'cancelado':
        return 'cancelled';
      default:
        return 'received';
    }
  };

  const createConfetti = () => {
    const duration = 4000;
    const animationEnd = Date.now() + duration;
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const frame = () => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return;

      for (let i = 0; i < 4; i++) {
        const particle = document.createElement('div');
        const size = Math.random() * 10 + 5;
        const isCircle = Math.random() > 0.5;
        
        particle.style.cssText = `
          position: fixed;
          width: ${size}px;
          height: ${size}px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          left: ${Math.random() * 100}vw;
          top: -20px;
          border-radius: ${isCircle ? '50%' : '2px'};
          pointer-events: none;
          z-index: 9999;
          animation: confetti-fall ${2.5 + Math.random() * 2}s linear forwards;
          transform: rotate(${Math.random() * 360}deg);
        `;
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 5000);
      }

      requestAnimationFrame(frame);
    };

    if (!document.getElementById('confetti-style')) {
      const style = document.createElement('style');
      style.id = 'confetti-style';
      style.textContent = `
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    frame();
  };

  const openMaps = () => {
    const address = "R. Aiuruoca, 192 - Loja 5 - Fernão Dias, Belo Horizonte - MG";
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  // Different status flow for pickup vs delivery
  const deliveryStatuses: { key: OrderStatus; label: string; icon: any; subtitle: string }[] = [
    { key: "received", label: "Recebido", icon: Package, subtitle: "Pedido confirmado" },
    { key: "preparing", label: "Preparando", icon: Clock, subtitle: "~10 minutos" },
    { key: "delivering", label: "Em Rota", icon: Truck, subtitle: "~35 minutos" },
    { key: "delivered", label: "Entregue", icon: CheckCircle, subtitle: "Concluído" },
  ];

  const pickupStatuses: { key: OrderStatus; label: string; icon: any; subtitle: string }[] = [
    { key: "received", label: "Pedido Recebido", icon: Package, subtitle: "Pedido confirmado" },
    { key: "accepted", label: "Pedido Aceito", icon: ThumbsUp, subtitle: "Em preparação" },
    { key: "delivered", label: "Pedido Entregue", icon: Store, subtitle: "Retirada confirmada" },
  ];

  const statuses = deliveryType === 'pickup' ? pickupStatuses : deliveryStatuses;

  const getStatusIndex = (status: OrderStatus): number => {
    return statuses.findIndex(s => s.key === status);
  };

  const currentIndex = getStatusIndex(currentStatus);

  // Cancelled state
  if (currentStatus === "cancelled") {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto px-4"
      >
        <div className="text-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-destructive/10 mb-6"
          >
            <XCircle className="w-14 h-14 text-destructive" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-destructive mb-3">Pedido Cancelado</h1>
          
          <div className="bg-card border border-border rounded-2xl p-4 mb-6 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Número do Pedido</p>
            <p className="text-xl font-mono font-bold text-primary">{orderNumber}</p>
          </div>

          <p className="text-muted-foreground">
            Entre em contato conosco para mais informações.
          </p>
        </div>
      </motion.div>
    );
  }

  const progressWidth = statuses.length > 1 
    ? (currentIndex / (statuses.length - 1)) * 100 
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-md mx-auto px-4"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 mb-4 shadow-lg shadow-primary/30"
        >
          <CheckCircle className="w-10 h-10 text-primary-foreground" />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-primary mb-2"
        >
          {deliveryType === 'pickup' ? 'Pedido Confirmado!' : 'Pedido Confirmado!'}
        </motion.h1>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-4 shadow-sm"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Número do Pedido</p>
          <p className="text-xl font-mono font-bold text-primary">{orderNumber}</p>
        </motion.div>
      </div>

      {/* Timeline Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-3xl p-6 shadow-lg mb-6"
      >
        {/* Progress Bar */}
        <div className="relative mb-8">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressWidth}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
            />
          </div>
        </div>

        {/* Status Steps */}
        <div className="flex justify-between items-start relative">
          {statuses.map((status, index) => {
            const isActive = currentIndex === index;
            const isPast = currentIndex > index;
            const Icon = status.icon;

            return (
              <motion.div 
                key={status.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex flex-col items-center flex-1"
              >
                {/* Icon Container */}
                <div className="relative mb-3">
                  <motion.div
                    animate={isActive ? { 
                      scale: [1, 1.05, 1],
                    } : {}}
                    transition={{ 
                      duration: 2,
                      repeat: isActive ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                    className={`
                      w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300
                      ${isPast || isActive 
                        ? 'bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20' 
                        : 'bg-muted border-2 border-muted-foreground/20'
                      }
                    `}
                  >
                    <Icon className={`w-6 h-6 ${isPast || isActive ? 'text-primary-foreground' : 'text-muted-foreground/50'}`} />
                  </motion.div>

                  {/* Active indicator pulse */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-primary/30"
                    />
                  )}

                  {/* Completed checkmark */}
                  <AnimatePresence>
                    {isPast && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-md"
                      >
                        <CheckCircle className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Label */}
                <p className={`text-xs font-semibold text-center transition-colors ${
                  isPast || isActive ? 'text-primary' : 'text-muted-foreground/60'
                }`}>
                  {status.label}
                </p>
                <p className={`text-[10px] text-center mt-0.5 ${
                  isActive ? 'text-muted-foreground' : 'text-muted-foreground/50'
                }`}>
                  {status.subtitle}
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Status Message */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-accent/50 rounded-2xl p-5 text-center"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStatus}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {deliveryType === 'delivery' ? (
              <>
                {currentStatus === "received" && (
                  <p className="text-foreground font-medium">Seu pedido foi recebido com sucesso! ✨</p>
                )}
                {currentStatus === "preparing" && (
                  <p className="text-foreground font-medium">Seu pedido está sendo preparado com carinho! 🧑‍🍳</p>
                )}
                {currentStatus === "delivering" && (
                  <p className="text-foreground font-medium">Pedido a caminho! Fique atento! 🛵</p>
                )}
                {currentStatus === "delivered" && (
                  <p className="text-foreground font-medium">Entrega realizada! Obrigado! 🎉</p>
                )}
              </>
            ) : (
              <>
                {currentStatus === "received" && (
                  <p className="text-foreground font-medium">Seu pedido foi recebido! Aguarde confirmação. ✨</p>
                )}
                {currentStatus === "accepted" && (
                  <p className="text-foreground font-medium">Pedido aceito! Estamos preparando. 🧑‍🍳</p>
                )}
                {currentStatus === "delivered" && (
                  <p className="text-foreground font-medium">Pronto para retirada! Te esperamos! 🎉</p>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Pickup Store Address & Map Button */}
      {deliveryType === 'pickup' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-4 bg-card border border-border rounded-2xl p-4"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Local de Retirada</p>
              <p className="text-sm text-muted-foreground">R. Aiuruoca, 192 - Loja 5</p>
              <p className="text-xs text-muted-foreground">Fernão Dias, Belo Horizonte - MG</p>
            </div>
          </div>
          
          <Button 
            onClick={openMaps}
            variant="outline"
            className="w-full gap-2"
          >
            <MapPin className="w-4 h-4" />
            Abrir no Google Maps
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};