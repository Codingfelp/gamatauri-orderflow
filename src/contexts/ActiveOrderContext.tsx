import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type OrderStatus = "preparing" | "in_route" | "delivered" | "cancelled";

interface ActiveOrder {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
}

interface ActiveOrderContextType {
  activeOrder: ActiveOrder | null;
  setActiveOrder: (order: ActiveOrder) => void;
  clearActiveOrder: () => void;
}

const ActiveOrderContext = createContext<ActiveOrderContextType | undefined>(undefined);

export const ActiveOrderProvider = ({ children }: { children: ReactNode }) => {
  const [activeOrder, setActiveOrderState] = useState<ActiveOrder | null>(() => {
    const stored = localStorage.getItem("activeOrder");
    return stored ? JSON.parse(stored) : null;
  });

  const setActiveOrder = (order: ActiveOrder) => {
    setActiveOrderState(order);
    localStorage.setItem("activeOrder", JSON.stringify(order));
  };

  const clearActiveOrder = () => {
    setActiveOrderState(null);
    localStorage.removeItem("activeOrder");
  };

  // Subscribe to realtime updates for the active order
  useEffect(() => {
    if (!activeOrder?.orderId) return;

    const channel = supabase
      .channel(`order-${activeOrder.orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${activeOrder.orderId}`,
        },
        (payload) => {
          console.log("Order status updated via Realtime:", payload);
          const newStatus = payload.new.order_status as OrderStatus;
          
          // Update active order with new status
          setActiveOrder({
            ...activeOrder,
            status: newStatus,
          });

          // Auto-clear if delivered
          if (newStatus === "delivered") {
            setTimeout(() => {
              clearActiveOrder();
            }, 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrder?.orderId]);

  return (
    <ActiveOrderContext.Provider value={{ activeOrder, setActiveOrder, clearActiveOrder }}>
      {children}
    </ActiveOrderContext.Provider>
  );
};

export const useActiveOrder = () => {
  const context = useContext(ActiveOrderContext);
  if (!context) {
    throw new Error("useActiveOrder must be used within ActiveOrderProvider");
  }
  return context;
};
