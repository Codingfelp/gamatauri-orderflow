-- Adicionar novos campos à tabela store_settings para suportar configurações dinâmicas
ALTER TABLE public.store_settings 
  ADD COLUMN IF NOT EXISTS is_raining BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS opening_time TIME NOT NULL DEFAULT '10:00:00',
  ADD COLUMN IF NOT EXISTS closing_time TIME NOT NULL DEFAULT '23:00:00',
  ADD COLUMN IF NOT EXISTS max_delivery_radius_km NUMERIC(4,1) NOT NULL DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS min_delivery_fee NUMERIC(6,2) NOT NULL DEFAULT 3.00,
  ADD COLUMN IF NOT EXISTS fee_per_km NUMERIC(6,2) NOT NULL DEFAULT 3.00,
  ADD COLUMN IF NOT EXISTS rain_fee_per_km NUMERIC(6,2) NOT NULL DEFAULT 5.00;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.store_settings.is_raining IS 'Indica se está chovendo e aplica taxa de chuva';
COMMENT ON COLUMN public.store_settings.opening_time IS 'Horário de abertura da loja';
COMMENT ON COLUMN public.store_settings.closing_time IS 'Horário de fechamento da loja';
COMMENT ON COLUMN public.store_settings.max_delivery_radius_km IS 'Raio máximo de entrega em km';
COMMENT ON COLUMN public.store_settings.min_delivery_fee IS 'Taxa mínima de entrega em R$';
COMMENT ON COLUMN public.store_settings.fee_per_km IS 'Valor por km em condições normais';
COMMENT ON COLUMN public.store_settings.rain_fee_per_km IS 'Valor por km quando está chovendo';