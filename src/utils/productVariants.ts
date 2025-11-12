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
  'Cervejas': { groupBy: ['brand'], extractSize: true, extractFlavor: false },
  'Cervejas Zero': { groupBy: ['brand'], extractSize: true, extractFlavor: false },
  'Refrigerantes': { groupBy: ['size'], extractSize: true, extractFlavor: true },
  'Refrigerantes Zero': { groupBy: ['brand'], extractSize: true, extractFlavor: true },
  'Energéticos': { groupBy: ['brand', 'size'], extractSize: true, extractFlavor: true },
  'Sucos': { groupBy: ['brand'], extractSize: false, extractFlavor: true },
  'Drinks': { groupBy: ['brand'], extractSize: false, extractFlavor: true },
  'Vinhos': { groupBy: ['brand'], extractSize: false, extractFlavor: true },
  'Destilados': { groupBy: ['brand'], extractSize: false, extractFlavor: true },
  'Chocolates': { groupBy: ['brand'], extractSize: false, extractFlavor: true },
  'Snacks': { groupBy: ['brand'], extractSize: false, extractFlavor: true },
  'Doces': { groupBy: ['brand'], extractSize: false, extractFlavor: true },
  'Coquetéis': { groupBy: ['flavor'], extractSize: false, extractFlavor: true },
  'Cachaça': { groupBy: ['brand'], extractSize: false, extractFlavor: true },
  'Cachaças': { groupBy: ['brand'], extractSize: false, extractFlavor: true },
  'Carvão': { groupBy: ['size'], extractSize: true, extractFlavor: false },
  'Carvões': { groupBy: ['size'], extractSize: true, extractFlavor: false },
  'Águas': { groupBy: ['brand'], extractSize: false, extractFlavor: true },
  'Águas Saborizadas': { groupBy: ['brand'], extractSize: false, extractFlavor: true },
  'Gelos': { groupBy: ['brand', 'flavor'], extractSize: true, extractFlavor: true },
  'Gelo': { groupBy: ['brand', 'flavor'], extractSize: true, extractFlavor: true },
  'Combos': { groupBy: ['flavor'], extractSize: false, extractFlavor: true },
  'Kits': { groupBy: ['flavor'], extractSize: false, extractFlavor: true },
  'Seda': { groupBy: ['size'], extractSize: true, extractFlavor: true },
  'Sedas': { groupBy: ['size'], extractSize: true, extractFlavor: true },
};

