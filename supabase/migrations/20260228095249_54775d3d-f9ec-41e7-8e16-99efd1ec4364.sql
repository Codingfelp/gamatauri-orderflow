DROP POLICY IF EXISTS "Todos podem visualizar produtos disponíveis" ON products;
CREATE POLICY "Todos podem visualizar produtos" ON products
  FOR SELECT
  USING (deleted_at IS NULL AND price > 0);