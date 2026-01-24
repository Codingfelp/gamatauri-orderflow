-- Adicionar coluna distance_km na tabela user_addresses para armazenar a distância calculada
ALTER TABLE public.user_addresses 
ADD COLUMN IF NOT EXISTS distance_km NUMERIC(6,2) DEFAULT NULL;