export const shareProductWhatsApp = (product: { name: string; price: number; category?: string }) => {
  const baseUrl = window.location.origin;
  const productUrl = `${baseUrl}/`;
  
  const message = encodeURIComponent(
    `🛒 *${product.name}*\n` +
    `💰 R$ ${product.price.toFixed(2)}\n` +
    `🏷️ Categoria: ${product.category || 'Diversos'}\n\n` +
    `Compre agora em Gamatauri! ${productUrl}`
  );
  
  const whatsappUrl = `https://wa.me/?text=${message}`;
  window.open(whatsappUrl, '_blank');
};
