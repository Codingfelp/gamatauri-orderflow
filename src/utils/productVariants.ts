import { Product } from "@/services/productsService";

export interface ProductVariant {
  id: string;
  name: string;
  flavor: string;
  size?: string;
  price: number;
  image_url: string | null;
  available: boolean;
}

export interface ProductGroup {
  groupKey: string;
  baseProduct: {
    brand: string;
    type: string;
    size?: string;
    category: string;
  };
  variants: ProductVariant[];
  mainImage: string | null;
  priceRange: { min: number; max: number };
  brandColor: string;
  availableCount: number;
}

const GROUPING_RULES: Record<string, {
  groupBy: string[];
  extractSize: boolean;
  extractFlavor: boolean;
}> = {
  'Refrigerantes': { groupBy: ['size'], extractSize: true, extractFlavor: true },
  'Energéticos': { groupBy: ['brand', 'size'], extractSize: true, extractFlavor: true },
  'Sucos': { groupBy: ['brand'], extractSize: false, extractFlavor: true },
  'Drinks': { groupBy: ['brand'], extractSize: false, extractFlavor: true },
  'Vinhos': { groupBy: ['brand'], extractSize: false, extractFlavor: true },
  'Destilados': { groupBy: ['brand'], extractSize: false, extractFlavor: true },
  'Chocolates': { groupBy: ['brand'], extractSize: false, extractFlavor: true }
};

const BRAND_PATTERNS: Record<string, RegExp> = {
  energeticos: /^(Baly|Red Bull|Monster)\s*/i,
  refrigerantes: /^(Coca-Cola|Coca|Pepsi|Guaraná|Guarana|Sprite|Fanta|Kuat)\s*/i,
  sucos: /^(Del Valle|Tial|Maguary|Gatorade|Ades|Tang)\s*/i,
  drinks: /^(Beats|Smirnoff|Xeque Mate|Lambe)\s*/i,
  vinhos: /^(Santa Carolina|Concha y Toro|Casal|Campo Largo|Aurora)\s*/i,
  destilados: /^(Corote|Smirnoff|Absolut|Jack Daniel|Johnnie Walker)\s*/i,
  chocolates: /^(Lacta|Nestlé|Nestle|Garoto|Hershey|Ferrero)\s*/i
};

const SIZE_PATTERNS = [
  /\b(200\s?ml|350\s?ml|473\s?ml|550\s?ml|600\s?ml|1\s?l|2\s?l|3\s?l)\b/i,
  /\b(lata|latao|latão|garrafa|long\s?neck|pet)\b/i
];

interface ParsedProduct {
  brand: string;
  size?: string;
  flavor: string;
  originalName: string;
}

function extractBrandFallback(name: string): string {
  const words = name.trim().split(/\s+/);
  return words[0] || 'Desconhecido';
}

