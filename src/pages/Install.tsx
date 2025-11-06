import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Smartphone, Download, Check } from "lucide-react";
import { Header } from "@/components/Header";

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/10">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <div className="mb-6">
              <Smartphone className="w-24 h-24 mx-auto text-primary" />
            </div>
            
            <h1 className="text-3xl font-bold mb-4">
              Instale o Gamatauri no seu celular
            </h1>
            
            <p className="text-muted-foreground mb-8">
              Acesse mais rápido, funcione offline e receba notificações de seus pedidos
            </p>

            {isInstalled ? (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <Check className="w-6 h-6" />
                <span className="text-lg font-semibold">App já instalado!</span>
              </div>
            ) : deferredPrompt ? (
              <Button onClick={handleInstall} size="lg" className="gap-2">
                <Download className="w-5 h-5" />
                Instalar App
              </Button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Para instalar manualmente:
                </p>
                <ul className="text-sm text-left space-y-2 max-w-md mx-auto">
                  <li>• <strong>Android:</strong> Menu → Adicionar à tela inicial</li>
                  <li>• <strong>iPhone:</strong> Compartilhar → Adicionar à Tela de Início</li>
                </ul>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Install;
