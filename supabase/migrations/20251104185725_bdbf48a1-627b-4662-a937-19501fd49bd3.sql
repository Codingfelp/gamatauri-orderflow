-- Normalizar telefones em pedidos existentes (remover caracteres não numéricos)
UPDATE orders 
SET customer_phone = regexp_replace(customer_phone, '[^0-9]', '', 'g')
WHERE customer_phone IS NOT NULL;

-- Normalizar telefones em perfis existentes (remover caracteres não numéricos)
UPDATE profiles 
SET phone = regexp_replace(phone, '[^0-9]', '', 'g')
WHERE phone IS NOT NULL;