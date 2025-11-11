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
  'Gelos': { groupBy: ['size'], extractSize: true, extractFlavor: true },
  'Gelo': { groupBy: ['size'], extractSize: true, extractFlavor: true },
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
    'heineken-original': 'linear-gradient(135deg, #008000 0%, #228B22 100%)',
    'heineken-zero': 'linear-gradient(135deg, #006400 0%, #008000 100%)',
    'heineken-puro malte': 'linear-gradient(135deg, #228B22 0%, #32CD32 100%)',
    'brahma-chopp': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'brahma-duplo malte': 'linear-gradient(135deg, #B8860B 0%, #DAA520 100%)',
    'brahma-zero': 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    'brahma-extra lager': 'linear-gradient(135deg, #FFD700 0%, #FFC300 100%)',
    'brahma-malzbier': 'linear-gradient(135deg, #654321 0%, #8B4513 100%)',
    'skol-pilsen': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'skol-beats': 'linear-gradient(135deg, #FF1493 0%, #FF69B4 100%)',
    'skol-hops': 'linear-gradient(135deg, #32CD32 0%, #90EE90 100%)',
    'antarctica-original': 'linear-gradient(135deg, #0077BE 0%, #4682B4 100%)',
    'antarctica-sub zero': 'linear-gradient(135deg, #00BFFF 0%, #87CEEB 100%)',
    'budweiser-original': 'linear-gradient(135deg, #DC143C 0%, #FF6B6B 100%)',
    'stella artois-original': 'linear-gradient(135deg, #DAA520 0%, #FFD700 100%)',
    'corona-extra': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'corona-cero': 'linear-gradient(135deg, #F0E68C 0%, #FFD700 100%)',
    'original-original': 'linear-gradient(135deg, #1E90FF 0%, #4682B4 100%)',
    'spaten-original': 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    'devassa-bem loura': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'devassa-bem black': 'linear-gradient(135deg, #2F4F4F 0%, #1A237E 100%)',
    'bohemia-pilsen': 'linear-gradient(135deg, #DAA520 0%, #FFD700 100%)',
    'bohemia-weiss': 'linear-gradient(135deg, #F5DEB3 0%, #FFDEAD 100%)',
    'eisenbahn-pilsen': 'linear-gradient(135deg, #FFD700 0%, #FFC300 100%)',
    'eisenbahn-strong golden ale': 'linear-gradient(135deg, #B8860B 0%, #DAA520 100%)',
    'petra-puro malte': 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    'itaipava-pilsen': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'itaipava-premium': 'linear-gradient(135deg, #B8860B 0%, #DAA520 100%)',
    'kaiser-pilsen': 'linear-gradient(135deg, #FFD700 0%, #FFC300 100%)',
    'kaiser-bock': 'linear-gradient(135deg, #8B4513 0%, #654321 100%)',
    'caracu-malzbier': 'linear-gradient(135deg, #4A0404 0%, #8B0000 100%)',
    'serramalte-original': 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    'serramalte-preta': 'linear-gradient(135deg, #424242 0%, #616161 100%)',
    'bavaria-original': 'linear-gradient(135deg, #32CD32 0%, #90EE90 100%)',
    'bavaria-premium': 'linear-gradient(135deg, #228B22 0%, #32CD32 100%)',
    
    // ===== CHOCOLATES (50+ variações) =====
    'lacta-ao leite': 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    'lacta-diamante negro': 'linear-gradient(135deg, #4A0E0E 0%, #8B0000 100%)',
    'lacta-ouro branco': 'linear-gradient(135deg, #F5F5DC 0%, #FAFAD2 100%)',
    'lacta-sonho de valsa': 'linear-gradient(135deg, #FF1493 0%, #FFB6C1 100%)',
    'lacta-serenata de amor': 'linear-gradient(135deg, #8B008B 0%, #9370DB 100%)',
    'lacta-bis': 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    'nestlé-classic': 'linear-gradient(135deg, #DC143C 0%, #A52A2A 100%)',
    'nestle-classic': 'linear-gradient(135deg, #DC143C 0%, #A52A2A 100%)',
    'nestlé-crunch': 'linear-gradient(135deg, #4169E1 0%, #1E90FF 100%)',
    'nestlé-alpino': 'linear-gradient(135deg, #4682B4 0%, #5F9EA0 100%)',
    'garoto-baton': 'linear-gradient(135deg, #DC143C 0%, #FF6B6B 100%)',
    'garoto-talento': 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    'hershey-ao leite': 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    'hershey-cookies cream': 'linear-gradient(135deg, #F5F5F5 0%, #DCDCDC 100%)',
    'ferrero-rocher': 'linear-gradient(135deg, #DAA520 0%, #FFD700 100%)',
    'kitkat-original': 'linear-gradient(135deg, #DC143C 0%, #FF6B6B 100%)',
    'kitkat-branco': 'linear-gradient(135deg, #F5F5F5 0%, #FAFAFA 100%)',
    'snickers-original': 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    'm&m-amendoim': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'm&m-chocolate': 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    'twix-original': 'linear-gradient(135deg, #B8860B 0%, #DAA520 100%)',
    'milka-ao leite': 'linear-gradient(135deg, #9370DB 0%, #8B4789 100%)',
    'milka-oreo': 'linear-gradient(135deg, #6A5ACD 0%, #9370DB 100%)',
    'toblerone-original': 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
    'lindt-excellence': 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
    
    // ===== SNACKS (80+ variações) =====
    'doritos-queijo': 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)',
    'doritos-nacho': 'linear-gradient(135deg, #DC143C 0%, #FF6B6B 100%)',
    'doritos-cool ranch': 'linear-gradient(135deg, #4169E1 0%, #1E90FF 100%)',
    'doritos-picante': 'linear-gradient(135deg, #FF4500 0%, #FF6347 100%)',
    'ruffles-original': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'ruffles-cebola': 'linear-gradient(135deg, #F5DEB3 0%, #DEB887 100%)',
    'ruffles-churrasco': 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    'lays-original': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'lays-barbecue': 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    'lays-cebola': 'linear-gradient(135deg, #F5DEB3 0%, #DEB887 100%)',
    'pringles-original': 'linear-gradient(135deg, #DC143C 0%, #FF6B6B 100%)',
    'pringles-cebola': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)',
    'pringles-queijo': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'cheetos-requeijão': 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)',
    'cheetos-lua': 'linear-gradient(135deg, #FFD700 0%, #FFC300 100%)',
    'fandangos-presunto': 'linear-gradient(135deg, #FF69B4 0%, #FFB6C1 100%)',
    'fandangos-queijo': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'baconzitos-original': 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    'torcida-original': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'torcida-pizza': 'linear-gradient(135deg, #DC143C 0%, #FF6B6B 100%)',
    
    // ===== DESTILADOS (60+ variações) =====
    'absolut-original': 'linear-gradient(135deg, #4682B4 0%, #5F9EA0 100%)',
    'absolut-citron': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'absolut-raspberri': 'linear-gradient(135deg, #DC143C 0%, #FF6B6B 100%)',
    'smirnoff-vodka': 'linear-gradient(135deg, #DC143C 0%, #FF6B6B 100%)',
    'smirnoff-grape': 'linear-gradient(135deg, #9370DB 0%, #8B4789 100%)',
    'jack daniel-tennessee': 'linear-gradient(135deg, #424242 0%, #616161 100%)',
    'jack daniel-honey': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'johnnie walker-red': 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
    'johnnie walker-black': 'linear-gradient(135deg, #424242 0%, #616161 100%)',
    'chivas-regal': 'linear-gradient(135deg, #4169E1 0%, #1E90FF 100%)',
    'baileys-original': 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    
    // ===== ÁGUAS SABORIZADAS (30+ variações) =====
    'crystal-limão': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)',
    'crystal-morango': 'linear-gradient(135deg, #FF69B4 0%, #FFB6C1 100%)',
    'crystal-abacaxi': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'bonafont-original': 'linear-gradient(135deg, #4169E1 0%, #1E90FF 100%)',
    'bonafont-limão': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)',
    'lindoya-verão': 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)',
    'h2oh-limão': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)',
    'h2oh-limoneto': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    
    // ===== CIGARROS (40+ variações) =====
    'marlboro-red': 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
    'marlboro-gold': 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
    'marlboro-ice': 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)',
    'lucky strike-red': 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
    'lucky strike-blue': 'linear-gradient(135deg, #4169E1 0%, #1E90FF 100%)',
    'camel-yellow': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'camel-blue': 'linear-gradient(135deg, #4169E1 0%, #1E90FF 100%)',
    
    // ===== GELOS (10 variações) =====
    'gelo-cubo 1kg': 'linear-gradient(135deg, #E0FFFF 0%, #AFEEEE 100%)',
    'gelo-cubo 2kg': 'linear-gradient(135deg, #B0E0E6 0%, #87CEEB 100%)',
    'gelo-picado 1kg': 'linear-gradient(135deg, #E0FFFF 0%, #B0E0E6 100%)',
    'gelo-escama 1kg': 'linear-gradient(135deg, #F0FFFF 0%, #E0FFFF 100%)',
    
    // ===== CARVÃO (5 variações) =====
    'carvão-3kg': 'linear-gradient(135deg, #424242 0%, #616161 100%)',
    'carvão-5kg': 'linear-gradient(135deg, #424242 0%, #757575 100%)',
    
    // ===== SEDAS (15 variações) =====
    'seda-tradicional': 'linear-gradient(135deg, #F5F5F5 0%, #E8E8E8 100%)',
    'seda-slim': 'linear-gradient(135deg, #DCDCDC 0%, #C0C0C0 100%)',
    'seda-king size': 'linear-gradient(135deg, #F0F0F0 0%, #D3D3D3 100%)',
    
    // ===== COMBOS E KITS (20 variações) =====
    'kit-festa': 'linear-gradient(135deg, #FF1493 0%, #FF69B4 100%)',
    'kit-churrasco': 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    'combo-cerveja': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'combo-drinks': 'linear-gradient(135deg, #E91E63 0%, #F06292 100%)',
    
    // ===== CACHAÇA (30+ variações) =====
    '51-pirassununga': 'linear-gradient(135deg, #F5F5DC 0%, #FAFAD2 100%)',
    '51-ice': 'linear-gradient(135deg, #E0FFFF 0%, #B0E0E6 100%)',
    'velho barreiro-ouro': 'linear-gradient(135deg, #DAA520 0%, #FFD700 100%)',
    'velho barreiro-prata': 'linear-gradient(135deg, #C0C0C0 0%, #E8E8E8 100%)',
    'ypióca-ouro': 'linear-gradient(135deg, #B8860B 0%, #DAA520 100%)',
    'ypióca-prata': 'linear-gradient(135deg, #C0C0C0 0%, #E8E8E8 100%)',
    'ypioca-ouro': 'linear-gradient(135deg, #B8860B 0%, #DAA520 100%)',
    'ypioca-prata': 'linear-gradient(135deg, #C0C0C0 0%, #E8E8E8 100%)',
    'sagatiba-pura': 'linear-gradient(135deg, #F5F5F5 0%, #E8E8E8 100%)',
    
    // ===== COQUETÉIS (25+ variações) =====
    'caipirinha-tradicional': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)',
    'caipirinha-morango': 'linear-gradient(135deg, #FF69B4 0%, #FFB6C1 100%)',
    'caipirinha-kiwi': 'linear-gradient(135deg, #32CD32 0%, #90EE90 100%)',
    'mojito-tradicional': 'linear-gradient(135deg, #98FB98 0%, #00FA9A 100%)',
    'mojito-morango': 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
    'piña colada': 'linear-gradient(135deg, #FFFACD 0%, #F5F5DC 100%)',
    'margarita-limão': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)',
    'margarita-morango': 'linear-gradient(135deg, #FF69B4 0%, #FFB6C1 100%)',

    // BALY - Gradientes por sabor
    'baly-tradicional': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', 
    'baly-original': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'baly-tropicall': 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)', 
    'baly-tropical': 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    'baly-guaraná': 'linear-gradient(135deg, #32CD32 0%, #90EE90 100%)', 
    'baly-guarana': 'linear-gradient(135deg, #32CD32 0%, #90EE90 100%)',
    'baly-açaí': 'linear-gradient(135deg, #6A0DAD 0%, #9370DB 100%)', 
    'baly-acai': 'linear-gradient(135deg, #6A0DAD 0%, #9370DB 100%)',
    'baly-limão': 'linear-gradient(135deg, #DFFF00 0%, #CCFF00 100%)', 
    'baly-limao': 'linear-gradient(135deg, #DFFF00 0%, #CCFF00 100%)',
    'baly-tutti frutti': 'linear-gradient(135deg, #FF1493 0%, #FF69B4 100%)',
    'baly-tutti': 'linear-gradient(135deg, #FF1493 0%, #FF69B4 100%)',
    'baly-tangerina': 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)',
    'baly-morango': 'linear-gradient(135deg, #FF69B4 0%, #FFB6C1 100%)',
    'baly-coco e açaí': 'linear-gradient(135deg, #87CEEB 0%, #6A5ACD 100%)', 
    'baly-coco e acai': 'linear-gradient(135deg, #87CEEB 0%, #6A5ACD 100%)',
    'baly-coco': 'linear-gradient(135deg, #87CEEB 0%, #B0E0E6 100%)',
    'baly-maracujá': 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)', 
    'baly-maracuja': 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
    'baly-freegels cereja': 'linear-gradient(135deg, #DC143C 0%, #FF6B6B 100%)', 
    'baly-cereja': 'linear-gradient(135deg, #DC143C 0%, #FF6B6B 100%)',
    'baly-maçã verde': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)', 
    'baly-maca verde': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)',
    'baly-uva': 'linear-gradient(135deg, #9370DB 0%, #8B4789 100%)',
    
    // RED BULL - Cores da identidade visual
    'red bull-tradicional': 'linear-gradient(135deg, #0077BE 0%, #00A0D6 100%)', 
    'red bull-original': 'linear-gradient(135deg, #0077BE 0%, #00A0D6 100%)',
    'red bull-blue': 'linear-gradient(135deg, #1E90FF 0%, #4682B4 100%)', 
    'red bull-azul': 'linear-gradient(135deg, #1E90FF 0%, #4682B4 100%)',
    'red bull-tropicall': 'linear-gradient(135deg, #FFB900 0%, #FF8C00 100%)', 
    'red bull-tropical': 'linear-gradient(135deg, #FFB900 0%, #FF8C00 100%)',
    'red bull-yellow': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', 
    'red bull-amarelo': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'red bull-coconut': 'linear-gradient(135deg, #F5F5F5 0%, #E8E8E8 100%)', 
    'red bull-coco': 'linear-gradient(135deg, #F5F5F5 0%, #E8E8E8 100%)',
    'red bull-watermelon': 'linear-gradient(135deg, #FF6B85 0%, #FC6C85 100%)', 
    'red bull-melancia': 'linear-gradient(135deg, #FF6B85 0%, #FC6C85 100%)',
    'red bull-summer': 'linear-gradient(135deg, #FFDB58 0%, #FFD700 100%)',
    'red bull-winter': 'linear-gradient(135deg, #B0E0E6 0%, #87CEEB 100%)',
    'red bull-spring': 'linear-gradient(135deg, #98FB98 0%, #90EE90 100%)',
    'red bull-energy': 'linear-gradient(135deg, #0077BE 0%, #00A0D6 100%)',
    'red bull-red': 'linear-gradient(135deg, #DC143C 0%, #B22222 100%)', 
    'red bull-vermelho': 'linear-gradient(135deg, #DC143C 0%, #B22222 100%)',
    'red bull-silver': 'linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 100%)', 
    'red bull-prata': 'linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 100%)',
    'red bull-verde': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)', 
    'red bull-green': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)',
    
    // MONSTER - Cores específicas de cada lata
    'monster-original': 'linear-gradient(135deg, #32CD32 0%, #228B22 100%)', 
    'monster-verde': 'linear-gradient(135deg, #32CD32 0%, #228B22 100%)',
    'monster-ultra': 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)', 
    'monster-branco': 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
    'monster-assault': 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)', 
    'monster-vermelho': 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
    'monster-zero': 'linear-gradient(135deg, #1A237E 0%, #0D47A1 100%)', 
    'monster-preto': 'linear-gradient(135deg, #1A237E 0%, #0D47A1 100%)',
    'monster-ultra blue': 'linear-gradient(135deg, #4169E1 0%, #1E3A8A 100%)', 
    'monster-azul': 'linear-gradient(135deg, #4169E1 0%, #1E3A8A 100%)',
    'monster-ultra white': 'linear-gradient(135deg, #FAFAFA 0%, #E8E8E8 100%)',
    'monster-ultra violet': 'linear-gradient(135deg, #9370DB 0%, #6A0DAD 100%)', 
    'monster-roxo': 'linear-gradient(135deg, #9370DB 0%, #6A0DAD 100%)',
    'monster-pipeline punch': 'linear-gradient(135deg, #FF69B4 0%, #FF1493 100%)',
    'monster-lewis hamilton': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'monster-paradise': 'linear-gradient(135deg, #FF6EC7 0%, #FF1493 100%)', 
    'monster-rosa': 'linear-gradient(135deg, #FF6EC7 0%, #FF1493 100%)',
    'monster-mango': 'linear-gradient(135deg, #FFB347 0%, #FF8C00 100%)', 
    'monster-manga': 'linear-gradient(135deg, #FFB347 0%, #FF8C00 100%)',
    
    // COCA-COLA - Refrigerantes
    'coca-cola-original': 'linear-gradient(135deg, #DC143C 0%, #A52A2A 100%)', 
    'coca-original': 'linear-gradient(135deg, #DC143C 0%, #A52A2A 100%)',
    'coca-cola-tradicional': 'linear-gradient(135deg, #DC143C 0%, #A52A2A 100%)',
    'coca-cola-zero': 'linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #4A0404 100%)', 
    'coca-zero': 'linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #4A0404 100%)',
    'coca-cola-sem açúcar': 'linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #4A0404 100%)', 
    'coca-cola-sem acucar': 'linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #4A0404 100%)',
    'coca-cola-energy': 'linear-gradient(135deg, #DC143C 0%, #A52A2A 100%)',
    'coca-cola-cherry': 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
    'coca-cola-vanilla': 'linear-gradient(135deg, #F5DEB3 0%, #DEB887 100%)',
    'coca-cola-lime': 'linear-gradient(135deg, #32CD32 0%, #90EE90 100%)',
    'coca-cola-limão': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)', 
    'coca-limao': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)',
    
    // PEPSI - Refrigerantes
    'pepsi-original': 'linear-gradient(135deg, #004B93 0%, #0066CC 100%)', 
    'pepsi-tradicional': 'linear-gradient(135deg, #004B93 0%, #0066CC 100%)',
    'pepsi-max': 'linear-gradient(135deg, #001F3F 0%, #003366 100%)',
    'pepsi-cola': 'linear-gradient(135deg, #004B93 0%, #0066CC 100%)',
    'pepsi-wild cherry': 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
    'pepsi-vanilla': 'linear-gradient(135deg, #F5DEB3 0%, #DEB887 100%)',
    'pepsi-zero': 'linear-gradient(135deg, #001F3F 0%, #004B93 100%)',
    'pepsi-black': 'linear-gradient(135deg, #1A1A2E 0%, #003366 100%)',
    'pepsi-twist': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)', 
    'pepsi-limão': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)',
    
    // GUARANÁ - Refrigerantes
    'guaraná-antarctica': 'linear-gradient(135deg, #006633 0%, #009966 100%)', 
    'guarana-antarctica': 'linear-gradient(135deg, #006633 0%, #009966 100%)',
    'guaraná-original': 'linear-gradient(135deg, #006633 0%, #009966 100%)', 
    'guarana-original': 'linear-gradient(135deg, #006633 0%, #009966 100%)',
    'guaraná-diet': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)', 
    'guarana-diet': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)',
    'guaraná-antarctica zero': 'linear-gradient(135deg, #004D29 0%, #006633 100%)', 
    'guarana-antarctica zero': 'linear-gradient(135deg, #004D29 0%, #006633 100%)',
    'guaraná-zero': 'linear-gradient(135deg, #004D29 0%, #006633 100%)', 
    'guarana-zero': 'linear-gradient(135deg, #004D29 0%, #006633 100%)',
    'guaraná-jesus': 'linear-gradient(135deg, #B8860B 0%, #DAA520 100%)', 
    'guarana-jesus': 'linear-gradient(135deg, #B8860B 0%, #DAA520 100%)',
    'guaraná-kuat': 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)', 
    'guarana-kuat': 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    
    // FANTA - Refrigerantes
    'fanta-laranja': 'linear-gradient(135deg, #FF8300 0%, #FF6600 100%)', 
    'fanta-orange': 'linear-gradient(135deg, #FF8300 0%, #FF6600 100%)',
    'fanta-uva': 'linear-gradient(135deg, #8B4789 0%, #6A0DAD 100%)', 
    'fanta-grape': 'linear-gradient(135deg, #8B4789 0%, #6A0DAD 100%)',
    'fanta-maracujá': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', 
    'fanta-maracuja': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'fanta-limão': 'linear-gradient(135deg, #ADFF2F 0%, #32CD32 100%)', 
    'fanta-limao': 'linear-gradient(135deg, #ADFF2F 0%, #32CD32 100%)',
    'fanta-melancia': 'linear-gradient(135deg, #FF6B6B 0%, #FF8585 100%)',
    'fanta-pêssego': 'linear-gradient(135deg, #FFE5B4 0%, #FFDAB9 100%)', 
    'fanta-pessego': 'linear-gradient(135deg, #FFE5B4 0%, #FFDAB9 100%)',
    'fanta-guaraná': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', 
    'fanta-guarana': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'fanta-morango': 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)', 
    'fanta-strawberry': 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
    
    // SPRITE - Refrigerantes
    'sprite-original': 'linear-gradient(135deg, #00AA4F 0%, #90EE90 100%)', 
    'sprite-tradicional': 'linear-gradient(135deg, #00AA4F 0%, #90EE90 100%)',
    'sprite-limão': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)', 
    'sprite-limao': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)',
    'sprite-cranberry': 'linear-gradient(135deg, #DC143C 0%, #FF6B6B 100%)',
    'sprite-tropical': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'sprite-zero': 'linear-gradient(135deg, #00AA4F 0%, #90EE90 100%)',
    
    // KUAT
    'kuat-original': 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)', 
    'kuat-guaraná': 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    
    // TIAL - Sucos
    'tial-laranja': 'linear-gradient(135deg, #FF7F00 0%, #FFA500 100%)', 
    'tial-orange': 'linear-gradient(135deg, #FF7F00 0%, #FFA500 100%)',
    'tial-abacaxi': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'tial-morango': 'linear-gradient(135deg, #C71585 0%, #FF69B4 100%)',
    'tial-limão': 'linear-gradient(135deg, #BFFF00 0%, #90EE90 100%)', 
    'tial-limao': 'linear-gradient(135deg, #BFFF00 0%, #90EE90 100%)',
    'tial-melancia': 'linear-gradient(135deg, #FF6B6B 0%, #FF8585 100%)',
    'tial-tangerina': 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
    'tial-uva': 'linear-gradient(135deg, #6B3FA0 0%, #8B4789 100%)', 
    'tial-grape': 'linear-gradient(135deg, #6B3FA0 0%, #8B4789 100%)',
    'tial-maracujá': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', 
    'tial-maracuja': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'tial-goiaba': 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)', 
    'tial-guava': 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
    'tial-manga': 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)', 
    'tial-mango': 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
    'tial-pêssego': 'linear-gradient(135deg, #FFDAB9 0%, #FFE5B4 100%)', 
    'tial-pessego': 'linear-gradient(135deg, #FFDAB9 0%, #FFE5B4 100%)',
    
    // MAGUARY - Sucos
    'maguary-laranja': 'linear-gradient(135deg, #FF6347 0%, #FF8C00 100%)',
    'maguary-abacaxi': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'maguary-morango': 'linear-gradient(135deg, #DC143C 0%, #FF6B6B 100%)',
    'maguary-limão': 'linear-gradient(135deg, #ADFF2F 0%, #32CD32 100%)', 
    'maguary-limao': 'linear-gradient(135deg, #ADFF2F 0%, #32CD32 100%)',
    'maguary-pêssego': 'linear-gradient(135deg, #FFDAB9 0%, #FFE5B4 100%)', 
    'maguary-pessego': 'linear-gradient(135deg, #FFDAB9 0%, #FFE5B4 100%)',
    'maguary-tangerina': 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
    'maguary-melancia': 'linear-gradient(135deg, #FF6B6B 0%, #FF8585 100%)',
    'maguary-uva': 'linear-gradient(135deg, #8B008B 0%, #9370DB 100%)',
    'maguary-maracujá': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', 
    'maguary-maracuja': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'maguary-goiaba': 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
    'maguary-manga': 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
    
    // DEL VALLE - Sucos
    'del valle-laranja': 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
    'del valle-abacaxi': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'del valle-morango': 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
    'del valle-limão': 'linear-gradient(135deg, #ADFF2F 0%, #32CD32 100%)', 
    'del valle-limao': 'linear-gradient(135deg, #ADFF2F 0%, #32CD32 100%)',
    'del valle-tangerina': 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
    'del valle-melancia': 'linear-gradient(135deg, #FF6B6B 0%, #FF8585 100%)',
    'del valle-caju': 'linear-gradient(135deg, #FFA07A 0%, #FF8C69 100%)',
    'del valle-uva': 'linear-gradient(135deg, #9370DB 0%, #8B4789 100%)',
    'del valle-maracujá': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', 
    'del valle-maracuja': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'del valle-pêssego': 'linear-gradient(135deg, #FFDAB9 0%, #FFE5B4 100%)', 
    'del valle-pessego': 'linear-gradient(135deg, #FFDAB9 0%, #FFE5B4 100%)',
    'del valle-manga': 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
    
    // GATORADE - Isotônicos
    'gatorade-cool blue': 'linear-gradient(135deg, #4169E1 0%, #1E90FF 100%)',
    'gatorade-blue': 'linear-gradient(135deg, #4169E1 0%, #1E90FF 100%)',
    'gatorade-lemon lime': 'linear-gradient(135deg, #ADFF2F 0%, #32CD32 100%)',
    'gatorade-limão': 'linear-gradient(135deg, #9ACD32 0%, #32CD32 100%)', 
    'gatorade-limao': 'linear-gradient(135deg, #9ACD32 0%, #32CD32 100%)',
    'gatorade-fruit punch': 'linear-gradient(135deg, #DC143C 0%, #FF6B6B 100%)',
    'gatorade-tangerina': 'linear-gradient(135deg, #FF8C00 0%, #FFB347 100%)',
    'gatorade-maracujá': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', 
    'gatorade-maracuja': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'gatorade-laranja': 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)', 
    'gatorade-orange': 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)',
    'gatorade-uva': 'linear-gradient(135deg, #9370DB 0%, #8B4789 100%)',
    'gatorade-morango': 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
    'gatorade-azul': 'linear-gradient(135deg, #4169E1 0%, #1E90FF 100%)',
    
    // ADES - Sucos de Soja
    'ades-laranja': 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
    'ades-maçã': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)', 
    'ades-maca': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)',
    'ades-uva': 'linear-gradient(135deg, #9370DB 0%, #8B4789 100%)',
    'ades-pêssego': 'linear-gradient(135deg, #FFDAB9 0%, #FFE5B4 100%)', 
    'ades-pessego': 'linear-gradient(135deg, #FFDAB9 0%, #FFE5B4 100%)',
    'ades-original': 'linear-gradient(135deg, #F5DEB3 0%, #DEB887 100%)',
    
    // TANG - Sucos em Pó
    'tang-laranja': 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
    'tang-uva': 'linear-gradient(135deg, #9370DB 0%, #8B4789 100%)',
    'tang-limão': 'linear-gradient(135deg, #ADFF2F 0%, #32CD32 100%)', 
    'tang-limao': 'linear-gradient(135deg, #ADFF2F 0%, #32CD32 100%)',
    'tang-maracujá': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', 
    'tang-maracuja': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    
    // BEATS - Drinks
    'beats-senses': 'linear-gradient(135deg, #E91E63 0%, #F06292 100%)', 
    'beats-rosa': 'linear-gradient(135deg, #E91E63 0%, #F06292 100%)',
    'beats-pink': 'linear-gradient(135deg, #E91E63 0%, #F06292 100%)',
    'beats-gt': 'linear-gradient(135deg, #FF5722 0%, #FF8A65 100%)', 
    'beats-laranja': 'linear-gradient(135deg, #FF5722 0%, #FF8A65 100%)',
    'beats-original': 'linear-gradient(135deg, #FF5722 0%, #FF8A65 100%)',
    'beats-black': 'linear-gradient(135deg, #4A0E0E 0%, #8B0000 100%)',
    'beats-red': 'linear-gradient(135deg, #DC143C 0%, #FF6B6B 100%)',
    'beats-passion': 'linear-gradient(135deg, #FF1493 0%, #FF69B4 100%)',
    'beats-zero': 'linear-gradient(135deg, #424242 0%, #757575 100%)',
    
    // SMIRNOFF - Drinks
    'smirnoff-ice': 'linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%)',
    'smirnoff-red': 'linear-gradient(135deg, #DC143C 0%, #FF6B6B 100%)',
    'smirnoff-green apple': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)',
    'smirnoff-raspberry': 'linear-gradient(135deg, #DC143C 0%, #FF6B6B 100%)',
    'smirnoff-original': 'linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%)',
    
    // XEQUE MATE
    'xeque mate-original': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    'xeque mate-limão': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)', 
    'xeque mate-limao': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)',
    'xeque mate-morango': 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
    
    // COROTE - Destilados
    'corote-uva': 'linear-gradient(135deg, #9370DB 0%, #8B4789 100%)',
    'corote-morango': 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
    'corote-limão': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)', 
    'corote-limao': 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)',
    'corote-pêssego': 'linear-gradient(135deg, #FFDAB9 0%, #FFE5B4 100%)', 
    'corote-pessego': 'linear-gradient(135deg, #FFDAB9 0%, #FFE5B4 100%)',
    
    // H2OH - Águas Saborizadas
    'h2oh-limão': 'linear-gradient(135deg, #ADFF2F 0%, #32CD32 100%)', 
    'h2oh-limao': 'linear-gradient(135deg, #ADFF2F 0%, #32CD32 100%)',
    'h2oh-limoneto': 'linear-gradient(135deg, #ADFF2F 0%, #32CD32 100%)',
    
    // VINHOS
    'vinho-tinto': 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
    'vinho-branco': 'linear-gradient(135deg, #F5DEB3 0%, #DEB887 100%)',
    'vinho-rosé': 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)', 
    'vinho-rose': 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
    'vinho-suave': 'linear-gradient(135deg, #DC143C 0%, #FF6B6B 100%)',
    'vinho-seco': 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
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
