-- Adicionar coluna change_for na tabela orders para armazenar o valor do troco
ALTER TABLE public.orders ADD COLUMN change_for text;