function normalizeCategoryForPattern(category: string): string {
  return category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function parseProductName(name: string, category: string): ParsedProduct {
  const normalized = normalizeCategoryForPattern(category);
  
  const brandPattern = BRAND_PATTERNS[normalized];
  const brandMatch = brandPattern?.exec(name);
  const brand = brandMatch ? brandMatch[1] : extractBrandFallback(name);
  
  let size: string | undefined;
  for (const pattern of SIZE_PATTERNS) {
    const match = pattern.exec(name.toLowerCase());
    if (match) {
      size = match[1].replace(/\s/g, '');
      break;
    }
  }
  
  let flavor = name;
  if (brandPattern) {
    flavor = flavor.replace(brandPattern, '');
  }
  SIZE_PATTERNS.forEach(pattern => {
    flavor = flavor.replace(pattern, '');
  });
  flavor = flavor.trim();
  
  if (!flavor || flavor.length < 2) {
    flavor = 'Original';
  }
  
  return { brand, size, flavor, originalName: name };
}

export const getProductColor = (productName: string, flavor: string): string => {
  const key = `${productName.toLowerCase()}-${flavor.toLowerCase()}`;
  
  const colorMap: Record<string, string> = {
    // BALY - Energéticos
    'baly-tradicional': '#FFD700', 'baly-original': '#FFD700',
    'baly-tropicall': '#FF4500', 'baly-tropical': '#FF4500',
    'baly-guaraná': '#90EE90', 'baly-guarana': '#90EE90',
    'baly-açaí': '#8B00FF', 'baly-acai': '#8B00FF',
    'baly-limão': '#FFFF00', 'baly-limao': '#FFFF00',
    'baly-tutti frutti': '#FF1493',
    'baly-tangerina': '#FFA500',
    'baly-coco e açaí': '#87CEEB', 'baly-coco e acai': '#87CEEB',
    'baly-freegels cereja': '#DC143C', 'baly-cereja': '#DC143C',
    'baly-maçã verde': '#90EE90', 'baly-maca verde': '#90EE90',
    'baly-morango': '#FFB6C1',
    'baly-uva': '#9370DB',
    
    // RED BULL - Energéticos
    'red bull-tradicional': '#00B4D8', 'red bull-original': '#00B4D8',
    'red bull-blue': '#1E90FF', 'red bull-azul': '#1E90FF',
    'red bull-tropicall': '#FFD700', 'red bull-tropical': '#FFD700',
    'red bull-yellow': '#FFD700', 'red bull-amarelo': '#FFD700',
    'red bull-coconut': '#F0FFF0', 'red bull-coco': '#F0FFF0',
    'red bull-watermelon': '#FF6B6B', 'red bull-melancia': '#FF6B6B',
    'red bull-summer': '#FFE5B4',
    'red bull-winter': '#B0E0E6',
    'red bull-spring': '#98FB98',
    'red bull-energy': '#00B4D8',
    'red bull-red': '#DC143C', 'red bull-vermelho': '#DC143C',
    'red bull-silver': '#C0C0C0', 'red bull-prata': '#C0C0C0',
    'red bull-verde': '#90EE90', 'red bull-green': '#90EE90',
    
    // MONSTER - Energéticos
    'monster-original': '#32CD32', 'monster-verde': '#32CD32',
    'monster-ultra': '#E0E0E0', 'monster-branco': '#E0E0E0',
    'monster-assault': '#DC143C', 'monster-vermelho': '#DC143C',
    'monster-zero': '#2F2F2F', 'monster-preto': '#2F2F2F',
    'monster-ultra blue': '#4169E1', 'monster-azul': '#4169E1',
    'monster-ultra white': '#F0F0F0',
    'monster-ultra violet': '#8A2BE2', 'monster-roxo': '#8A2BE2',
    'monster-pipeline punch': '#FF69B4',
    'monster-lewis hamilton': '#FFD700',
    'monster-paradise': '#FF69B4', 'monster-rosa': '#FF69B4',
    'monster-mango': '#FFA500', 'monster-manga': '#FFA500',
    
    // COCA-COLA - Refrigerantes
    'coca-cola-original': '#DC143C', 'coca-original': '#DC143C',
    'coca-cola-tradicional': '#DC143C',
    'coca-cola-zero': '#2F2F2F', 'coca-zero': '#2F2F2F',
    'coca-cola-sem açúcar': '#2F2F2F', 'coca-cola-sem acucar': '#2F2F2F',
    'coca-cola-energy': '#DC143C',
    'coca-cola-cherry': '#8B0000',
    'coca-cola-vanilla': '#F5DEB3',
    'coca-cola-lime': '#32CD32',
    'coca-cola-limão': '#90EE90', 'coca-limao': '#90EE90',
    
    // PEPSI - Refrigerantes
    'pepsi-original': '#4169E1', 'pepsi-tradicional': '#4169E1',
    'pepsi-max': '#2F2F2F',
    'pepsi-cola': '#4169E1',
    'pepsi-wild cherry': '#DC143C',
    'pepsi-vanilla': '#F5DEB3',
    'pepsi-zero': '#2F2F2F',
    'pepsi-black': '#2F2F2F',
    'pepsi-twist': '#90EE90', 'pepsi-limão': '#90EE90',
    
    // GUARANÁ - Refrigerantes
    'guaraná-antarctica': '#228B22', 'guarana-antarctica': '#228B22',
    'guaraná-original': '#228B22', 'guarana-original': '#228B22',
    'guaraná-diet': '#90EE90', 'guarana-diet': '#90EE90',
    'guaraná-antarctica zero': '#2F2F2F', 'guarana-antarctica zero': '#2F2F2F',
    'guaraná-zero': '#2F2F2F', 'guarana-zero': '#2F2F2F',
    'guaraná-jesus': '#B8860B', 'guarana-jesus': '#B8860B',
    'guaraná-kuat': '#8B4513', 'guarana-kuat': '#8B4513',
    
    // FANTA - Refrigerantes
    'fanta-laranja': '#FF8C00', 'fanta-orange': '#FF8C00',
    'fanta-uva': '#9370DB', 'fanta-grape': '#9370DB',
    'fanta-maracujá': '#FFD700', 'fanta-maracuja': '#FFD700',
    'fanta-limão': '#ADFF2F', 'fanta-limao': '#ADFF2F',
    'fanta-melancia': '#FF6B6B',
    'fanta-pêssego': '#FFE5B4', 'fanta-pessego': '#FFE5B4',
    'fanta-guaraná': '#FFD700', 'fanta-guarana': '#FFD700',
    'fanta-morango': '#FFB6C1', 'fanta-strawberry': '#FFB6C1',
    
    // SPRITE - Refrigerantes
    'sprite-original': '#90EE90', 'sprite-tradicional': '#90EE90',
    'sprite-limão': '#90EE90', 'sprite-limao': '#90EE90',
    'sprite-cranberry': '#DC143C',
    'sprite-tropical': '#FFD700',
    'sprite-zero': '#90EE90',
    
    // KUAT
    'kuat-original': '#8B4513', 'kuat-guaraná': '#8B4513',
    
    // TIAL - Sucos
    'tial-laranja': '#FF8C42', 'tial-orange': '#FF8C42',
    'tial-abacaxi': '#FFD700',
    'tial-morango': '#FFB6C1',
    'tial-limão': '#ADFF2F', 'tial-limao': '#ADFF2F',
    'tial-melancia': '#FF6B6B',
    'tial-tangerina': '#FFA500',
    'tial-uva': '#9370DB', 'tial-grape': '#9370DB',
    'tial-maracujá': '#FFD700', 'tial-maracuja': '#FFD700',
    'tial-goiaba': '#FFB6C1', 'tial-guava': '#FFB6C1',
    'tial-manga': '#FFA500', 'tial-mango': '#FFA500',
    'tial-pêssego': '#FFDAB9', 'tial-pessego': '#FFDAB9',
    
    // MAGUARY - Sucos
    'maguary-laranja': '#CD5C5C',
    'maguary-abacaxi': '#FFD700',
    'maguary-morango': '#FFB6C1',
    'maguary-limão': '#ADFF2F', 'maguary-limao': '#ADFF2F',
    'maguary-pêssego': '#FFDAB9', 'maguary-pessego': '#FFDAB9',
    'maguary-tangerina': '#FFA500',
    'maguary-melancia': '#FF6B6B',
    'maguary-uva': '#8B008B',
    'maguary-maracujá': '#FFD700', 'maguary-maracuja': '#FFD700',
    'maguary-goiaba': '#FFB6C1',
    'maguary-manga': '#FFA500',
    
    // DEL VALLE - Sucos
    'del valle-laranja': '#FFA500',
    'del valle-abacaxi': '#FFD700',
    'del valle-morango': '#FFB6C1',
    'del valle-limão': '#ADFF2F', 'del valle-limao': '#ADFF2F',
    'del valle-tangerina': '#FFA500',
    'del valle-melancia': '#FF6B6B',
    'del valle-caju': '#FFA07A',
    'del valle-uva': '#9370DB',
    'del valle-maracujá': '#FFD700', 'del valle-maracuja': '#FFD700',
    'del valle-pêssego': '#FFDAB9', 'del valle-pessego': '#FFDAB9',
    'del valle-manga': '#FFA500',
    
    // GATORADE - Isotônicos
    'gatorade-cool blue': '#4169E1',
    'gatorade-lemon lime': '#90EE90',
    'gatorade-limão': '#90EE90', 'gatorade-limao': '#90EE90',
    'gatorade-fruit punch': '#DC143C',
    'gatorade-tangerina': '#FFA500',
    'gatorade-maracujá': '#FFD700', 'gatorade-maracuja': '#FFD700',
    'gatorade-laranja': '#FF8C00', 'gatorade-orange': '#FF8C00',
    'gatorade-uva': '#9370DB',
    'gatorade-morango': '#FFB6C1',
    'gatorade-azul': '#4169E1', 'gatorade-blue': '#4169E1',
    
    // ADES - Sucos de Soja
    'ades-laranja': '#FFA500',
    'ades-maçã': '#90EE90', 'ades-maca': '#90EE90',
    'ades-uva': '#9370DB',
    'ades-pêssego': '#FFDAB9', 'ades-pessego': '#FFDAB9',
    'ades-original': '#F5DEB3',
    
    // TANG - Sucos em Pó
    'tang-laranja': '#FFA500',
    'tang-uva': '#9370DB',
    'tang-limão': '#ADFF2F', 'tang-limao': '#ADFF2F',
    'tang-maracujá': '#FFD700', 'tang-maracuja': '#FFD700',
    
    // BEATS - Drinks
    'beats-senses': '#FF69B4', 'beats-rosa': '#FF69B4',
    'beats-pink': '#FF69B4',
    'beats-gt': '#FF4500', 'beats-laranja': '#FF4500',
    'beats-original': '#FF4500',
    'beats-black': '#2F2F2F',
    'beats-red': '#DC143C',
    'beats-passion': '#FF1493',
    'beats-zero': '#2F2F2F',
    
    // SMIRNOFF - Drinks
    'smirnoff-ice': '#E0E0E0',
    'smirnoff-red': '#DC143C',
    'smirnoff-green apple': '#90EE90',
    'smirnoff-raspberry': '#DC143C',
    'smirnoff-original': '#E0E0E0',
    
    // XEQUE MATE
    'xeque mate-original': '#FFD700',
    'xeque mate-limão': '#90EE90', 'xeque mate-limao': '#90EE90',
    'xeque mate-morango': '#FFB6C1',
    
    // COROTE - Destilados
    'corote-uva': '#9370DB',
    'corote-morango': '#FFB6C1',
    'corote-limão': '#90EE90', 'corote-limao': '#90EE90',
    'corote-pêssego': '#FFDAB9', 'corote-pessego': '#FFDAB9',
    
    // H2OH - Águas Saborizadas
    'h2oh-limão': '#ADFF2F', 'h2oh-limao': '#ADFF2F',
    'h2oh-limoneto': '#ADFF2F',
    
    // VINHOS
    'vinho-tinto': '#8B0000',
    'vinho-branco': '#F5DEB3',
    'vinho-rosé': '#FFB6C1', 'vinho-rose': '#FFB6C1',
    'vinho-suave': '#DC143C',
    'vinho-seco': '#8B0000',
  };
  
  for (const [mapKey, color] of Object.entries(colorMap)) {
    if (key.includes(mapKey)) return color;
  }
  
  // Fallbacks por marca
  const lowerName = productName.toLowerCase();
  if (lowerName.includes('baly')) return '#FFD700';
  if (lowerName.includes('red bull')) return '#FFD700';
  if (lowerName.includes('monster')) return '#32CD32';
  if (lowerName.includes('tial')) return '#FFD700';
  if (lowerName.includes('maguary')) return '#CD5C5C';
  if (lowerName.includes('coca')) return '#DC143C';
  if (lowerName.includes('pepsi')) return '#4169E1';
  if (lowerName.includes('guaraná') || lowerName.includes('guarana')) return '#228B22';
  if (lowerName.includes('sprite')) return '#90EE90';
  if (lowerName.includes('fanta')) return '#FF8C00';
  if (lowerName.includes('kuat')) return '#8B4513';
  if (lowerName.includes('del valle')) return '#FFA500';
  if (lowerName.includes('beats')) return '#FF69B4';
  if (lowerName.includes('gatorade')) return '#FF8C00';
  
  return '#E0E0E0';
};

export function groupProductsByVariants(
  products: Product[],
  category: string
): ProductGroup[] {
  const rule = GROUPING_RULES[category];
  if (!rule) {
    return [];
  }
  
  const groups: Record<string, ProductGroup> = {};
  
  products.forEach(product => {
    const parsed = parseProductName(product.name, category);
    
    let groupKey = parsed.brand;
    let displayBrand = parsed.brand;
    
    if (category === 'Refrigerantes' && parsed.size) {
      groupKey = parsed.size;
      displayBrand = `Refrigerantes ${parsed.size}`;
    } else if (rule.groupBy.includes('size') && parsed.size) {
      groupKey += `-${parsed.size}`;
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = {
        groupKey,
        baseProduct: {
          brand: displayBrand,
          type: category,
          size: parsed.size,
          category: product.category || category
        },
        variants: [],
        mainImage: product.image_url,
        priceRange: { min: Infinity, max: -Infinity },
        brandColor: getProductColor(product.name, parsed.flavor),
        availableCount: 0
      };
    }
    
    groups[groupKey].variants.push({
      id: product.id,
      name: product.name,
      flavor: parsed.flavor,
      size: parsed.size,
      price: product.price,
      image_url: product.image_url,
      available: product.available
    });
    
    if (product.available) {
      groups[groupKey].availableCount++;
    }
    groups[groupKey].priceRange.min = Math.min(
      groups[groupKey].priceRange.min,
      product.price
    );
    groups[groupKey].priceRange.max = Math.max(
      groups[groupKey].priceRange.max,
      product.price
    );
    
    if (product.available && product.image_url && 
        product.price === groups[groupKey].priceRange.max) {
      groups[groupKey].mainImage = product.image_url;
    }
  });
  
  return Object.values(groups).filter(g => g.variants.length >= 2);
}

export function shouldUseVariantSystem(category: string): boolean {
  return !!GROUPING_RULES[category];
}
