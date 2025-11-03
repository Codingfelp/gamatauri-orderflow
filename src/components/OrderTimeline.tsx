import { useEffect, useState } from "react";
import { CheckCircle, Clock, Bike, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface OrderTimelineProps {
  orderNumber: string;
  orderId: string;
}

type OrderStatus = "received" | "preparing" | "delivering";

export const OrderTimeline = ({ orderNumber, orderId }: OrderTimelineProps) => {
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
  }, [orderId]);

  // Escutar mudanças em tempo real
  useEffect(() => {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload: any) => {
          console.log('Status atualizado:', payload.new.order_status);
          const newStatus = payload.new.order_status;
          const uiStatus = mapDbStatusToUI(newStatus);
          setCurrentStatus(uiStatus);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // Confetti effect
  useEffect(() => {
    if (!confettiShown) {
      setConfettiShown(true);
      createConfetti();
    }
  }, [confettiShown]);

  const mapDbStatusToUI = (dbStatus: string): OrderStatus => {
    console.log('Mapping DB status to UI:', dbStatus);
    switch (dbStatus) {
      case 'separacao':
      case 'preparando':
        return 'preparing';
      case 'saiu_entrega':
        return 'delivering';
      case 'entregue':
        return 'delivering'; // Show as delivering even when delivered (could add a 4th step later)
      default:
        return 'received';
    }
  };

  const createConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

    const frame = () => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) return;

      const particleCount = 3;
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'confetti-particle';
        particle.style.cssText = `
          position: fixed;
          width: 10px;
          height: 10px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          left: ${Math.random() * 100}vw;
          top: -10px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          animation: confetti-fall ${2 + Math.random() * 2}s linear forwards;
        `;
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 4000);
      }

      requestAnimationFrame(frame);
    };

    // Add CSS animation if not exists
    if (!document.getElementById('confetti-style')) {
      const style = document.createElement('style');
      style.id = 'confetti-style';
      style.textContent = `
        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    frame();
  };

  const getStatusInfo = (status: OrderStatus) => {
    const isActive = currentStatus === status;
    const isPast = 
      (status === "received") ||
      (status === "preparing" && currentStatus === "delivering");

    return {
      isActive,
      isPast,
      isComplete: isPast,
    };
  };

  const statuses: { key: OrderStatus; label: string; icon: any; time: string }[] = [
    { key: "received", label: "Pedido Recebido", icon: Package, time: "Agora" },
    { key: "preparing", label: "Preparando", icon: Clock, time: "~5 min" },
    { key: "delivering", label: "Em Rota", icon: Bike, time: "~15 min" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="mb-12 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-success/20 to-success/5 mb-4 animate-scale-in">
          <CheckCircle className="w-10 h-10 text-[hsl(var(--success))]" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent mb-4">
          Pedido Confirmado!
        </h1>
        <div className="inline-block backdrop-blur-sm bg-white/60 dark:bg-black/60 px-6 py-3 rounded-2xl border border-primary/20 shadow-lg">
          <p className="text-sm text-muted-foreground mb-1">Número do Pedido</p>
          <p className="text-2xl font-mono font-bold text-primary">{orderNumber}</p>
        </div>
      </div>

      <div className="relative mb-16 animate-fade-in" style={{ animationDelay: '200ms' }}>
        {/* Progress Line Background */}
        <div className="absolute top-8 left-0 right-0 h-2 bg-muted/30 rounded-full overflow-hidden">
          {/* Animated Progress */}
          <div 
            className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary/80 transition-all duration-1000 ease-out relative"
            style={{
              width: currentStatus === "received" ? "5%" : currentStatus === "preparing" ? "50%" : "100%"
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </div>
        </div>

        {/* Status Points */}
        <div className="relative flex justify-between items-start">
          {statuses.map((status, index) => {
            const { isActive, isPast, isComplete } = getStatusInfo(status.key);
            const Icon = status.icon;

            return (
              <div 
                key={status.key} 
                className="flex flex-col items-center flex-1 animate-fade-in"
                style={{ animationDelay: `${300 + index * 100}ms` }}
              >
                {/* Icon Circle */}
                <div
                  className={`
                    relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center
                    transition-all duration-500 
                    ${isComplete 
                      ? 'bg-gradient-to-br from-primary to-primary/80 shadow-[0_0_20px_rgba(220,38,38,0.3)]' 
                      : isActive 
                        ? 'bg-gradient-to-br from-primary/80 to-primary/60 animate-pulse shadow-lg' 
                        : 'bg-gradient-to-br from-muted to-muted/80'
                    }
                  `}
                >
                  {status.key === "delivering" && isActive ? (
                    <Bike className={`w-8 h-8 md:w-10 md:h-10 ${isComplete || isActive ? 'text-primary-foreground' : 'text-muted-foreground'} animate-bounce`} />
                  ) : (
                    <Icon className={`w-8 h-8 md:w-10 md:h-10 ${isComplete || isActive ? 'text-primary-foreground' : 'text-muted-foreground'} transition-all`} />
                  )}
                  
                  {isComplete && (
                    <div className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-[hsl(var(--success))] to-[hsl(var(--success))]/80 rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Label */}
                <div className="mt-4 text-center">
                  <p className={`font-bold text-sm md:text-base transition-colors ${isComplete || isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {status.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{status.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Message */}
      <div className="text-center backdrop-blur-sm bg-gradient-to-br from-accent/50 to-primary/5 rounded-2xl p-6 border border-primary/20 shadow-lg animate-fade-in" style={{ animationDelay: '500ms' }}>
        <p className="text-lg font-semibold text-card-foreground">
          {currentStatus === "received" && "Seu pedido foi recebido com sucesso!"}
          {currentStatus === "preparing" && "Seu pedido está sendo preparado com carinho!"}
          {currentStatus === "delivering" && "Pedido saiu para entrega! Aguarde a chegada!"}
        </p>
      </div>
    </div>
  );
};
