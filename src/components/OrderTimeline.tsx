import { useEffect, useState } from "react";
import { CheckCircle, Clock, Bike } from "lucide-react";

interface OrderTimelineProps {
  orderNumber: string;
}

type OrderStatus = "received" | "preparing" | "delivering";

export const OrderTimeline = ({ orderNumber }: OrderTimelineProps) => {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>("received");
  const [confettiShown, setConfettiShown] = useState(false);

  useEffect(() => {
    // Simulate status progression
    const timer1 = setTimeout(() => setCurrentStatus("preparing"), 2000);
    const timer2 = setTimeout(() => setCurrentStatus("delivering"), 4000);
    
    // Show confetti on mount
    if (!confettiShown) {
      setConfettiShown(true);
      createConfetti();
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [confettiShown]);

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
    { key: "received", label: "Pedido Recebido", icon: CheckCircle, time: "Agora" },
    { key: "preparing", label: "Preparando", icon: Clock, time: "~5 min" },
    { key: "delivering", label: "Em Rota", icon: Bike, time: "~15 min" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4 animate-fade-in">
          🎉 Pedido Confirmado!
        </h1>
        <div className="inline-block bg-gradient-to-br from-primary/10 to-primary/5 px-6 py-3 rounded-2xl border-2 border-primary/30 shadow-lg">
          <p className="text-sm text-muted-foreground mb-1">Número do Pedido</p>
          <p className="text-2xl font-mono font-bold text-primary">{orderNumber}</p>
        </div>
      </div>

      <div className="relative mb-16">
        {/* Progress Line */}
        <div className="absolute top-8 left-0 right-0 h-1 bg-muted">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-1000 ease-out"
            style={{
              width: currentStatus === "received" ? "0%" : currentStatus === "preparing" ? "50%" : "100%"
            }}
          />
        </div>

        {/* Status Points */}
        <div className="relative flex justify-between items-start">
          {statuses.map((status, index) => {
            const { isActive, isPast, isComplete } = getStatusInfo(status.key);
            const Icon = status.icon;

            return (
              <div key={status.key} className="flex flex-col items-center flex-1">
                {/* Icon Circle */}
                <div
                  className={`
                    relative z-10 w-16 h-16 rounded-full flex items-center justify-center
                    transition-all duration-500 shadow-lg
                    ${isComplete ? 'bg-primary' : isActive ? 'bg-primary/80 animate-pulse' : 'bg-muted'}
                  `}
                >
                  {status.key === "delivering" && currentStatus === "delivering" ? (
                    <Bike className={`w-8 h-8 ${isComplete || isActive ? 'text-primary-foreground' : 'text-muted-foreground'} animate-bounce`} />
                  ) : (
                    <Icon className={`w-8 h-8 ${isComplete || isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  )}
                  
                  {isComplete && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
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
      <div className="text-center bg-gradient-to-br from-accent/50 to-primary/5 rounded-2xl p-6 border border-primary/10">
        <p className="text-lg font-semibold text-card-foreground">
          {currentStatus === "received" && "📦 Seu pedido foi recebido com sucesso!"}
          {currentStatus === "preparing" && "👨‍🍳 Seu pedido está sendo preparado com carinho!"}
          {currentStatus === "delivering" && "🏍️ Pedido saiu para entrega! Aguarde a chegada!"}
        </p>
      </div>
    </div>
  );
};
