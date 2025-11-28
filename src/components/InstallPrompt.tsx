import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const PROMPT_DISMISSED_KEY = 'install-prompt-dismissed';
const VISIT_COUNT_KEY = 'visit-count';

export const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true;
    
    if (isStandalone) return;

    // Check if already dismissed permanently
    const dismissed = localStorage.getItem(PROMPT_DISMISSED_KEY);
    if (dismissed) return;

    // Track visits
    const visitCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0');
    localStorage.setItem(VISIT_COUNT_KEY, (visitCount + 1).toString());

    // Show after 3 visits or 2 minutes of use
    const shouldShow = visitCount >= 2;
    
    if (shouldShow) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 120000); // 2 minutes
    }

    // Listen for install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (shouldShow) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback: redirect to install page
      window.location.href = '/install';
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  const handleDismissPermanently = () => {
    localStorage.setItem(PROMPT_DISMISSED_KEY, 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 p-4 shadow-lg border-primary/20 bg-card/95 backdrop-blur-sm animate-in slide-in-from-bottom-5">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-muted rounded-full transition-colors"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Instalar Gamatauri</h3>
          <p className="text-xs text-muted-foreground">
            Adicione à tela inicial para pedidos mais rápidos e notificações em tempo real!
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleInstall}
          size="sm"
          className="flex-1"
        >
          Instalar
        </Button>
        <Button
          onClick={handleDismissPermanently}
          variant="ghost"
          size="sm"
        >
          Não
        </Button>
      </div>
    </Card>
  );
};
