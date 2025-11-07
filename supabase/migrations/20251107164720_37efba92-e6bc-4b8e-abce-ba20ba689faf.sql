-- 1. Adicionar coluna CPF na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cpf text;
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON profiles(cpf);

-- 2. Criar tabela de cupons
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping')),
  discount_value numeric NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  max_uses integer DEFAULT NULL,
  used_count integer DEFAULT 0,
  valid_from timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Criar tabela de uso de cupons
CREATE TABLE IF NOT EXISTS coupon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid REFERENCES coupons(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  discount_applied numeric NOT NULL,
  used_at timestamp with time zone DEFAULT now(),
  UNIQUE(coupon_id, user_id)
);

-- 4. RLS para coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ler cupons ativos" ON coupons
  FOR SELECT USING (is_active = true);

-- 5. RLS para coupon_usage
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários veem seus usos" ON coupon_usage
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Sistema pode inserir usos" ON coupon_usage
  FOR INSERT WITH CHECK (true);

-- 6. Adicionar colunas na tabela orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id uuid REFERENCES coupons(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;

-- 7. Função para validar cupom
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code text,
  p_user_id uuid,
  p_shipping_fee numeric
)
RETURNS json AS $$
DECLARE
  v_coupon coupons%ROWTYPE;
  v_order_count integer;
  v_discount numeric;
  v_usage_count integer;
BEGIN
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = p_code AND is_active = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Cupom inválido ou expirado');
  END IF;
  
  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < now() THEN
    RETURN json_build_object('valid', false, 'error', 'Cupom expirado');
  END IF;
  
  SELECT COUNT(*) INTO v_usage_count
  FROM coupon_usage
  WHERE coupon_id = v_coupon.id AND user_id = p_user_id;
  
  IF v_usage_count > 0 THEN
    RETURN json_build_object('valid', false, 'error', 'Você já usou este cupom');
  END IF;
  
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
    RETURN json_build_object('valid', false, 'error', 'Cupom esgotado');
  END IF;
  
  IF v_coupon.code = 'TAURIFRETEOFF' THEN
    SELECT COUNT(*) INTO v_order_count
    FROM orders
    WHERE customer_phone = (SELECT phone FROM profiles WHERE user_id = p_user_id);
    
    IF v_order_count > 0 THEN
      RETURN json_build_object('valid', false, 'error', 'Este cupom é apenas para primeiro pedido');
    END IF;
  END IF;
  
  IF v_coupon.discount_type = 'free_shipping' THEN
    v_discount := p_shipping_fee;
  ELSIF v_coupon.discount_type = 'percentage' THEN
    v_discount := (p_shipping_fee * v_coupon.discount_value / 100);
  ELSE
    v_discount := v_coupon.discount_value;
  END IF;
  
  RETURN json_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'discount', v_discount,
    'description', v_coupon.description
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Inserir cupom TAURIFRETEOFF
INSERT INTO coupons (code, description, discount_type, discount_value, is_active)
VALUES (
  'TAURIFRETEOFF',
  'Frete grátis para novos usuários no primeiro pedido',
  'free_shipping',
  100,
  true
)
ON CONFLICT (code) DO NOTHING;