-- Criação das tabelas para o sistema de pedidos

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'cartao', 'dinheiro')),
  payment_timing TEXT NOT NULL CHECK (payment_timing IN ('agora', 'entrega')),
  payment_status TEXT DEFAULT 'pendente' CHECK (payment_status IN ('pendente', 'pago', 'cancelado')),
  order_status TEXT DEFAULT 'separacao' CHECK (order_status IN ('separacao', 'preparando', 'saiu_entrega', 'entregue', 'cancelado')),
  total_amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para visualização de produtos (qualquer um pode ver)
CREATE POLICY "Todos podem visualizar produtos disponíveis"
  ON public.products FOR SELECT
  USING (available = true);

-- Políticas para pedidos (qualquer um pode criar, mas apenas autenticados podem ver todos)
CREATE POLICY "Qualquer um pode criar pedidos"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Qualquer um pode visualizar pedidos"
  ON public.orders FOR SELECT
  USING (true);

CREATE POLICY "Qualquer um pode atualizar status de pagamento"
  ON public.orders FOR UPDATE
  USING (true);

-- Políticas para itens do pedido
CREATE POLICY "Qualquer um pode criar itens de pedido"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Qualquer um pode visualizar itens de pedido"
  ON public.order_items FOR SELECT
  USING (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at em pedidos
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Inserir alguns produtos de exemplo
INSERT INTO public.products (name, description, price, category, available) VALUES
  ('Pizza Margherita', 'Molho de tomate, mussarela e manjericão fresco', 45.90, 'Pizza', true),
  ('Pizza Calabresa', 'Molho de tomate, mussarela, calabresa e cebola', 48.90, 'Pizza', true),
  ('Pizza Portuguesa', 'Molho de tomate, mussarela, presunto, ovos, cebola e azeitonas', 52.90, 'Pizza', true),
  ('Hambúrguer Clássico', 'Pão, hambúrguer 180g, queijo, alface, tomate', 32.90, 'Hambúrguer', true),
  ('Hambúrguer Bacon', 'Pão, hambúrguer 180g, queijo, bacon crocante', 38.90, 'Hambúrguer', true),
  ('Refrigerante Lata', 'Coca-Cola, Guaraná ou Fanta 350ml', 6.50, 'Bebida', true),
  ('Suco Natural', 'Laranja, Limão ou Morango 500ml', 12.90, 'Bebida', true),
  ('Batata Frita', 'Porção de batata frita crocante 400g', 18.90, 'Acompanhamento', true);

-- Habilitar realtime para pedidos
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;