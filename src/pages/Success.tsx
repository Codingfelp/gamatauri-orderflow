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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-accent/20 p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-card-foreground mb-4">
          Pedido Confirmado!
        </h1>
        
        <p className="text-muted-foreground mb-2">
          Seu pedido foi recebido com sucesso e está sendo preparado.
        </p>
        
        {orderId && (
          <p className="text-sm text-muted-foreground mb-6">
            Número do pedido: <span className="font-mono font-semibold">{orderId.slice(0, 8)}</span>
          </p>
        )}
        
        <div className="bg-accent/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-muted-foreground">
            Você receberá atualizações sobre seu pedido em breve.
          </p>
        </div>
        
        <Button
          onClick={() => navigate('/')}
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Fazer Novo Pedido
        </Button>
      </Card>
    </div>
  );
};

export default Success;