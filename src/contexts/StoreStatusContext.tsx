import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StoreStatus {
  isOpen: boolean;
  closedMessage: string;
  closedReason: string | null;
}

interface StoreSettings {
  isRaining: boolean;
  openingTime: string;
  closingTime: string;
  maxDeliveryRadiusKm: number;
  minDeliveryFee: number;
  feePerKm: number;
  rainFeePerKm: number;
}

interface StoreStatusContextType {
  storeStatus: StoreStatus;
  storeSettings: StoreSettings;
  isLoading: boolean;
}

const defaultSettings: StoreSettings = {
  isRaining: false,
  openingTime: "10:00:00",
  closingTime: "23:00:00",
  maxDeliveryRadiusKm: 5,
  minDeliveryFee: 3,
  feePerKm: 3,
  rainFeePerKm: 5,
};

const StoreStatusContext = createContext<StoreStatusContextType | undefined>(undefined);

export const StoreStatusProvider = ({ children }: { children: ReactNode }) => {
  const [storeStatus, setStoreStatus] = useState<StoreStatus>({
    isOpen: true,
    closedMessage: "Estamos temporariamente fechados",
    closedReason: null,
  });
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial store status and settings
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

          // Mapear campos do banco para interface (com fallback para defaults)
          setStoreSettings({
            isRaining: (data as any).is_raining ?? defaultSettings.isRaining,
            openingTime: (data as any).opening_time ?? defaultSettings.openingTime,
            closingTime: (data as any).closing_time ?? defaultSettings.closingTime,
            maxDeliveryRadiusKm: (data as any).max_delivery_radius_km ?? defaultSettings.maxDeliveryRadiusKm,
            minDeliveryFee: (data as any).min_delivery_fee ?? defaultSettings.minDeliveryFee,
            feePerKm: (data as any).fee_per_km ?? defaultSettings.feePerKm,
            rainFeePerKm: (data as any).rain_fee_per_km ?? defaultSettings.rainFeePerKm,
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
          const newData = payload.new as any;

          setStoreStatus({
            isOpen: newData.is_open,
            closedMessage: newData.closed_message || "Estamos temporariamente fechados",
            closedReason: newData.closed_reason,
          });

          setStoreSettings({
            isRaining: newData.is_raining ?? defaultSettings.isRaining,
            openingTime: newData.opening_time ?? defaultSettings.openingTime,
            closingTime: newData.closing_time ?? defaultSettings.closingTime,
            maxDeliveryRadiusKm: newData.max_delivery_radius_km ?? defaultSettings.maxDeliveryRadiusKm,
            minDeliveryFee: newData.min_delivery_fee ?? defaultSettings.minDeliveryFee,
            feePerKm: newData.fee_per_km ?? defaultSettings.feePerKm,
            rainFeePerKm: newData.rain_fee_per_km ?? defaultSettings.rainFeePerKm,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <StoreStatusContext.Provider value={{ storeStatus, storeSettings, isLoading }}>
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

// Hook separado para acessar apenas as configurações
export const useStoreSettings = () => {
  const { storeSettings, isLoading } = useStoreStatus();
  return { storeSettings, isLoading };
};
