-- Adicionar índice único para email (não duplicar contas com mesmo email)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique 
ON profiles(email) WHERE email IS NOT NULL;