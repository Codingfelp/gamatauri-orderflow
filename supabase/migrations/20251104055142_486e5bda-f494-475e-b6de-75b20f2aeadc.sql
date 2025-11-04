-- Atualizar handle_new_user para vincular perfis existentes por email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_profile profiles;
BEGIN
  -- Verificar se já existe perfil com este email
  SELECT * INTO existing_profile
  FROM public.profiles
  WHERE email = NEW.email
  LIMIT 1;
  
  IF FOUND THEN
    -- Perfil existe: atualizar user_id para vincular à nova conta OAuth
    UPDATE public.profiles
    SET 
      user_id = NEW.id,
      name = COALESCE(existing_profile.name, NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      updated_at = now()
    WHERE email = NEW.email;
    
    RAISE NOTICE 'Perfil existente vinculado: email=%, old_user_id=%, new_user_id=%', 
      NEW.email, existing_profile.user_id, NEW.id;
  ELSE
    -- Perfil não existe: criar novo
    INSERT INTO public.profiles (user_id, name, email)
    VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
      ),
      NEW.email
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Novo perfil criado: email=%, user_id=%', NEW.email, NEW.id;
  END IF;
  
  -- Atribuir role de customer (sempre)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log erro mas não bloquear signup
    RAISE WARNING 'Erro em handle_new_user: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;