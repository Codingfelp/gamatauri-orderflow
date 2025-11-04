/**
 * Normaliza um número de telefone removendo caracteres não numéricos
 * Exemplo: "(31) 98298-6215" -> "31982986215"
 */
export const normalizePhone = (phone: string | null | undefined): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};
