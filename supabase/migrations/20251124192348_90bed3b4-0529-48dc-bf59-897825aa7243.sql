-- ============================================
-- CORREÇÕES DE SEGURANÇA - RLS POLICIES
-- ============================================

-- 1. CRIAR FUNÇÃO HELPER PARA VERIFICAR ADMIN (se não existir)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- 2. CORRIGIR RLS - TABELA ORDERS
-- Remover política insegura que permite qualquer um ver todos os pedidos
DROP POLICY IF EXISTS "Qualquer um pode visualizar pedidos" ON orders;

-- Usuários autenticados veem apenas seus próprios pedidos
CREATE POLICY "Users can view own orders" ON orders
FOR SELECT
TO authenticated
USING (
  customer_phone = (SELECT phone FROM profiles WHERE user_id = auth.uid())
  OR customer_email = (SELECT email FROM profiles WHERE user_id = auth.uid())
);

-- Admins podem ver todos os pedidos
CREATE POLICY "Admins can view all orders" ON orders
FOR SELECT
TO authenticated
USING (is_admin());

-- 3. CORRIGIR RLS - TABELA ORDER_ITEMS
-- Remover política insegura que permite qualquer um ver todos os itens
DROP POLICY IF EXISTS "Qualquer um pode visualizar itens de pedido" ON order_items;

-- Usuários autenticados veem apenas itens dos seus pedidos
CREATE POLICY "Users can view own order items" ON order_items
FOR SELECT
TO authenticated
USING (
  order_id IN (
    SELECT id FROM orders
    WHERE customer_phone = (SELECT phone FROM profiles WHERE user_id = auth.uid())
       OR customer_email = (SELECT email FROM profiles WHERE user_id = auth.uid())
  )
);

-- Admins podem ver todos os itens
CREATE POLICY "Admins can view all order items" ON order_items
FOR SELECT
TO authenticated
USING (is_admin());

-- 4. CORRIGIR RLS - TABELA USER_RECOMMENDATIONS
-- Remover coluna customer_phone (não é necessária com user_id)
ALTER TABLE user_recommendations DROP COLUMN IF EXISTS customer_phone;

-- Remover política de sistema muito permissiva
DROP POLICY IF EXISTS "System can manage all recommendations" ON user_recommendations;

-- Service role pode gerenciar todas as recomendações
CREATE POLICY "Service role can manage recommendations" ON user_recommendations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Usuários podem ver apenas suas próprias recomendações
CREATE POLICY "Users can view own recommendations" ON user_recommendations
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 5. ADICIONAR USUÁRIO ADMIN
-- Adicionar felipehudson05@gmail.com como admin
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'felipehudson05@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;