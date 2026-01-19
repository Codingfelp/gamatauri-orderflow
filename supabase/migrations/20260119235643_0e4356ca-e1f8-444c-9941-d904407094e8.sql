-- Adicionar coluna de produtos favoritados na tabela profiles
ALTER TABLE public.profiles
ADD COLUMN favorite_products uuid[] DEFAULT '{}';

-- Criar índice para busca eficiente
CREATE INDEX idx_profiles_favorite_products ON public.profiles USING GIN(favorite_products);

-- Comentário para documentação
COMMENT ON COLUMN public.profiles.favorite_products IS 'Array de IDs de produtos favoritados pelo admin para este cliente';