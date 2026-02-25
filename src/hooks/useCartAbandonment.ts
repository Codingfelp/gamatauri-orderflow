import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export const useCartAbandonment = (cart: CartItem[], userId?: string) => {
  const { toast } = useToast();

  useEffect(() => {
    let abandonmentTimer: NodeJS.Timeout;

    const handleVisibilityChange = async () => {
      if (document.hidden && cart.length > 0 && userId) {
        console.log('[CART] Usuário saiu com carrinho ativo:', cart.length, 'itens');
        
        // Salvar carrinho no localStorage para restaurar
        localStorage.setItem('zup-abandoned-cart', JSON.stringify({
          items: cart,
          abandonedAt: new Date().toISOString()
        }));

        // Agendar notificação para 30 minutos
        abandonmentTimer = setTimeout(async () => {
          await scheduleCartAbandonmentNotification(cart);
        }, 30 * 60 * 1000); // 30 minutos

      } else if (!document.hidden && abandonmentTimer) {
        // Usuário voltou, cancelar timer
        clearTimeout(abandonmentTimer);
        console.log('[CART] Usuário voltou, timer cancelado');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (abandonmentTimer) {
        clearTimeout(abandonmentTimer);
      }
    };
  }, [cart, userId]);
};

async function scheduleCartAbandonmentNotification(cart: CartItem[]) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    
    registration.showNotification('Seu carrinho está te esperando! 🛒', {
      body: `Você tem ${cart.length} produto(s) no carrinho. Finalize seu pedido!`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      data: {
        url: '/',
        cartItems: cart
      },
      requireInteraction: true
    } as any); // TypeScript strict mode workaround for actions
  }
}
