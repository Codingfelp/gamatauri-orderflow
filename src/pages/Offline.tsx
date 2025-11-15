import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/Header';

const Offline = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-muted rounded-full">
              <WifiOff className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold mb-3">Você está offline</h1>
          
          <p className="text-muted-foreground mb-6">
            Parece que você está sem conexão com a internet. Verifique sua conexão e tente novamente.
          </p>

          <div className="space-y-3 mb-6">
            <div className="p-3 bg-muted/50 rounded-lg text-sm text-left">
              <p className="font-medium mb-1">💡 Dica:</p>
              <p className="text-muted-foreground">
                Seu carrinho foi salvo e estará aqui quando você voltar online!
              </p>
            </div>
          </div>

          <Button onClick={handleRefresh} className="w-full" size="lg">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            Conecte-se à internet para continuar navegando e fazendo pedidos
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Offline;
