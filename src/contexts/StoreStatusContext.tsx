import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StoreStatus {
  isOpen: boolean;
  closedMessage: string;
  closedReason: string | null;
}

interface StoreStatusContextType {
  storeStatus: StoreStatus;
  isLoading: boolean;
}

const StoreStatusContext = createContext<StoreStatusContextType | undefined>(undefined);

export const StoreStatusProvider = ({ children }: { children: ReactNode }) => {
  const [storeStatus, setStoreStatus] = useState<StoreStatus>({
    isOpen: true,
    closedMessage: "Estamos temporariamente fechados",
    closedReason: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial store status
  useEffect(() => {
    const fetchStoreStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("store_settings")
          .select("*")
          .limit(1)
          .single();

        if (error) {
          console.error("Error fetching store status:", error);
          return;
        }

        if (data) {
          setStoreStatus({
            isOpen: data.is_open,
            closedMessage: data.closed_message || "Estamos temporariamente fechados",
            closedReason: data.closed_reason,
          });
        }
      } catch (error) {
        console.error("Error fetching store status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreStatus();
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("store-status-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "store_settings",
        },
        (payload) => {
          console.log("Store status updated via Realtime:", payload);
          const newData = payload.new as {
            is_open: boolean;
            closed_message: string;
            closed_reason: string | null;
          };

          setStoreStatus({
            isOpen: newData.is_open,
            closedMessage: newData.closed_message || "Estamos temporariamente fechados",
            closedReason: newData.closed_reason,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <StoreStatusContext.Provider value={{ storeStatus, isLoading }}>
      {children}
    </StoreStatusContext.Provider>
  );
};

export const useStoreStatus = () => {
  const context = useContext(StoreStatusContext);
  if (!context) {
    throw new Error("useStoreStatus must be used within StoreStatusProvider");
  }
  return context;
};
