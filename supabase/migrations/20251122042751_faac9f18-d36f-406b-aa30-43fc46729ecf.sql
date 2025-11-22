-- 1. Limpar CPFs duplicados existentes (manter o mais antigo)
WITH duplicates AS (
  SELECT cpf, MIN(created_at) as first_created
  FROM profiles
  WHERE cpf IS NOT NULL
  GROUP BY cpf
  HAVING COUNT(*) > 1
)
UPDATE profiles p
SET cpf = NULL
WHERE p.cpf IN (SELECT cpf FROM duplicates)
  AND p.created_at > (
    SELECT first_created FROM duplicates d WHERE d.cpf = p.cpf
  );

-- 2. Adicionar constraint UNIQUE
ALTER TABLE profiles
ADD CONSTRAINT profiles_cpf_unique UNIQUE (cpf);

-- 3. Comentário explicativo
COMMENT ON CONSTRAINT profiles_cpf_unique ON profiles IS 
'Garante que cada CPF seja único no sistema. CPF NULL é permitido para perfis incompletos.';