const BRAND_PATTERNS: Record<string, RegExp> = {
  energeticos: /^(Baly|Red Bull|Monster|Fusion)\s*/i,
  refrigerantes: /^(Coca-Cola|Coca|Pepsi|Guaraná|Guarana|Sprite|Fanta|Kuat|Sukita|Soda|H2OH)\s*/i,
  refrigerante: /^(Coca-Cola|Coca|Pepsi|Guaraná|Guarana|Sprite|Fanta|Kuat|Sukita|Soda|H2OH)\s*/i,
  sucos: /^(Del Valle|Tial|Maguary|Gatorade|Ades|Tang)\s*/i,
  drinks: /^(Beats|Smirnoff|Xeque Mate|Lambe-Lambe|Lambe|Ice Syn|Mansão Maromba|Equilibrista|Vanfall|Brutal Fruit|Moscow Mule|Xá de Cana)\s*/i,
  drink: /^(Beats|Smirnoff|Xeque Mate|Lambe-Lambe|Lambe|Ice Syn|Mansão Maromba|Equilibrista|Vanfall|Brutal Fruit|Moscow Mule|Xá de Cana)\s*/i,
  vinhos: /^(Santa Carolina|Concha y Toro|Casal|Campo Largo|Aurora)\s*/i,
  destilados: /^(Corote|Smirnoff|Absolut|Jack Daniel|Johnnie Walker)\s*/i,
  chocolates: /^(Lacta|Nestlé|Nestle|Garoto|Hershey|Ferrero)\s*/i,
  snacks: /^(Doritos|Ruffles|Lay's|Pringles|Cheetos|Fandangos|Baconzitos|Torcida|Elma Chips)\s*/i,
  doces: /^(Halls|Trident|Mentos|Bis|Oreo|KitKat|M&M's|Snickers|Twix)\s*/i,
  coqueteis: /^(Caipirinha|Mojito|Piña Colada|Margarita|Daiquiri|Batida|Cosmopolitan)\s*/i,
  cachaca: /^(51|Velho Barreiro|Ypióca|Ypioca|Sagatiba|Tatuzinho|Caninha da Roça|Pitu)\s*/i,
  carvao: /^(Carvão|Carvao|Brasa|King Grill)\s*/i,
  aguas: /^(Crystal|Bonafont|Lindoya|H2OH|Minalba|Petrópolis|Petropolis)\s*/i,
  gelo: /^(Gelo|Ice|Gelo em Cubo|Gelo Picado)\s*/i,
  gelo_puro: /^(Gelo Filtrado|Gelo em Escama|Gelo Cubo|Gelo Picado)\s*/i,
  gelo_saborizado: /^(Gelo Saborizado|Gelo com Sabor)\s*/i,
  combos: /^(Combo|Kit|Pack|Promoção|Promocao)\s*/i,
  seda: /^(Seda|Papel|Piteira)\s*/i,
  cervejas: /^(Heineken|Brahma|Skol|Antarctica|Budweiser|Stella Artois|Stella|Corona|Original|Spaten|Devassa|Bohemia|Eisenbahn|Petra|Itaipava|Kaiser|Caracu|Serramalte|Bavaria|Colorado|Goose|Laut|Michelob)\s*/i,
};

const SIZE_PATTERNS = [
  /\b(200\s?ml|350\s?ml|473\s?ml|550\s?ml|600\s?ml|1\s?l|2\s?l|3\s?l)\b/i,
  /\b(lata|latao|latão|garrafa|long\s?neck|pet)\b/i
];

// Mapa de cores por MARCA (fallback quando cor específica não existe)
const BRAND_COLORS: Record<string, string> = {
  // CERVEJAS
  'antarctica': '#0077BE',
  'bohemia': '#F5DEB3',
  'brahma': '#C41E3A',
  'budweiser': '#D3D3D3',
  'colorado': '#D2691E',
  'fardo': '#D3D3D3',
  'goose': '#40E0D0',
  'heineken': '#90EE90',
  'itaipava': '#D3D3D3',
  'laut': '#FFD700',
  'michelob': '#87CEEB',
  'original': '#FFD700',
  'petra': '#F5DEB3',
  'skol': '#FFD700',
  'spaten': '#228B22',
  'stella': '#E8E8E8',
  'stella artois': '#E8E8E8',
  
  // ENERGÉTICOS
  'baly': '#FFD700',
  'red bull': '#0047AB',
  'monster': '#32CD32',
  'fusion': '#32CD32',
  
  // REFRIGERANTES
  'coca-cola': '#DC143C',
  'coca': '#DC143C',
  'pepsi': '#0066CC',
  'pepsi black': '#003366',
  'pepsi twist': '#003366',
  'sprite': '#90EE90',
  'guaraná': '#228B22',
  'guarana': '#228B22',
  'fanta': '#FFA500',
  'sukita': '#9370DB',
  'soda': '#D3D3D3',
  'h2oh': '#87CEEB',
  
  // DRINKS
  'beats': '#E85D75',
  'lambe': '#FFC0CB',
  'lambe-lambe': '#FFC0CB',
  'smirnoff': '#D3D3D3',
  'xeque mate': '#B8860B',
  'ice syn': '#98FB98',
  'mansão maromba': '#FFD700',
  'equilibrista': '#DDA0DD',
  'vanfall': '#FF6347',
  'brutal fruit': '#FF69B4',
  'moscow mule': '#F5DEB3',
  'xá de cana': '#B8860B',
};

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
  const normalizedName = productName.toLowerCase();
  const normalizedFlavor = flavor.toLowerCase();
  
  const colorMap: Record<string, string> = {
    // ===== CERVEJAS =====
    'antarctica-original': '#0077BE',
    'bohemia-original': '#F5DEB3',
    'brahma-original': '#C41E3A',
    'budweiser-original': '#D3D3D3',
    'colorado-original': '#D2691E',
    'goose-original': '#40E0D0',
    'heineken-original': '#90EE90',
    'itaipava-original': '#D3D3D3',
    'laut-original': '#FFD700',
    'michelob-original': '#87CEEB',
    'original-original': '#FFD700',
    'petra-original': '#F5DEB3',
    'skol-original': '#FFD700',
    'spaten-original': '#228B22',
    'stella-original': '#E8E8E8',
    'stella artois-original': '#E8E8E8',
    
    // ===== ENERGÉTICOS - BALY =====
    'baly-original': '#FFD700',
    'baly-morango': '#FFD700',
    'baly-pêssego': '#FFD700',
    'baly-pessego': '#FFD700',
    'baly-morango e pêssego': '#FFD700',
    'baly-morango e pessego': '#FFD700',
    'baly-tropical': '#FFD700',
    'baly-tropicall': '#FFD700',
    'baly-fusion': '#32CD32',
    'baly-fusion tropical': '#FFD700',
    
    // ===== ENERGÉTICOS - RED BULL =====
    'red bull-original': '#0047AB',
    'red bull-tradicional': '#0047AB',
    'red bull-250ml': '#0047AB',
    'red bull-355ml': '#0047AB',
    'red bull-473ml': '#0047AB',
    'red bull-amora': '#C71585',
    'red bull-cereja': '#87CEEB',
    'red bull-morango': '#FFD700',
    'red bull-pêssego': '#FFD700',
    'red bull-pessego': '#FFD700',
    'red bull-morango e pêssego': '#FFD700',
    'red bull-morango e pessego': '#FFD700',
    'red bull-pitaya': '#90EE90',
    'red bull-pomelo': '#DDA0DD',
    'red bull-summer': '#FFD700',
    'red bull-summer edition': '#FFD700',
    'red bull-tropical': '#FFD700',
    'red bull-zero': '#B0E0E6',
    
    // ===== ENERGÉTICOS - MONSTER =====
    'monster-original': '#32CD32',
    'monster-mango loco': '#FFD700',
    'monster-mango loco zero': '#4169E1',
    'monster-melancia': '#DC143C',
    'monster-ultra': '#D8BFD8',
    'monster-violet': '#8B008B',
    'monster-ultra violet': '#8B008B',
    'monster-zero': '#32CD32',
    
    // ===== ENERGÉTICOS - FUSION =====
    'fusion-original': '#32CD32',
    'fusion-tropical': '#FFD700',
    
    // ===== REFRIGERANTES - SUKITA =====
    'sukita-uva': '#9370DB',
    'sukita-laranja': '#FFA500',
    
    // ===== REFRIGERANTES - SODA =====
    'soda-zero': '#D3D3D3',
    'soda-tradicional': '#D3D3D3',
    'soda-original': '#D3D3D3',
    
    // ===== REFRIGERANTES - COCA-COLA =====
    'coca-cola-original': '#DC143C',
    'coca-cola-zero': '#000000',
    'coca-cola-zero açúcar': '#000000',
    'coca-cola-zero acucar': '#000000',
    'coca-zero': '#000000',
    'coca-original': '#DC143C',
    
    // ===== REFRIGERANTES - PEPSI =====
    'pepsi-original': '#0066CC',
    'pepsi-black': '#003366',
    'pepsi-twist': '#003366',
    'pepsi-zero': '#0066CC',
    
    // ===== REFRIGERANTES - SPRITE =====
    'sprite-original': '#90EE90',
    'sprite-zero': '#90EE90',
    
    // ===== REFRIGERANTES - GUARANÁ =====
    'guaraná-original': '#228B22',
    'guarana-original': '#228B22',
    'guaraná-zero': '#228B22',
    'guarana-zero': '#228B22',
    
    // ===== REFRIGERANTES - FANTA =====
    'fanta-laranja': '#FFA500',
    'fanta-uva': '#9370DB',
    
    // ===== REFRIGERANTES - H2OH =====
    'h2oh-citrus': '#FFD700',
    'h2oh-limão': '#F0E68C',
    'h2oh-limao': '#F0E68C',
    
    // ===== DRINKS - BEATS =====
    'beats-caipirinha': '#F0E68C',
    'beats-green mix': '#90EE90',
    'beats-gt': '#9370DB',
    'beats-red mix': '#E85D75',
    'beats-senses': '#DDA0DD',
    'beats-tropical': '#FFB347',
    
    // ===== DRINKS - LAMBE-LAMBE =====
    'lambe-lambe-limonada rosa': '#FFC0CB',
    'lambe-lambe-tangerina': '#FFA500',
    'lambe-limonada rosa': '#FFC0CB',
    'lambe-tangerina': '#FFA500',
    
    // ===== DRINKS - SMIRNOFF ICE =====
    'smirnoff-ice': '#D3D3D3',
    'smirnoff ice-original': '#D3D3D3',
    
    // ===== DRINKS - ICE SYN =====
    'ice syn-kiwi': '#90EE90',
    'ice syn-limão': '#F0E68C',
    'ice syn-limao': '#F0E68C',
    'ice syn-maca verde': '#98FB98',
    'ice syn-maça verde': '#98FB98',
    'ice syn-melancia': '#FFB6C1',
    'ice syn-morango': '#FFB6C1',
    'ice syn-tropical': '#FFD700',
    
    // ===== DRINKS - MANSÃO MAROMBA =====
    'mansão maromba-original': '#FFD700',
    'mansão maromba-colors berry': '#C71585',
    'mansão maromba-combo maça verde': '#98FB98',
    'mansão maromba-combo maçã verde': '#98FB98',
    'mansão maromba-combo tigrinho manga': '#FFA500',
    'mansão maromba-combo tigrinho tropical': '#FFD700',
    'mansão maromba-gin melancia': '#FFB6C1',
    'mansão maromba-gin cut original': '#B0C4DE',
    'mansão maromba-vodka combo': '#D3D3D3',
    
    // ===== DRINKS - EQUILIBRISTA =====
    'equilibrista-gingibre': '#F5DEB3',
    'equilibrista-rubra': '#DC143C',
    'equilibrista-veneta': '#DDA0DD',
    
    // ===== DRINKS - VANFALL =====
    'vanfall-fizz mexerica e hortelã': '#FFD700',
    'vanfall-fizz mexerica e hortela': '#FFD700',
    'vanfall-ruby frutas vermelhas': '#C71585',
    'vanfall-vibra maracujá': '#FFD700',
    'vanfall-vibra maracuja': '#FFD700',
    
    // ===== DRINKS - OUTRAS =====
    'brutal fruit-spritzer': '#FF69B4',
    'moscow mule-original': '#F5DEB3',
    'xá de cana-original': '#B8860B',
  };
  
  // 1. Tentar chave específica: 'marca-sabor' (primeira palavra)
  let specificKey = `${normalizedName.split(' ')[0]}-${normalizedFlavor}`;
  if (colorMap[specificKey]) {
    return colorMap[specificKey];
  }
  
  // 2. Tentar chave específica com DUAS palavras (ex: "ice syn", "mansão maromba", "pepsi black")
  const firstTwoWords = normalizedName.split(' ').slice(0, 2).join(' ');
  specificKey = `${firstTwoWords}-${normalizedFlavor}`;
  if (colorMap[specificKey]) {
    return colorMap[specificKey];
  }
  
  // 3. Tentar apenas marca (uma palavra)
  const brand = normalizedName.split(' ')[0];
  if (BRAND_COLORS[brand]) {
    return BRAND_COLORS[brand];
  }
  
  // 4. Tentar marca com duas palavras (ex: "stella artois", "ice syn", "pepsi black")
  if (BRAND_COLORS[firstTwoWords]) {
    return BRAND_COLORS[firstTwoWords];
  }
  
  // 5. Fallback padrão
  return '#4169E1';
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
