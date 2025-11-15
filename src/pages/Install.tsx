import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Smartphone, Download, Check, Zap, Bell, Wifi, ShoppingBag } from "lucide-react";
import { Header } from "@/components/Header";

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop'>('desktop');

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    }

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const benefits = [
    { icon: Zap, title: "Mais Rápido", description: "Carregamento instantâneo" },
    { icon: Bell, title: "Notificações", description: "Acompanhe pedidos em tempo real" },
    { icon: Wifi, title: "Offline", description: "Funciona sem internet" },
    { icon: ShoppingBag, title: "Acesso Direto", description: "Ícone na tela inicial" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/10">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 text-center">
              <Smartphone className="w-20 h-20 md:w-24 md:h-24 mx-auto text-primary mb-6" />
              <h1 className="text-2xl md:text-3xl font-bold mb-4">Instale o Gamatauri</h1>
              <p className="text-muted-foreground text-sm md:text-base mb-6">
                Transforme sua experiência com nosso app instalável
              </p>
              {isInstalled ? (
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/10 text-green-600 rounded-lg">
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">App instalado!</span>
                </div>
              ) : deferredPrompt ? (
                <Button onClick={handleInstall} size="lg" className="gap-2">
                  <Download className="w-5 h-5" />
                  Instalar Agora
                </Button>
              ) : null}
            </div>
            <div className="p-8">
              <h2 className="text-xl font-bold mb-6 text-center">Benefícios</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {benefits.map((b) => (
                  <div key={b.title} className="flex gap-3 p-4 rounded-lg bg-muted/30">
                    <div className="p-2 bg-primary/10 rounded-lg"><b.icon className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1">{b.title}</h3>
                      <p className="text-xs text-muted-foreground">{b.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              {!deferredPrompt && !isInstalled && (
                <div className="pt-6 border-t">
                  <h3 className="font-semibold text-center mb-4">Instalação Manual</h3>
                  {platform === 'android' && (
                    <div className="bg-accent/50 rounded-lg p-4">
                      <p className="font-semibold mb-2">📱 Android</p>
                      <ol className="text-sm space-y-1 ml-4">
                        <li>1. Menu (⋮) → Adicionar à tela inicial</li>
                      </ol>
                    </div>
                  )}
                  {platform === 'ios' && (
                    <div className="bg-accent/50 rounded-lg p-4">
                      <p className="font-semibold mb-2">🍎 iPhone</p>
                      <ol className="text-sm space-y-1 ml-4">
                        <li>1. Compartilhar (⬆️) → Adicionar à Tela de Início</li>
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Install;
