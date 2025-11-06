import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const OnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
      
      // Notificar usuário que voltou online e tentar sincronizar
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
          return (registration as any).sync.register('sync-orders');
        }).catch(() => {
          // Sync não disponível, ignorar
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Mostrar alert se já estiver offline
    if (!navigator.onLine) {
      setShowOfflineAlert(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineAlert && isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top">
      <Alert 
        variant={isOnline ? "default" : "destructive"}
        className="rounded-none border-x-0 border-t-0"
      >
        <div className="flex items-center gap-3">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4" />
              <AlertDescription className="font-medium">
                ✓ Conexão restabelecida! Sincronizando...
              </AlertDescription>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <AlertDescription className="font-medium">
                Você está offline. Seus dados serão salvos e sincronizados quando reconectar.
              </AlertDescription>
            </>
          )}
        </div>
      </Alert>
    </div>
  );
};
