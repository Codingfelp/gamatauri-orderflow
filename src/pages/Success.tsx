import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const Success = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;

  useEffect(() => {
    if (!orderId) {
      navigate('/');
    }
  }, [orderId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/10 to-primary/5 p-4">
      <Card className="max-w-lg w-full p-10 text-center shadow-2xl border-2 border-primary/20 animate-scale-in">
        <div className="flex justify-center mb-8">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center animate-pulse shadow-xl">
            <CheckCircle className="w-16 h-16 text-primary animate-bounce" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4 animate-fade-in">
          Pedido Confirmado! 🎉
        </h1>
        
        <p className="text-lg text-muted-foreground mb-3">
          Seu pedido foi recebido com sucesso e está sendo preparado.
        </p>
        
        {orderId && (
          <div className="mb-8 p-4 bg-accent/30 rounded-xl border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">Número do pedido</p>
            <p className="text-2xl font-mono font-bold text-primary">{orderId.slice(0, 8)}</p>
          </div>
        )}
        
        <div className="bg-gradient-to-br from-accent/50 to-primary/5 rounded-xl p-6 mb-8 border border-primary/10">
          <h3 className="font-bold text-lg mb-4 text-card-foreground">Status do Pedido</h3>
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Pedido recebido</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
              <span className="text-sm text-muted-foreground">Preparando pedido</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
              <span className="text-sm text-muted-foreground">Em rota de entrega</span>
            </div>
          </div>
        </div>
        
        <Button
          onClick={() => navigate('/')}
          size="lg"
          className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
        >
          Fazer Novo Pedido
        </Button>
      </Card>
    </div>
  );
};

export default Success;