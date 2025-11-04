-- Remover constraint antigo primeiro
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_order_status_check;

-- Agora atualizar os status existentes
UPDATE orders SET order_status = 'preparing' 
WHERE order_status IN ('separacao', 'preparando');

UPDATE orders SET order_status = 'in_route' 
WHERE order_status IN ('saiu_entrega', 'rota', 'em_rota');

UPDATE orders SET order_status = 'delivered' 
WHERE order_status = 'entregue';

UPDATE orders SET order_status = 'cancelled' 
WHERE order_status = 'cancelado';

-- Adicionar novo constraint com os status padronizados
ALTER TABLE orders 
ADD CONSTRAINT orders_order_status_check 
CHECK (order_status IN ('preparing', 'in_route', 'delivered', 'cancelled'));