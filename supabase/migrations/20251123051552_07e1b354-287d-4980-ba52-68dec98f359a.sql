-- Criar tabela de recomendações de usuários
CREATE TABLE IF NOT EXISTS public.user_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  
  -- Histórico do cliente (Top 5 recorrentes)
  top_recurrent_products JSONB DEFAULT '[]'::jsonb,
  
  -- Produtos similares baseados em histórico
  similar_products JSONB DEFAULT '[]'::jsonb,
  
  -- Recomendações por comportamento (categorias frequentes)
  behavioral_products JSONB DEFAULT '[]'::jsonb,
  
  -- Combos inteligentes (ex: Red Label + Red Bull + Gelo)
  smart_combos JSONB DEFAULT '[]'::jsonb,
  
  -- Metadados para análise
  last_purchase_date TIMESTAMPTZ,
  total_orders INTEGER DEFAULT 0,
  favorite_categories TEXT[],
  avg_ticket_value NUMERIC,
  
  -- Cache control
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cache_valid_until TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  
  CONSTRAINT unique_customer_phone UNIQUE(customer_phone)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_recommendations_phone ON public.user_recommendations(customer_phone);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user ON public.user_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_cache ON public.user_recommendations(cache_valid_until);

-- Habilitar RLS
ALTER TABLE public.user_recommendations ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver suas próprias recomendações
CREATE POLICY "Users can view their own recommendations"
ON public.user_recommendations
FOR SELECT
USING (auth.uid() = user_id);

-- Política: Sistema pode gerenciar todas as recomendações
CREATE POLICY "System can manage all recommendations"
ON public.user_recommendations
FOR ALL
USING (true)
WITH CHECK (true);

-- Comentário na tabela
COMMENT ON TABLE public.user_recommendations IS 'Cache de recomendações personalizadas por cliente baseado em histórico de compras';