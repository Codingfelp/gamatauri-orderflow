import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type OrderStatus = "preparing" | "in_route" | "delivered" | "cancelled";

interface OrderItem {
  product_name: string;
  quantity: number;
  product_price: number;
  subtotal: number;
}

interface CancelledOrderDetails {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

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
  cancelledOrderDetails: CancelledOrderDetails | null;
  clearCancelledOrder: () => void;
}

const ActiveOrderContext = createContext<ActiveOrderContextType | undefined>(undefined);

export const ActiveOrderProvider = ({ children }: { children: ReactNode }) => {
  const [activeOrder, setActiveOrderState] = useState<ActiveOrder | null>(() => {
    const stored = localStorage.getItem("activeOrder");
    return stored ? JSON.parse(stored) : null;
  });
  const [cancelledOrderDetails, setCancelledOrderDetails] = useState<CancelledOrderDetails | null>(null);

  const setActiveOrder = (order: ActiveOrder) => {
    setActiveOrderState(order);
    localStorage.setItem("activeOrder", JSON.stringify(order));
  };

  const clearActiveOrder = () => {
    setActiveOrderState(null);
    localStorage.removeItem("activeOrder");
  };

  const clearCancelledOrder = () => {
    setCancelledOrderDetails(null);
  };

  // Fetch order items when an order is cancelled
  const fetchCancelledOrderDetails = async (orderId: string) => {
    try {
      // Fetch order and its items
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError) {
        console.error("Error fetching cancelled order:", orderError);
        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (itemsError) {
        console.error("Error fetching order items:", itemsError);
        return;
      }

      setCancelledOrderDetails({
        orderId: orderData.id,
        orderNumber: orderData.external_order_number || orderId.slice(0, 8).toUpperCase(),
        totalAmount: orderData.total_amount,
        createdAt: orderData.created_at,
        items: itemsData || [],
      });
    } catch (error) {
      console.error("Error fetching cancelled order details:", error);
    }
  };

  // Map database status to canonical status
  const mapDbStatusToCanonical = (dbStatus: string): OrderStatus => {
    const normalized = dbStatus?.toLowerCase()?.trim() || 'preparing';
    
    console.log('[ActiveOrderContext] Mapping status:', { raw: dbStatus, normalized });
    
    // Cancelled statuses
    if (/(cancel|cancelad)/.test(normalized)) return 'cancelled';
    
    // Delivered statuses
    if (/(deliver|entreg|conclu|finaliz|closed)/.test(normalized)) return 'delivered';
    
    // In route statuses - CRITICAL: includes 'em_rota_entrega', 'shipping', 'shipped'
    if (/(rota|route|saiu|out_for_delivery|dispatch|delivering|pronto|ready|shipp|enviad)/.test(normalized)) {
      console.log('[ActiveOrderContext] Status mapped to in_route:', normalized);
      return 'in_route';
    }
    
    // Default to preparing
    return 'preparing';
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
          const rawStatus = payload.new.order_status as string;
          const newStatus = mapDbStatusToCanonical(rawStatus);
          
          console.log(`Status mapping: "${rawStatus}" -> "${newStatus}"`);
          
          // Handle cancelled orders
          if (newStatus === "cancelled") {
            fetchCancelledOrderDetails(activeOrder.orderId);
            clearActiveOrder();
            return;
          }

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
    <ActiveOrderContext.Provider value={{ 
      activeOrder, 
      setActiveOrder, 
      clearActiveOrder,
      cancelledOrderDetails,
      clearCancelledOrder 
    }}>
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
