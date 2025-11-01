import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

export const Cart = ({ items, onUpdateQuantity, onRemove, onCheckout }: CartProps) => {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          size="lg" 
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl hover:shadow-xl hover:scale-110 transition-all z-50"
        >
          <ShoppingCart className="w-7 h-7" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-sm w-7 h-7 rounded-full flex items-center justify-center font-bold shadow-lg animate-in">
              {itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="border-b pb-4 bg-gradient-to-r from-primary/5 to-transparent rounded-t-lg">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-bold">🛒 Seu Carrinho</SheetTitle>
            {itemCount > 0 && (
              <span className="text-sm font-medium text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
                {itemCount} {itemCount === 1 ? 'item' : 'itens'}
              </span>
            )}
          </div>
        </SheetHeader>
        
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
            <div className="relative mb-6">
              <ShoppingCart className="w-24 h-24 opacity-20" />
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl">
                😊
              </span>
            </div>
            <p className="text-xl font-semibold mb-2 text-card-foreground">Seu carrinho está vazio</p>
            <p className="text-sm text-muted-foreground">Adicione produtos para começar</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 -mx-6 px-6 my-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <Card 
                    key={item.id} 
                    className="p-4 border-l-4 border-l-primary hover:shadow-md transition-all hover:scale-[1.02] bg-gradient-to-r from-card to-accent/10"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-card-foreground">{item.name}</h4>
                        <p className="text-lg font-bold text-primary mt-1">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(item.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                        className="h-8 w-8"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="font-semibold min-w-[2rem] text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="h-8 w-8"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground ml-2">
                        R$ {item.price.toFixed(2)} cada
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
            
            <div className="border-t pt-4 space-y-4 bg-gradient-to-t from-accent/5 to-transparent -mx-6 px-6 pb-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-3xl font-bold text-primary animate-in slide-in-from-right">
                  R$ {total.toFixed(2)}
                </span>
              </div>
              <Button 
                onClick={onCheckout}
                size="lg" 
                className="w-full h-14 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                <span className="mr-2">✓</span>
                Finalizar Pedido
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};