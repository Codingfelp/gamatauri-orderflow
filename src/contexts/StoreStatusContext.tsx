import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchStoreStatus, type StoreStatusData } from "@/services/api/store";

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

  const loadStoreStatus = async () => {
    try {
      const data: StoreStatusData = await fetchStoreStatus();

      setStoreStatus({
        isOpen: data.is_open,
        closedMessage: data.message || "Estamos temporariamente fechados",
        closedReason: null,
      });

      setStoreSettings({
        isRaining: data.is_raining ?? false,
        openingTime: data.opening_time ?? defaultSettings.openingTime,
        closingTime: data.closing_time ?? defaultSettings.closingTime,
        maxDeliveryRadiusKm: defaultSettings.maxDeliveryRadiusKm,
        minDeliveryFee: defaultSettings.minDeliveryFee,
        feePerKm: defaultSettings.feePerKm,
        rainFeePerKm: defaultSettings.rainFeePerKm,
      });
    } catch (error) {
      console.error("Error fetching store status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStoreStatus();

    // Poll every 60 seconds
    const poll = setInterval(loadStoreStatus, 60_000);
    return () => clearInterval(poll);
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

export const useStoreSettings = () => {
  const { storeSettings, isLoading } = useStoreStatus();
  return { storeSettings, isLoading };
};
