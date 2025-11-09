export const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  let formatted = digits;
  if (digits.length > 3) formatted = digits.slice(0, 3) + '.' + digits.slice(3);
  if (digits.length > 6) formatted = formatted.slice(0, 7) + '.' + digits.slice(6);
  if (digits.length > 9) formatted = formatted.slice(0, 11) + '-' + digits.slice(9, 11);
  return formatted;
};

export const validateCPF = (cpf: string): { valid: boolean; error?: string } => {
  // Remove caracteres não numéricos
  const digits = cpf.replace(/\D/g, '');
  
  // Verificar tamanho
  if (digits.length !== 11) {
    return { valid: false, error: 'CPF deve conter 11 dígitos' };
  }
  
  // Verificar se todos os dígitos são iguais (CPFs inválidos conhecidos)
  if (/^(\d)\1{10}$/.test(digits)) {
    return { valid: false, error: 'CPF inválido' };
  }
  
  // Validar primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i)) * (10 - i);
  }
  let firstDigit = 11 - (sum % 11);
  if (firstDigit >= 10) firstDigit = 0;
  
  if (firstDigit !== parseInt(digits.charAt(9))) {
    return { valid: false, error: 'CPF inválido - dígito verificador incorreto' };
  }
  
  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i)) * (11 - i);
  }
  let secondDigit = 11 - (sum % 11);
  if (secondDigit >= 10) secondDigit = 0;
  
  if (secondDigit !== parseInt(digits.charAt(10))) {
    return { valid: false, error: 'CPF inválido - dígito verificador incorreto' };
  }
  
  return { valid: true };
};
