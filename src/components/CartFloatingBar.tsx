 import { ShoppingBag } from "lucide-react";
 import { useIsMobile } from "@/hooks/use-mobile";
 import { useBundles } from "@/hooks/useBundles";
 
 interface CartItem {
   id: string;
   name: string;
   price: number;
   quantity: number;
 }
 
 interface CartFloatingBarProps {
   items: CartItem[];
   onClick: () => void;
 }
 
 export const CartFloatingBar = ({ items, onClick }: CartFloatingBarProps) => {
   const isMobile = useIsMobile();
   const { getTotalBundleDiscount } = useBundles();
   
   // Calcular totais
   const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
   const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
   const bundleDiscount = getTotalBundleDiscount(items);
   const total = subtotal - bundleDiscount;
   
   // Não mostrar se carrinho vazio ou em desktop
   if (!isMobile || totalItems === 0) return null;
   
   return (
     <button
       onClick={onClick}
       className="fixed bottom-20 left-4 right-4 z-50 flex items-center justify-between bg-destructive text-white px-4 py-3 rounded-2xl shadow-xl hover:bg-destructive/90 active:scale-[0.98] transition-all"
       style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
     >
       <div className="flex items-center gap-3">
         <div className="relative">
           <ShoppingBag className="w-5 h-5" />
           <span className="absolute -top-2 -right-2 bg-white text-destructive text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
             {totalItems}
           </span>
         </div>
         <span className="font-semibold text-sm">Ver Carrinho</span>
       </div>
       
       <span className="font-bold text-base">R$ {total.toFixed(2)}</span>
     </button>
   );
 };