import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { toast } from "sonner";

createRoot(document.getElementById("root")!).render(<App />);

// ========================================
// SERVICE WORKER REGISTRATION
// ========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✓ Service Worker registrado:', registration.scope);
        
        // Verificar atualizações a cada 1 hora
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
        
        // Detectar nova versão disponível
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nova versão disponível
                toast.info('Nova versão disponível!', {
                  description: 'Clique para atualizar',
                  action: {
                    label: 'Atualizar',
                    onClick: () => {
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                      window.location.reload();
                    }
                  },
                  duration: Infinity,
                });
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
        window.location.reload();
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
