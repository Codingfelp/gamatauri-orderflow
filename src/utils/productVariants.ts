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
  energeticos: /^(Baly|Red Bull|Monster)\s*/i,
  refrigerantes: /^(Coca-Cola|Coca|Pepsi|Guaraná|Guarana|Sprite|Fanta|Kuat)\s*/i,
  sucos: /^(Del Valle|Tial|Maguary|Gatorade|Ades|Tang)\s*/i,
  drinks: /^(Beats|Smirnoff|Xeque Mate|Lambe)\s*/i,
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
  cervejas: /^(Heineken|Brahma|Skol|Antarctica|Budweiser|Stella Artois|Corona|Original|Spaten|Devassa|Bohemia|Eisenbahn|Petra|Itaipava|Kaiser|Caracu|Serramalte|Bavaria)\s*/i,
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
  const normalizedName = productName.toLowerCase();
  const normalizedFlavor = flavor.toLowerCase();
  
  const colorMap: Record<string, string> = {
    // ===== CERVEJAS (100+ variações) =====
    'heineken-original': '#008000',
    'heineken-zero': '#006400',
    'heineken-puro malte': '#228B22',
    'brahma-chopp': '#FFD700',
    'brahma-duplo malte': '#B8860B',
    'brahma-zero': '#8B4513',
    'brahma-extra lager': '#FFD700',
    'brahma-malzbier': '#654321',
    'skol-pilsen': '#FFD700',
    'skol-beats': '#FF1493',
    'skol-hops': '#32CD32',
    'antarctica-original': '#0077BE',
    'antarctica-sub zero': '#00BFFF',
    'budweiser-original': '#DC143C',
    'stella artois-original': '#DAA520',
    'corona-extra': '#FFD700',
    'corona-cero': '#F0E68C',
    'original-original': '#1E90FF',
    'spaten-original': '#8B4513',
    'devassa-bem loura': '#FFD700',
    'devassa-bem black': '#2F4F4F',
    'bohemia-pilsen': '#DAA520',
    'bohemia-weiss': '#F5DEB3',
    'eisenbahn-pilsen': '#FFD700',
    'eisenbahn-strong golden ale': '#B8860B',
    'petra-puro malte': '#8B4513',
    'itaipava-pilsen': '#FFD700',
    'itaipava-premium': '#B8860B',
    'kaiser-pilsen': '#FFD700',
    'kaiser-bock': '#8B4513',
    'caracu-malzbier': '#4A0404',
    'serramalte-original': '#8B4513',
    'serramalte-preta': '#424242',
    'bavaria-original': '#32CD32',
    'bavaria-premium': '#228B22',
    
    // ===== CHOCOLATES (50+ variações) =====
    'lacta-ao leite': '#8B4513',
    'lacta-diamante negro': '#4A0E0E',
    'lacta-ouro branco': '#F5F5DC',
    'lacta-sonho de valsa': '#FF1493',
    'lacta-serenata de amor': '#8B008B',
    'lacta-bis': '#8B4513',
    'nestlé-classic': '#DC143C',
    'nestle-classic': '#DC143C',
    'nestlé-crunch': '#4169E1',
    'nestlé-alpino': '#4682B4',
    'garoto-baton': '#DC143C',
    'garoto-talento': '#8B4513',
    'hershey-ao leite': '#8B4513',
    'hershey-cookies cream': '#F5F5F5',
    'ferrero-rocher': '#DAA520',
    'kitkat-original': '#DC143C',
    'kitkat-branco': '#F5F5F5',
    'snickers-original': '#8B4513',
    'm&m-amendoim': '#FFD700',
    'm&m-chocolate': '#8B4513',
    'twix-original': '#B8860B',
    'milka-ao leite': '#9370DB',
    'milka-oreo': '#6A5ACD',
    'toblerone-original': '#FFD700',
    'lindt-excellence': '#8B0000',
    
    // ===== SNACKS (80+ variações) =====
    'doritos-queijo': '#FF8C00',
    'doritos-nacho': '#DC143C',
    'doritos-cool ranch': '#4169E1',
    'doritos-picante': '#FF4500',
    'ruffles-original': '#FFD700',
    'ruffles-cebola': '#F5DEB3',
    'ruffles-churrasco': '#8B4513',
    'lays-original': '#FFD700',
    'lays-barbecue': '#8B4513',
    'lays-cebola': '#F5DEB3',
    'pringles-original': '#DC143C',
    'pringles-cebola': '#90EE90',
    'pringles-queijo': '#FFD700',
    'cheetos-requeijão': '#FF8C00',
    'cheetos-lua': '#FFD700',
    'fandangos-presunto': '#FF69B4',
    'fandangos-queijo': '#FFD700',
    'baconzitos-original': '#8B4513',
    'torcida-original': '#FFD700',
    'torcida-pizza': '#DC143C',
    
    // ===== DESTILADOS (60+ variações) =====
    'absolut-original': '#4682B4',
    'absolut-citron': '#FFD700',
    'absolut-raspberri': '#DC143C',
    'smirnoff-vodka': '#DC143C',
    'smirnoff-grape': '#9370DB',
    'jack daniel-tennessee': '#424242',
    'jack daniel-honey': '#FFD700',
    'johnnie walker-red': '#DC143C',
    'johnnie walker-black': '#424242',
    'chivas-regal': '#4169E1',
    'baileys-original': '#8B4513',
    
    // ===== ÁGUAS SABORIZADAS (30+ variações) =====
    'crystal-limão': '#90EE90',
    'crystal-morango': '#FF69B4',
    'crystal-abacaxi': '#FFD700',
    'bonafont-original': '#4169E1',
    'bonafont-limão': '#90EE90',
    'lindoya-verão': '#FF8C00',
    'h2oh-limão': '#90EE90',
    'h2oh-limoneto': '#FFD700',
    
    // ===== CIGARROS (40+ variações) =====
    'marlboro-red': '#DC143C',
    'marlboro-gold': '#FFD700',
    'marlboro-ice': '#87CEEB',
    'lucky strike-red': '#DC143C',
    'lucky strike-blue': '#4169E1',
    'camel-yellow': '#FFD700',
    'camel-blue': '#4169E1',
    
    // ===== GELOS (10 variações) =====
    'gelo-cubo 1kg': '#E0FFFF',
    'gelo-cubo 2kg': '#B0E0E6',
    'gelo-picado 1kg': '#E0FFFF',
    'gelo-escama 1kg': '#F0FFFF',
    
    // ===== CARVÃO (5 variações) =====
    'carvão-3kg': '#424242',
    'carvão-5kg': '#424242',
    
    // ===== SEDAS (15 variações) =====
    'seda-tradicional': '#F5F5F5',
    'seda-slim': '#DCDCDC',
    'seda-king size': '#F0F0F0',
    
    // ===== COMBOS E KITS (20 variações) =====
    'kit-festa': '#FF1493',
    'kit-churrasco': '#8B4513',
    'combo-cerveja': '#FFD700',
    'combo-drinks': '#E91E63',
    
    // ===== CACHAÇA (30+ variações) =====
    '51-pirassununga': '#F5F5DC',
    '51-ice': '#E0FFFF',
    'velho barreiro-ouro': '#DAA520',
    'velho barreiro-prata': '#C0C0C0',
    'ypióca-ouro': '#B8860B',
    'ypióca-prata': '#C0C0C0',
    'ypioca-ouro': '#B8860B',
    'ypioca-prata': '#C0C0C0',
    'sagatiba-pura': '#F5F5F5',
    
    // ===== COQUETÉIS (25+ variações) =====
    'caipirinha-tradicional': '#90EE90',
    'caipirinha-morango': '#FF69B4',
    'caipirinha-kiwi': '#32CD32',
    'mojito-tradicional': '#98FB98',
    'mojito-morango': '#FFB6C1',
    'piña colada': '#FFFACD',
    'margarita-limão': '#90EE90',
    'margarita-morango': '#FF69B4',

    // BALY - Cores sólidas por sabor
    'baly-tradicional': '#FFD700', 
    'baly-original': '#FFD700',
    'baly-tropicall': '#FF6B35', 
    'baly-tropical': '#FF6B35',
    'baly-guaraná': '#32CD32', 
    'baly-guarana': '#32CD32',
    'baly-açaí': '#6A0DAD', 
    'baly-acai': '#6A0DAD',
    'baly-limão': '#DFFF00', 
    'baly-limao': '#DFFF00',
    'baly-tutti frutti': '#FF1493',
    'baly-tutti': '#FF1493',
    'baly-tangerina': '#FF8C00',
    'baly-morango': '#FF69B4',
    'baly-coco e açaí': '#87CEEB', 
    'baly-coco e acai': '#87CEEB',
    'baly-coco': '#87CEEB',
    'baly-maracujá': '#FFD700', 
    'baly-maracuja': '#FFD700',
    'baly-freegels cereja': '#DC143C', 
    'baly-cereja': '#DC143C',
    'baly-maçã verde': '#90EE90', 
    'baly-maca verde': '#90EE90',
    'baly-uva': '#9370DB',

    // RED BULL - Cores da identidade visual
    'red bull-tradicional': '#0077BE', 
    'red bull-original': '#0077BE',
    'red bull-blue': '#1E90FF', 
    'red bull-azul': '#1E90FF',
    'red bull-tropicall': '#FFB900', 
    'red bull-tropical': '#FFB900',
    'red bull-yellow': '#FFD700', 
    'red bull-amarelo': '#FFD700',
    'red bull-coconut': '#F5F5F5', 
    'red bull-coco': '#F5F5F5',
    'red bull-watermelon': '#FF6B85', 
    'red bull-melancia': '#FF6B85',
    'red bull-summer': '#FFDB58',
    'red bull-winter': '#B0E0E6',
    'red bull-spring': '#98FB98',
    'red bull-energy': '#0077BE',
    'red bull-red': '#DC143C', 
    'red bull-vermelho': '#DC143C',
    'red bull-silver': '#C0C0C0', 
    'red bull-prata': '#C0C0C0',
    'red bull-verde': '#90EE90', 
    'red bull-green': '#90EE90',
    
    // MONSTER - Cores específicas de cada lata
    'monster-original': '#32CD32', 
    'monster-verde': '#32CD32',
    'monster-ultra': '#E3F2FD', 
    'monster-branco': '#E3F2FD',
    'monster-assault': '#DC143C', 
    'monster-vermelho': '#DC143C',
    'monster-zero': '#1A237E', 
    'monster-preto': '#1A237E',
    'monster-ultra blue': '#4169E1', 
    'monster-azul': '#4169E1',
    'monster-ultra white': '#FAFAFA',
    'monster-ultra violet': '#9370DB', 
    'monster-roxo': '#9370DB',
    'monster-pipeline punch': '#FF69B4',
    'monster-lewis hamilton': '#FFD700',
    'monster-paradise': '#FF6EC7', 
    'monster-rosa': '#FF6EC7',
    'monster-mango': '#FFB347', 
    'monster-manga': '#FFB347',
    
    // COCA-COLA - Refrigerantes
    'coca-cola-original': '#DC143C', 
    'coca-original': '#DC143C',
    'coca-cola-tradicional': '#DC143C',
    'coca-cola-zero': '#8B0000', 
    'coca-zero': '#8B0000',
    'coca-cola-sem açúcar': '#8B0000', 
    'coca-cola-sem acucar': '#8B0000',
    'coca-cola-energy': '#DC143C',
    'coca-cola-cherry': '#8B0000',
    'coca-cola-vanilla': '#F5DEB3',
    'coca-cola-lime': '#32CD32',
    'coca-cola-limão': '#90EE90', 
    'coca-limao': '#90EE90',
    
    // PEPSI - Refrigerantes
    'pepsi-original': '#004B93', 
    'pepsi-tradicional': '#004B93',
    'pepsi-max': '#001F3F',
    'pepsi-cola': '#004B93',
    'pepsi-wild cherry': '#DC143C',
    'pepsi-vanilla': '#F5DEB3',
    'pepsi-zero': '#001F3F',
    'pepsi-black': '#1A1A2E',
    'pepsi-twist': '#90EE90', 
    'pepsi-limão': '#90EE90',
    
    // GUARANÁ - Refrigerantes
    'guaraná-antarctica': '#006633', 
    'guarana-antarctica': '#006633',
    'guaraná-original': '#006633', 
    'guarana-original': '#006633',
    'guaraná-diet': '#90EE90', 
    'guarana-diet': '#90EE90',
    'guaraná-antarctica zero': '#004D29', 
    'guarana-antarctica zero': '#004D29',
    'guaraná-zero': '#004D29', 
    'guarana-zero': '#004D29',
    'guaraná-jesus': '#B8860B', 
    'guarana-jesus': '#B8860B',
    'guaraná-kuat': '#8B4513', 
    'guarana-kuat': '#8B4513',
    
    // FANTA - Refrigerantes
    'fanta-laranja': '#FF8300', 
    'fanta-orange': '#FF8300',
    'fanta-uva': '#8B4789', 
    'fanta-grape': '#8B4789',
    'fanta-maracujá': '#FFD700', 
    'fanta-maracuja': '#FFD700',
    'fanta-limão': '#ADFF2F', 
    'fanta-limao': '#ADFF2F',
    'fanta-melancia': '#FF6B6B',
    'fanta-pêssego': '#FFE5B4', 
    'fanta-pessego': '#FFE5B4',
    'fanta-guaraná': '#FFD700', 
    'fanta-guarana': '#FFD700',
    'fanta-morango': '#FFB6C1', 
    'fanta-strawberry': '#FFB6C1',
    
    // SPRITE - Refrigerantes
    'sprite-original': '#00AA4F', 
    'sprite-tradicional': '#00AA4F',
    'sprite-limão': '#90EE90', 
    'sprite-limao': '#90EE90',
    'sprite-cranberry': '#DC143C',
    'sprite-tropical': '#FFD700',
    'sprite-zero': '#00AA4F',
    
    // KUAT
    'kuat-original': '#8B4513', 
    'kuat-guaraná': '#8B4513',
    
    // TIAL - Sucos
    'tial-laranja': '#FF7F00', 
    'tial-orange': '#FF7F00',
    'tial-abacaxi': '#FFD700',
    'tial-morango': '#C71585',
    'tial-limão': '#BFFF00', 
    'tial-limao': '#BFFF00',
    'tial-melancia': '#FF6B6B',
    'tial-tangerina': '#FFA500',
    'tial-uva': '#6B3FA0', 
    'tial-grape': '#6B3FA0',
    'tial-maracujá': '#FFD700', 
    'tial-maracuja': '#FFD700',
    'tial-goiaba': '#FFB6C1', 
    'tial-guava': '#FFB6C1',
    'tial-manga': '#FFA500', 
    'tial-mango': '#FFA500',
    'tial-pêssego': '#FFDAB9', 
    'tial-pessego': '#FFDAB9',
    
    // MAGUARY - Sucos
    'maguary-laranja': '#FF6347',
    'maguary-abacaxi': '#FFD700',
    'maguary-morango': '#DC143C',
    'maguary-limão': '#ADFF2F', 
    'maguary-limao': '#ADFF2F',
    'maguary-pêssego': '#FFDAB9', 
    'maguary-pessego': '#FFDAB9',
    'maguary-tangerina': '#FFA500',
    'maguary-melancia': '#FF6B6B',
    'maguary-uva': '#8B008B',
    'maguary-maracujá': '#FFD700', 
    'maguary-maracuja': '#FFD700',
    'maguary-goiaba': '#FFB6C1',
    'maguary-manga': '#FFA500',
    
    // DEL VALLE - Sucos
    'del valle-laranja': '#FFA500',
    'del valle-abacaxi': '#FFD700',
    'del valle-morango': '#FFB6C1',
    'del valle-limão': '#ADFF2F', 
    'del valle-limao': '#ADFF2F',
    'del valle-tangerina': '#FFA500',
    'del valle-melancia': '#FF6B6B',
    'del valle-caju': '#FFA07A',
    'del valle-uva': '#9370DB',
    'del valle-maracujá': '#FFD700', 
    'del valle-maracuja': '#FFD700',
    'del valle-pêssego': '#FFDAB9', 
    'del valle-pessego': '#FFDAB9',
    'del valle-manga': '#FFA500',
    
    // GATORADE - Isotônicos
    'gatorade-cool blue': '#4169E1',
    'gatorade-blue': '#4169E1',
    'gatorade-lemon lime': '#ADFF2F',
    'gatorade-limão': '#9ACD32', 
    'gatorade-limao': '#9ACD32',
    'gatorade-fruit punch': '#DC143C',
    'gatorade-tangerina': '#FF8C00',
    'gatorade-maracujá': '#FFD700', 
    'gatorade-maracuja': '#FFD700',
    'gatorade-laranja': '#FF8C00', 
    'gatorade-orange': '#FF8C00',
    'gatorade-uva': '#9370DB',
    'gatorade-morango': '#FFB6C1',
    'gatorade-azul': '#4169E1',
    
    // ADES - Sucos de Soja
    'ades-laranja': '#FFA500',
    'ades-maçã': '#90EE90', 
    'ades-maca': '#90EE90',
    'ades-uva': '#9370DB',
    'ades-pêssego': '#FFDAB9', 
    'ades-pessego': '#FFDAB9',
    'ades-original': '#F5DEB3',
    
    // TANG - Sucos em Pó
    'tang-laranja': '#FFA500',
    'tang-uva': '#9370DB',
    'tang-limão': '#ADFF2F', 
    'tang-limao': '#ADFF2F',
    'tang-maracujá': '#FFD700', 
    'tang-maracuja': '#FFD700',
    
    // BEATS - Drinks
    'beats-senses': '#E91E63', 
    'beats-rosa': '#E91E63',
    'beats-pink': '#E91E63',
    'beats-gt': '#FF5722', 
    'beats-laranja': '#FF5722',
    'beats-original': '#FF5722',
    'beats-black': '#4A0E0E',
    'beats-red': '#DC143C',
    'beats-passion': '#FF1493',
    'beats-zero': '#424242',
    
    // SMIRNOFF - Drinks
    'smirnoff-ice': '#E1F5FE',
    'smirnoff-red': '#DC143C',
    'smirnoff-green apple': '#90EE90',
    'smirnoff-raspberry': '#DC143C',
    'smirnoff-original': '#E1F5FE',
    
    // XEQUE MATE
    'xeque mate-original': '#FFD700',
    'xeque mate-limão': '#90EE90', 
    'xeque mate-limao': '#90EE90',
    'xeque mate-morango': '#FFB6C1',
    
    // COROTE - Destilados
    'corote-uva': '#9370DB',
    'corote-morango': '#FFB6C1',
    'corote-limão': '#90EE90', 
    'corote-limao': '#90EE90',
    'corote-pêssego': '#FFDAB9', 
    'corote-pessego': '#FFDAB9',
    
    // VINHOS
    'vinho-tinto': '#8B0000',
    'vinho-branco': '#F5DEB3',
    'vinho-rosé': '#FFB6C1', 
    'vinho-rose': '#FFB6C1',
    'vinho-suave': '#DC143C',
    'vinho-seco': '#8B0000',
  };

  // Extrair marca do nome do produto
  let brand = '';
  if (normalizedName.includes('baly')) brand = 'baly';
  else if (normalizedName.includes('red bull')) brand = 'red bull';
  else if (normalizedName.includes('monster')) brand = 'monster';
  else if (normalizedName.includes('coca-cola') || normalizedName.includes('coca cola')) brand = 'coca-cola';
  else if (normalizedName.includes('coca')) brand = 'coca-cola';
  else if (normalizedName.includes('pepsi')) brand = 'pepsi';
  else if (normalizedName.includes('guaraná') || normalizedName.includes('guarana')) brand = 'guaraná';
  else if (normalizedName.includes('fanta')) brand = 'fanta';
  else if (normalizedName.includes('sprite')) brand = 'sprite';
  else if (normalizedName.includes('kuat')) brand = 'kuat';
  else if (normalizedName.includes('tial')) brand = 'tial';
  else if (normalizedName.includes('maguary')) brand = 'maguary';
  else if (normalizedName.includes('del valle')) brand = 'del valle';
  else if (normalizedName.includes('gatorade')) brand = 'gatorade';
  else if (normalizedName.includes('ades')) brand = 'ades';
  else if (normalizedName.includes('tang')) brand = 'tang';
  else if (normalizedName.includes('beats')) brand = 'beats';
  else if (normalizedName.includes('smirnoff')) brand = 'smirnoff';
  else if (normalizedName.includes('xeque mate')) brand = 'xeque mate';
  else if (normalizedName.includes('corote')) brand = 'corote';
  else if (normalizedName.includes('h2oh')) brand = 'h2oh';
  else if (normalizedName.includes('vinho')) brand = 'vinho';

  // Estratégia 1: brand-flavor com espaço
  if (brand && colorMap[`${brand} ${normalizedFlavor}`]) {
    return colorMap[`${brand} ${normalizedFlavor}`];
  }
  
  // Estratégia 2: brand-flavor com hífen
  if (brand && colorMap[`${brand}-${normalizedFlavor}`]) {
    return colorMap[`${brand}-${normalizedFlavor}`];
  }
  
  // Estratégia 3: Buscar palavras-chave do flavor no nome completo
  for (const [mapKey, color] of Object.entries(colorMap)) {
    const keyParts = mapKey.split(/[-\s]/);
    const keyBrand = keyParts[0];
    const keyFlavor = keyParts.slice(1).join(' ');
    
    if (brand === keyBrand && keyFlavor && normalizedName.includes(keyFlavor)) {
      return color;
    }
  }
  
  // Estratégia 4: Buscar apenas por flavor contido no nome (sem marca)
  for (const [mapKey, color] of Object.entries(colorMap)) {
    const flavorPart = mapKey.split(/[-\s]/).slice(1).join(' ');
    if (flavorPart.length > 3 && normalizedName.includes(flavorPart)) {
      return color;
    }
  }

  // Fallbacks por marca (gradientes suaves)
  const brandColors: Record<string, string> = {
    'coca': 'linear-gradient(135deg, #DC143C 0%, #A52A2A 100%)',
    'pepsi': 'linear-gradient(135deg, #0047AB 0%, #4682B4 100%)',
    'fanta': 'linear-gradient(135deg, #FF8300 0%, #FF6600 100%)',
    'sprite': 'linear-gradient(135deg, #00AA4F 0%, #90EE90 100%)',
    'guaraná': 'linear-gradient(135deg, #DC143C 0%, #FF6B6B 100%)',
    'red bull': 'linear-gradient(135deg, #0077BE 0%, #00A0D6 100%)',
    'monster': 'linear-gradient(135deg, #32CD32 0%, #228B22 100%)',
    'beats': 'linear-gradient(135deg, #E91E63 0%, #F06292 100%)',
    'gatorade': 'linear-gradient(135deg, #4169E1 0%, #1E90FF 100%)',
    'heineken': 'linear-gradient(135deg, #008000 0%, #228B22 100%)',
    'brahma': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'skol': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'lacta': 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    'doritos': 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)',
    'ruffles': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'absolut': 'linear-gradient(135deg, #4682B4 0%, #5F9EA0 100%)',
    'crystal': 'linear-gradient(135deg, #4169E1 0%, #1E90FF 100%)',
    'marlboro': 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
  };

  return brandColors[brand] || 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)';
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
