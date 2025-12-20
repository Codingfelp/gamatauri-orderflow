import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { XCircle, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrderItem {
  product_name: string;
  quantity: number;
  product_price: number;
  subtotal: number;
}

interface CancelledOrderDetails {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

interface CancelledOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderDetails: CancelledOrderDetails | null;
}

export const CancelledOrderModal = ({
  isOpen,
  onClose,
  orderDetails,
}: CancelledOrderModalProps) => {
  if (!orderDetails) return null;

  const formattedDate = format(
    new Date(orderDetails.createdAt),
    "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
    { locale: ptBR }
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <DialogTitle className="text-xl">Pedido Cancelado</DialogTitle>
          <DialogDescription className="text-base">
            Lamentamos informar que seu pedido foi cancelado. Pedimos desculpas
            pelo inconveniente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Pedido</span>
              <span className="font-semibold">#{orderDetails.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Data</span>
              <span className="text-sm">{formattedDate}</span>
            </div>
          </div>

          {/* Items list */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">
              Itens do pedido
            </h4>
            <div className="bg-muted/30 rounded-lg divide-y divide-border/50">
              {orderDetails.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3"
                >
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity}x R$ {item.product_price.toFixed(2)}
                    </p>
                  </div>
                  <span className="text-sm font-medium">
                    R$ {item.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="font-medium">Total</span>
            <span className="text-lg font-bold text-primary">
              R$ {orderDetails.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
