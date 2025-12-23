-- Alterar coluna change_for de numeric para text para suportar formato brasileiro
ALTER TABLE public.orders 
ALTER COLUMN change_for TYPE text USING change_for::text;