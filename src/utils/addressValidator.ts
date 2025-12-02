export interface ParsedAddress {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface AddressValidationResult {
  valid: boolean;
  errors: string[];
  parsed?: ParsedAddress;
}

export function parseAddress(address: string): ParsedAddress | null {
  if (!address || address.trim().length < 10) return null;

  const parts = address.split(',').map(p => p.trim());
  
  if (parts.length < 2) return null;

  // Tenta extrair número da primeira parte (rua)
  const streetPart = parts[0] || '';
  const numberMatch = streetPart.match(/\d+[A-Za-z]?$/);
  
  return {
    street: numberMatch ? streetPart.replace(/\d+[A-Za-z]?$/, '').trim() : streetPart,
    number: numberMatch ? numberMatch[0] : '',
    complement: '',
    neighborhood: parts[1] || '',
    city: parts[2]?.split('-')[0]?.trim() || '',
    state: parts[2]?.split('-')[1]?.trim() || '',
  };
}

export function validateAddress(address: string): AddressValidationResult {
  const errors: string[] = [];

  if (!address || address.trim().length < 10) {
    errors.push('Endereço muito curto');
    return { valid: false, errors };
  }

  const trimmedAddress = address.trim();

  // Validar se tem número
  const hasNumber = /\d+/.test(trimmedAddress);
  if (!hasNumber) {
    errors.push('Endereço deve conter o número da casa/prédio');
  }

  // Validar se tem bairro (buscar por vírgulas que separam partes)
  const parts = trimmedAddress.split(',').map(p => p.trim());
  if (parts.length < 2) {
    errors.push('Endereço deve conter rua, número e bairro separados por vírgula');
  }

  // Validar se tem pelo menos 3 partes: rua+número, bairro, cidade-estado
  if (parts.length < 3 && !trimmedAddress.includes('Belo Horizonte')) {
    errors.push('Endereço deve conter rua, número, bairro e cidade');
  }

  const parsed = parseAddress(trimmedAddress);

  return {
    valid: errors.length === 0,
    errors,
    parsed: parsed || undefined,
  };
}

export function formatAddress(parsed: ParsedAddress): string {
  const parts = [
    `${parsed.street}${parsed.number ? ', ' + parsed.number : ''}`,
  ];

  if (parsed.complement) {
    parts[0] += `, ${parsed.complement}`;
  }

  if (parsed.neighborhood) {
    parts.push(parsed.neighborhood);
  }

  if (parsed.city && parsed.state) {
    parts.push(`${parsed.city} - ${parsed.state}`);
  }

  return parts.join(', ');
}

export interface StructuredAddress {
  street: string;
  number: string;
  neighborhood: string;
  city?: string;
  state?: string;
}

export function isStructuredAddressComplete(address: StructuredAddress | null): { complete: boolean; reason: string | null } {
  if (!address) {
    return { complete: false, reason: 'Endereço não cadastrado' };
  }
  
  if (!address.street || address.street.trim().length < 3) {
    return { complete: false, reason: 'Rua não informada' };
  }
  
  if (!address.number || address.number.trim().length === 0) {
    return { complete: false, reason: 'Número da residência não informado' };
  }
  
  if (!address.neighborhood || address.neighborhood.trim().length < 2) {
    return { complete: false, reason: 'Bairro não informado' };
  }
  
  return { complete: true, reason: null };
}

export function isAddressComplete(address: string | null): { complete: boolean; reason: string | null } {
  if (!address || address.length < 10) {
    return { complete: false, reason: 'Endereço não cadastrado ou muito curto' };
  }
  
  const hasNumber = /\d+/.test(address);
  if (!hasNumber) {
    return { complete: false, reason: 'Endereço sem número da residência' };
  }
  
  return { complete: true, reason: null };
}

/**
 * Validação flexível para checkout que confia no cálculo de frete.
 * Se o frete foi calculado com sucesso (> 0), o endereço é considerado válido.
 */
export function isAddressValidForCheckout(
  address: string | null, 
  shippingFee: number
): { valid: boolean; reason: string | null } {
  // Se o frete foi calculado com sucesso, endereço é válido
  if (shippingFee > 0) {
    return { valid: true, reason: null };
  }
  
  // Validação básica se não tem frete ainda
  if (!address || address.trim().length < 10) {
    return { valid: false, reason: 'Endereço muito curto' };
  }
  
  // Deve ter pelo menos um número (da residência)
  if (!/\d+/.test(address)) {
    return { valid: false, reason: 'Endereço sem número' };
  }
  
  return { valid: true, reason: null };
}
