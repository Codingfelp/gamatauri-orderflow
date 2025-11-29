-- Adicionar coluna shipping_fee na tabela user_addresses
ALTER TABLE user_addresses ADD COLUMN IF NOT EXISTS shipping_fee numeric DEFAULT NULL;

-- Adicionar coluna shipping_fee na tabela profiles (para o endereço principal)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shipping_fee numeric DEFAULT NULL;