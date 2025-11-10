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

function getProductColor(productName: string, flavor: string): string {
  const key = `${productName.toLowerCase()}-${flavor.toLowerCase()}`;
  
  const colorMap: Record<string, string> = {
    // BALY - Cores baseadas nas latas reais
    'baly-tradicional': '#FFD700', 'baly-original': '#FFD700',
    'baly-tropicall': '#FF8C42', 'baly-tropical': '#FF8C42',
    'baly-coco e açaí': '#87CEEB', 'baly-coco e acai': '#87CEEB',
    'baly-freegels cereja': '#DC143C', 'baly-cereja': '#DC143C',
    'baly-maçã verde': '#90EE90', 'baly-maca verde': '#90EE90',
    'baly-morango': '#FFB6C1',
    'baly-uva': '#9370DB',
    
    // RED BULL - Cores das latas
    'red bull-tradicional': '#FFD700', 'red bull-original': '#FFD700',
    'red bull-blue': '#4169E1', 'red bull-azul': '#4169E1',
    'red bull-red': '#DC143C', 'red bull-vermelho': '#DC143C',
    'red bull-silver': '#C0C0C0', 'red bull-prata': '#C0C0C0',
    'red bull-verde': '#90EE90', 'red bull-green': '#90EE90',
    
    // MONSTER - Cores características
    'monster-original': '#32CD32', 'monster-verde': '#32CD32',
    'monster-ultra': '#E8E8E8', 'monster-branco': '#E8E8E8',
    'monster-paradise': '#FF69B4', 'monster-rosa': '#FF69B4',
    'monster-mango': '#FFA500', 'monster-manga': '#FFA500',
    
    // COCA-COLA
    'coca-cola-original': '#DC143C', 'coca-original': '#DC143C',
    'coca-cola-zero': '#2F2F2F', 'coca-zero': '#2F2F2F',
    'coca-cola-limão': '#90EE90', 'coca-limao': '#90EE90',
    
    // PEPSI
    'pepsi-original': '#4169E1', 'pepsi-tradicional': '#4169E1',
    'pepsi-black': '#2F2F2F', 'pepsi-zero': '#2F2F2F',
    'pepsi-twist': '#90EE90', 'pepsi-limão': '#90EE90',
    
    // GUARANÁ
    'guaraná-original': '#228B22', 'guarana-original': '#228B22',
    'guaraná-zero': '#2F2F2F', 'guarana-zero': '#2F2F2F',
    'guaraná-antarctica': '#228B22', 'guarana-antarctica': '#228B22',
    
    // SPRITE
    'sprite-original': '#90EE90', 'sprite-tradicional': '#90EE90',
    'sprite-zero': '#E8E8E8',
    
    // FANTA - Cada sabor tem cor própria
    'fanta-laranja': '#FF8C00', 'fanta-orange': '#FF8C00',
    'fanta-uva': '#9370DB', 'fanta-grape': '#9370DB',
    'fanta-guaraná': '#FFD700', 'fanta-guarana': '#FFD700',
    'fanta-morango': '#FFB6C1', 'fanta-strawberry': '#FFB6C1',
    
    // KUAT
    'kuat-original': '#8B4513', 'kuat-guaraná': '#8B4513',
    
    // SUCOS TIAL
    'tial-laranja': '#FF8C42', 'tial-orange': '#FF8C42',
    'tial-uva': '#9370DB', 'tial-grape': '#9370DB',
    'tial-maracujá': '#FFD700', 'tial-maracuja': '#FFD700',
    'tial-goiaba': '#FFB6C1', 'tial-guava': '#FFB6C1',
    'tial-manga': '#FFA500', 'tial-mango': '#FFA500',
    'tial-pêssego': '#FFDAB9', 'tial-pessego': '#FFDAB9',
    
    // SUCOS MAGUARY
    'maguary-laranja': '#CD5C5C',
    'maguary-uva': '#8B008B',
    'maguary-maracujá': '#FFD700', 'maguary-maracuja': '#FFD700',
    'maguary-goiaba': '#FFB6C1',
    'maguary-manga': '#FFA500',
    
    // DEL VALLE
    'del valle-laranja': '#FFA500',
    'del valle-uva': '#9370DB',
    'del valle-maracujá': '#FFD700', 'del valle-maracuja': '#FFD700',
    'del valle-pêssego': '#FFDAB9', 'del valle-pessego': '#FFDAB9',
    'del valle-manga': '#FFA500',
    
    // BEATS
    'beats-senses': '#FF69B4', 'beats-rosa': '#FF69B4',
    'beats-gt': '#FF4500', 'beats-laranja': '#FF4500',
    'beats-zero': '#2F2F2F',
    
    // GATORADE
    'gatorade-laranja': '#FF8C00', 'gatorade-orange': '#FF8C00',
    'gatorade-limão': '#90EE90', 'gatorade-limao': '#90EE90',
    'gatorade-uva': '#9370DB',
    'gatorade-morango': '#FFB6C1',
    'gatorade-azul': '#4169E1', 'gatorade-blue': '#4169E1',
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
}

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
