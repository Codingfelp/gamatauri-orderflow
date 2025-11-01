import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { OrderTimeline } from "@/components/OrderTimeline";

const Success = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderNumber = location.state?.orderNumber;
  const orderId = location.state?.orderId;

  useEffect(() => {
    if (!orderNumber && !orderId) {
      navigate('/');
    }
  }, [orderNumber, orderId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/10 to-primary/5 p-4 py-20">
      <div className="max-w-5xl w-full">
        {orderNumber && orderId && <OrderTimeline orderNumber={orderNumber} orderId={orderId} />}
        
        <div className="mt-12 text-center">
          <Button
            onClick={() => navigate('/')}
            size="lg"
            className="px-12 h-14 text-lg font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            🛒 Fazer Novo Pedido
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Success;