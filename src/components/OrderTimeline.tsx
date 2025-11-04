import { useEffect, useState } from "react";
import { CheckCircle, Clock, Bike, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface OrderTimelineProps {
  orderNumber: string;
  orderId: string;
  createdAt: string;
}

type OrderStatus = "received" | "preparing" | "delivering" | "delivered";

export const OrderTimeline = ({ orderNumber, orderId, createdAt }: OrderTimelineProps) => {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>("received");
  const [confettiShown, setConfettiShown] = useState(false);
  const [, setTick] = useState(0);

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

  // Atualizar a cada minuto para mudança de cor das bordas
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const mapDbStatusToUI = (dbStatus: string): OrderStatus => {
    console.log('Mapping DB status to UI:', dbStatus);
    
    switch (dbStatus) {
      // Novo status padrão do banco
      case 'preparing':
        return 'preparing';
      
      // Em rota de entrega
      case 'in_route':
        return 'delivering';
      
      // Entregue
      case 'delivered':
        return 'delivered';
      
      // Cancelado (mostrar como received por enquanto)
      case 'cancelled':
        return 'received';
      
      // Status antigos (fallback para compatibilidade)
      case 'separacao':
      case 'preparando':
        return 'preparing';
      
      case 'saiu_entrega':
      case 'rota':
      case 'em_rota':
        return 'delivering';
      
      case 'entregue':
        return 'delivered';
      
      case 'cancelado':
        return 'received';
      
      default:
        console.warn(`Status desconhecido: "${dbStatus}" - usando 'received' como padrão`);
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

  const getBorderColor = (statusKey: OrderStatus, createdAtTime: string) => {
    if (currentStatus !== statusKey) return 'transparent';
    
    const now = Date.now();
    const created = new Date(createdAtTime).getTime();
    const elapsed = Math.floor((now - created) / 1000 / 60);
    
    if (statusKey === 'preparing') {
      if (elapsed < 5) return '#10b981';
      if (elapsed < 8) return '#f59e0b';
      return '#ef4444';
    }
    
    if (statusKey === 'delivering') {
      if (elapsed < 20) return '#10b981';
      if (elapsed < 30) return '#f59e0b';
      return '#ef4444';
    }
    
    return '#10b981';
  };

  const getStatusInfo = (status: OrderStatus) => {
    const isActive = currentStatus === status;
    const isPast = 
      (status === "received") ||
      (status === "preparing" && (currentStatus === "delivering" || currentStatus === "delivered")) ||
      (status === "delivering" && currentStatus === "delivered");

    return {
      isActive,
      isPast,
      isComplete: isPast,
    };
  };

  const statuses: { key: OrderStatus; label: string; icon: any; time: string }[] = [
    { key: "received", label: "Pedido Recebido", icon: Package, time: "Agora" },
    { key: "preparing", label: "Preparando", icon: Clock, time: "~10 min" },
    { key: "delivering", label: "Em Rota", icon: Bike, time: "~35 min" },
    { key: "delivered", label: "Entregue", icon: CheckCircle, time: "Concluído" },
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
            className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary/80 transition-all duration-1000 ease-out"
            style={{
              width: currentStatus === "received" ? "5%" 
                : currentStatus === "preparing" ? "33%" 
                : currentStatus === "delivering" ? "66%" 
                : "100%"
            }}
          />
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
                  className="relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-500"
                  style={{
                    background: isComplete 
                      ? 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%)'
                      : isActive 
                        ? 'linear-gradient(135deg, hsl(var(--primary) / 0.8) 0%, hsl(var(--primary) / 0.6) 100%)'
                        : 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted) / 0.8) 100%)',
                    boxShadow: isActive 
                      ? `0 0 0 4px ${getBorderColor(status.key, createdAt)}, 0 4px 12px rgba(0,0,0,0.15)`
                      : isComplete 
                        ? '0 0 20px rgba(220, 38, 38, 0.3)'
                        : 'none'
                  }}
                >
                  {isActive && (
                    <div 
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ 
                        border: `3px solid ${getBorderColor(status.key, createdAt)}`,
                        opacity: 0.5 
                      }}
                    />
                  )}
                  
                  {status.key === "delivering" && isActive ? (
                    <Bike className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground animate-bounce" />
                  ) : (
                    <Icon className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground" />
                  )}
                  
                  {isComplete && (
                    <div className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-[hsl(var(--success))] to-[hsl(var(--success))]/80 rounded-full flex items-center justify-center shadow-lg">
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
          {currentStatus === "delivered" && "Pedido entregue com sucesso! Obrigado pela preferência! 🎉"}
        </p>
      </div>
    </div>
  );
};
