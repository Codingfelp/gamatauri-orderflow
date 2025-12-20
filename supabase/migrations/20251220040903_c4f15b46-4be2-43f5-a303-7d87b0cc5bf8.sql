-- Criar tabela para armazenar status da loja
CREATE TABLE public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_open BOOLEAN NOT NULL DEFAULT true,
  closed_message TEXT DEFAULT 'Estamos temporariamente fechados',
  closed_reason TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configuração inicial (loja aberta)
INSERT INTO public.store_settings (is_open, closed_message)
VALUES (true, 'Estamos temporariamente fechados');

-- Habilitar RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Política: todos podem ler o status da loja
CREATE POLICY "Todos podem ver status da loja"
ON public.store_settings
FOR SELECT
USING (true);

-- Habilitar realtime para atualizações em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;