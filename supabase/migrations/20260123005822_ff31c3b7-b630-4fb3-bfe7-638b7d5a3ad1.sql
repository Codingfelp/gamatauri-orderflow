-- Tabela para promoções de bundle (ex: 3 por R$10)
CREATE TABLE public.product_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  product_ids UUID[] NOT NULL,
  quantity_required INTEGER NOT NULL DEFAULT 3,
  bundle_price NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Comentário explicativo
COMMENT ON TABLE public.product_bundles IS 'Promoções de bundle como 3 por R$10';
COMMENT ON COLUMN public.product_bundles.product_ids IS 'Array de UUIDs dos produtos elegíveis para o bundle';
COMMENT ON COLUMN public.product_bundles.quantity_required IS 'Quantidade necessária para ativar o bundle (ex: 3)';
COMMENT ON COLUMN public.product_bundles.bundle_price IS 'Preço total do bundle (ex: 10.00)';

-- Habilitar RLS
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (todos podem ver bundles ativos)
CREATE POLICY "Anyone can view active bundles" 
  ON public.product_bundles 
  FOR SELECT 
  USING (is_active = true);

-- Política de admin para gerenciar bundles
CREATE POLICY "Admins can manage bundles" 
  ON public.product_bundles 
  FOR ALL 
  USING (public.is_admin());

-- Trigger para updated_at
CREATE TRIGGER update_product_bundles_updated_at
  BEFORE UPDATE ON public.product_bundles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir bundles iniciais (exemplos)
INSERT INTO public.product_bundles (name, description, product_ids, quantity_required, bundle_price, is_active)
VALUES 
  ('3 Gelos Saborizados por R$10', 'Leve 3 gelos saborizados e pague apenas R$10', ARRAY[]::UUID[], 3, 10.00, true),
  ('3 Ice Syn por R$20', 'Leve 3 Ice Syn e pague apenas R$20', ARRAY[]::UUID[], 3, 20.00, true),
  ('3 Beats por R$30', 'Leve 3 Beats e pague apenas R$30', ARRAY[]::UUID[], 3, 30.00, true);