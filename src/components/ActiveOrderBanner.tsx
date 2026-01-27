import { useState, useEffect } from "react";
import { useActiveOrder } from "@/contexts/ActiveOrderContext";
import { Clock, Package, CheckCircle, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrderTimeline } from "@/components/OrderTimeline";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ActiveOrderBanner = () => {
  const { activeOrder, clearActiveOrder } = useActiveOrder();
  const [elapsedTime, setElapsedTime] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!activeOrder) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const created = new Date(activeOrder.createdAt).getTime();
      const diff = now - created;

      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);

      if (hours > 0) {
        setElapsedTime(`${hours}h ${minutes % 60}min`);
      } else {
        setElapsedTime(`${minutes} min`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [activeOrder]);

  useEffect(() => {
    if (activeOrder) {
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 500);
    }
  }, [activeOrder?.status]);

  const markAsDelivered = async () => {
    if (!activeOrder) return;

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          order_status: "delivered",
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeOrder.orderId);

      if (error) throw error;

      toast.success("Pedido entregue!");
      setShowDetails(false);

      // Clear immediately after successful update - don't wait for realtime
      clearActiveOrder();
    } catch (error) {
      console.error("Error marking as delivered:", error);
      toast.error("Erro ao marcar pedido como entregue");
    }
  };

  if (!activeOrder) return null;

  const getStatusInfo = () => {
    switch (activeOrder.status) {
      case "preparing":
        return { label: "Preparando Pedido", icon: Package, color: "text-white" };
      case "in_route":
        return { label: "Saiu para Entrega", icon: Package, color: "text-white" };
      case "delivered":
        return { label: "Entregue", icon: CheckCircle, color: "text-white" };
      case "cancelled":
        return { label: "Cancelado", icon: X, color: "text-white" };
      default:
        return { label: "Processando", icon: Package, color: "text-white" };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const bannerBgColor = activeOrder.status === "cancelled" ? "bg-destructive/90" : "bg-primary/90";

  return (
    <>
      <div
        className={`sticky top-16 z-50 w-full ${bannerBgColor} backdrop-blur-sm shadow-lg transition-all duration-500 ${isTransitioning ? "scale-[1.02]" : "scale-100"}`}
      >
        <div className="container mx-auto px-3 py-2">
          {/* Mobile: Two lines layout */}
          <div className="flex flex-col gap-2 sm:hidden">
            {/* Line 1: Order number + Time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse flex-shrink-0" />
                <span className="text-white font-bold text-sm">#{activeOrder.orderNumber}</span>
              </div>
              <div className="flex items-center gap-1 text-white/90">
                <Clock className="w-3 h-3" />
                <span className="text-xs font-medium">{elapsedTime}</span>
              </div>
            </div>

            {/* Line 2: Status + Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/90">
                <StatusIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{statusInfo.label}</span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(true)}
                  className="text-white hover:bg-white/20 h-10 px-3 text-xs min-w-[80px]"
                >
                  Detalhes
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearActiveOrder}
                  className="text-white hover:bg-white/20 h-10 w-10"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Desktop: Single line layout */}
          <div className="hidden sm:flex items-center justify-between h-12 gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white font-bold text-base whitespace-nowrap">
                  Pedido #{activeOrder.orderNumber}
                </span>
              </div>

              <div className="flex items-center gap-2 text-white/90">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{elapsedTime}</span>
              </div>

              <div className="flex items-center gap-2 text-white/90">
                <StatusIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{statusInfo.label}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(true)}
                className="text-white hover:bg-white/20 h-10 text-sm"
              >
                Ver Detalhes
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={clearActiveOrder}
                className="text-white hover:bg-white/20 h-10 w-10"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
          </DialogHeader>
          <OrderTimeline
            orderNumber={activeOrder.orderNumber}
            orderId={activeOrder.orderId}
            createdAt={activeOrder.createdAt}
          />

          {activeOrder.status !== "delivered" && activeOrder.status !== "cancelled" && (
            <div className="flex justify-center gap-4 mt-6 pt-6 border-t">
              <Button
                onClick={markAsDelivered}
                size="lg"
                className="px-8 h-14 text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Confirmar Entrega
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
