import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { toast } from "sonner";

createRoot(document.getElementById("root")!).render(<App />);

// ========================================
// SERVICE WORKER REGISTRATION - Auto-update system
// ========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✓ Service Worker registrado:', registration.scope);
        
        // Verificar atualizações a cada 5 minutos
        const checkForUpdates = () => {
          registration.update().catch(console.error);
        };
        
        setInterval(checkForUpdates, 5 * 60 * 1000);
        
        // Verificar também quando a aba voltar a ficar visível
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            checkForUpdates();
          }
        });
        
        // Verificar ao reconectar à internet
        window.addEventListener('online', checkForUpdates);
        
        // Detectar nova versão disponível
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] Nova versão detectada, atualizando...');
                // Força atualização silenciosa
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch((error) => {
        console.warn('⚠ Service Worker falhou:', error);
      });
    
    // Recarregar quando novo SW assumir controle
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('[SW] Novo Service Worker ativo, recarregando...');
        window.location.reload();
      }
    });
    
    // Ouvir mensagens do Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        console.log('[SW] Atualizado para versão:', event.data.version);
      }
    });
  });
}

// ========================================
// PWA INSTALL PROMPT
// ========================================
let deferredPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Mostrar toast após 30 segundos se não instalado
  setTimeout(() => {
    if (deferredPrompt) {
      toast.info('Instalar Gamatauri no seu celular?', {
        description: 'Acesso rápido e funciona offline!',
        action: {
          label: 'Instalar',
          onClick: async () => {
            if (deferredPrompt) {
              deferredPrompt.prompt();
              const { outcome } = await deferredPrompt.userChoice;
              console.log(`Instalação: ${outcome}`);
              deferredPrompt = null;
            }
          }
        },
        duration: 10000,
      });
    }
  }, 30000);
});

// Detectar quando app é instalado
window.addEventListener('appinstalled', () => {
  console.log('✓ PWA instalado com sucesso!');
  deferredPrompt = null;
  toast.success('App instalado!', {
    description: 'Gamatauri está pronto para uso offline.'
  });
});
