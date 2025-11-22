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
  'Tabacaria': { groupBy: ['type'], extractSize: false, extractFlavor: false },
  'Cigarros - Maço': { groupBy: ['type'], extractSize: false, extractFlavor: false },
  'Cigarros - Picado': { groupBy: ['type'], extractSize: false, extractFlavor: false },
  'Isqueiro': { groupBy: ['type'], extractSize: false, extractFlavor: true },
  'Piteira': { groupBy: ['type'], extractSize: false, extractFlavor: false },
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
  tabacaria: /^(Lucky Strike|Brothers|Dunhill|Derby|Marlboro|Seda|OCB|Smoking|BIC|Isqueiro|Piteira)\s*/i,
  combos: /^(Combo|Kit|Pack|Promoção|Promocao)\s*/i,
  seda: /^(Seda|Papel|Piteira)\s*/i,
  cervejas: /^(Heineken|Brahma|Skol|Antarctica|Budweiser|Stella Artois|Stella|Corona|Original|Spaten|Devassa|Bohemia|Eisenbahn|Petra|Itaipava|Kaiser|Caracu|Serramalte|Bavaria|Colorado|Goose|Laut|Michelob|Amstel)\s*/i,
};

const SIZE_PATTERNS = [
  /\b(\d+\s?ml|\d+\s?l)\b/i,
  /\b(lata|latao|latão|garrafa|long\s?neck|pet)\b/i
];

// Mapa de cores por MARCA (fallback quando cor específica não existe)
const BRAND_COLORS: Record<string, string> = {
  // CERVEJAS
  'amstel': '#FDB913',
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
  
  // SUCOS
  'tial': '#FFD700',
  'gatorade': '#4169E1',
  
  // DRINKS
  'beats': '#E85D75',
  'lambe': '#FFC0CB',
  'lambe-lambe': '#FFC0CB',
  'smirnoff ice': '#D3D3D3',
  'xeque mate': '#B8860B',
  'ice syn': '#98FB98',
  'mansão maromba': '#FFD700',
  'equilibrista': '#DDA0DD',
  'vanfall': '#FF6347',
  'brutal fruit': '#FF69B4',
  'moscow mule': '#F5DEB3',
  'xá de cana': '#B8860B',
  
  // VINHOS
  'campo largo': '#3E2723',
  'canção': '#3E2723',
  'cancao': '#3E2723',
  'casal garcia': '#3E2723',
  'casal': '#3E2723',
  'casillero del diablo': '#3E2723',
  'casillero': '#3E2723',
  'concha y toro': '#3E2723',
  'gato negro': '#3E2723',
  'novecento': '#3E2723',
  'santa carolina': '#3E2723',
  'aurora': '#3E2723',
  
  // DESTILADOS - WHISKY
  'red label': '#B31B1B',
  'johnnie walker red': '#B31B1B',
  'johnnie walker black': '#1C1C1C',
  'johnnie walker': '#D4AF37',
  'jack daniels': '#1C1C1C',
  "jack daniel's": '#1C1C1C',
  'jack daniel': '#1C1C1C',
  'ballantines': '#FFD700',
  "ballantine's": '#FFD700',
  'chivas': '#8B4513',
  'old parr': '#D4AF37',
  'whisky': '#D2691E',
  'whiskey': '#D2691E',
  
  // DESTILADOS - GIN
  'beefeater pink': '#FFB6C1',
  'beefeater': '#D3D3D3',
  'tanqueray ten': '#8B008B',
  'tanqueray': '#006B3F',
  'gordons': '#FFD700',
  "gordon's": '#FFD700',
  'bombay sapphire': '#4169E1',
  'bombay': '#4169E1',
  'eternity strawberry': '#FF69B4',
  'eternity tropical': '#FFA500',
  'eternity watermelon': '#FF1493',
  'eternity maca verde': '#90EE90',
  'eternity pessego': '#FFB6C1',
  'eternity': '#8A2BE2',
  'seagers': '#4169E1',
  'gin': '#90EE90',
  
  // DESTILADOS - VODKA
  'absolut': '#4169E1',
  'smirnoff': '#DC143C',
  'ciroc': '#8A2BE2',
  'skyy': '#4169E1',
  'orloff': '#D3D3D3',
  'vodka': '#D3D3D3',
  
  // DESTILADOS - RUM
  'bacardi': '#FF1493',
  'bacardi gold': '#FFD700',
  'captain morgan': '#8B4513',
  'montilla': '#8B4513',
  'rum': '#8B4513',
  
  // DESTILADOS - TEQUILA
  'jose cuervo': '#FFD700',
  'olmeca': '#FFD700',
  'tequila': '#FFD700',
  
  // DESTILADOS - CACHAÇA
  'ypioca ouro': '#FFD700',
  'ypioca 150': '#D4AF37',
  'ypioca 160': '#C0C0C0',
  'ypioca cinco chaves': '#8B4513',
  'ypioca': '#FFD700',
  'ypióca': '#FFD700',
  '51 ouro': '#FFD700',
  '51': '#FFD700',
  'cabare ouro': '#FFD700',
  'cabare amburana': '#8B4513',
  'cabare': '#DC143C',
  'cabaré': '#DC143C',
  'seleta': '#90EE90',
  'velho barreiro': '#D2691E',
  
  // DESTILADOS - OUTROS
  'jagermeister': '#FF6600',
  'jägermeister': '#FF6600',
  'hennessy': '#8B4513',
  'conhaque dreher': '#8B4513',
  'dreher': '#8B4513',
  'presidente': '#D4AF37',
  
  // CHOCOLATES - BIS
  'bis oreo': 'linear-gradient(to bottom, #87CEEB 0%, #1C3D5A 100%)', // Azul claro → azul escuro
  'bis xtra oreo': 'linear-gradient(to top, #87CEEB 0%, #F5F5DC 100%)', // Azul claro abaixo → creme cima
  'bis black': '#1C1C1C',
  'bis branco': '#F5F5DC',
  'bis xtra branco': '#F5F5DC',
  'bis original': '#4169E1',                   // Azul
  'bis xtra original': '#4169E1',
  'bis xtra': '#FF6F00',
  'bis': '#FF6F00',
  
  // CHOCOLATES - CAIXAS
  'caixa garoto': '#FFD700',                   // Amarelo
  'caixa lacta': '#4169E1',                    // Azul Lacta
  'caixa bis': '#4169E1',
  
  // CHOCOLATES - LACTA
  'lacta amaro': '#4169E1',                    // Azul
  'lacta amaro 40% cacau': '#4169E1',          // Azul
  'lacta ao leite': '#4169E1',                 // Azul
  'lacta diamante negro': '#4169E1',           // Azul
  'lacta oreo ao leite': '#4169E1',            // Azul
  'lacta branco': '#F5F5DC',                   // Creme
  'lacta ouro branco': '#FFD700',              // Amarelo
  'lacta shot': '#FFD700',                     // Amarelo
  'lacta sonho de valsa': '#FFB6C1',           // Rosa
  'lacta': '#4169E1',                          // Azul padrão
  
  // CHOCOLATES - TRENTO
  'trento dark': '#808080',                    // Cinza
  'trento branco-dark': '#F5F5DC',             // Creme
  'trento branco dark': '#F5F5DC',
  'trento milk': '#87CEEB',                    // Azul claro
  'trento': '#DC143C',                         // Vermelho
  
  // CHOCOLATES - OUTROS
  'baton ao leite': '#8B4513',
  'baton branco': '#F5F5DC',
  'baton': '#DC143C',
  'hersheys': '#5D4037',
  "hershey's": '#5D4037',
  'kitkat': '#E53935',
  'kit kat': '#E53935',
  'snickers': '#5D4037',
  'twix': '#D4AF37',
  'milka': '#8E44AD',
  'garoto': '#C62828',
  'nestle': '#DC143C',
  'nestlé': '#DC143C',
  'chocolate': '#3E2723',
  
  // SNACKS - DORITOS
  'doritos sweet chili': '#1C1C1C',           // Preto (com fogo vibrante)
  'doritos dinamita flamin hot': '#8B008B',   // Roxo (com fogo)
  'doritos dinamita pimenta mexicana': '#228B22', // Verde (com fogo)
  'doritos flamin hot': '#8B008B',
  'doritos pimenta mexicana': '#228B22',
  'doritos nacho': '#DC143C',
  'doritos': '#DC143C',
  
  // SNACKS - LAYS
  'lays barbecue': '#8B0000',
  'lays salt & vinegar': '#4169E1',
  'lays sour cream': '#90EE90',
  'lays queijo': '#FFD700',
  'lays': '#FFD700',
  
  // SNACKS - CHEETOS
  'cheetos mix': '#8B008B',                    // Roxo
  'cheetos bola queijo': '#FFFFE0',            // Amarelo claro
  'cheetos bola': '#FFFFE0',
  'cheetos lua parmesao': '#FFD700',
  'cheetos onda requeijao': '#FFA500',
  'cheetos crunchy cheddar': '#FF8C00',
  'cheetos crunchy white': '#F5F5DC',
  'cheetos': '#FF6347',
  
  // SNACKS - RUFFLES
  'ruffles': '#4169E1',                        // Azul
  'ruffles cebola e salsa': '#90EE90',         // Verde claro
  'ruffles churrasco': '#DC143C',              // Vermelho
  'ruffles tubo sour cream': '#90EE90',        // Verde claro
  'ruffles queijo': '#FFD700',
  
  // SNACKS - OUTROS
  'fandangos presunto': '#DC143C',
  'fandangos queijo': '#FFD700',
  'fandangos': '#FF6347',
  'baconzitos': '#DC143C',                     // Vermelho
  'cebolitos': '#FFD700',
  'sensacoes': '#F5DEB3',
  'sensações': '#F5DEB3',
  'pringles cebola': '#90EE90',                // Verde
  'pringles original': '#DC143C',              // Vermelho
  'pringles': '#DC143C',
  'stax sour cream & onion': '#90EE90',        // Verde
  'stax sour cream': '#90EE90',
  'torcida bacon': '#D3D3D3',                  // Cinza claro
  'torcida cebola': '#90EE90',                 // Verde claro
  'torcida churrasco': '#DDA0DD',              // Lilás claro
  'torcida costelinha com limão': '#8B4513',   // Marrom
  'torcida costelinha limão': '#8B4513',
  'torcida costelinha': '#8B4513',
  'torcida pão de alho': '#F5DEB3',            // Bege
  'torcida pao de alho': '#F5DEB3',
  'torcida queijo': '#FFD700',                 // Amarelo
  'torcida vinagrete': '#DC143C',              // Vermelho
  'torcida': '#006400',
  'croques': '#FFD700',
  'amendoim ovinhos': '#DC143C',               // Vermelho
  'amendoim japones': '#F5DEB3',               // Bege
  'amendoim japonês': '#F5DEB3',
  'amendoim': '#D2B48C',
  'pingo d\'ouro bacon': '#DC143C',            // Vermelho
  'pingo d\'ouro picanha': '#4169E1',          // Azul
  'pingo d\'ouro': '#FFD700',                  // Amarelo
  
  // DOCES - HALLS
  'halls cereja': '#DC143C',
  'halls extra forte': '#1C3D5A',
  'halls melancia': '#FF69B4',
  'halls menta': '#00CED1',
  'halls mentol': '#4169E1',
  'halls morango': '#FF1493',
  'halls uva verde': '#90EE90',
  'halls': '#32CD32',
  
  // DOCES - MENTOS
  'mentos fruit': '#FFD700',                   // Amarelo
  'mentos frutas vermelhas': '#DC143C',
  'mentos mint': '#00CED1',
  'mentos rainbow': '#FF69B4',
  'mentos tutti frutti': '#FFA500',
  'mentos yogurt': '#FFB6C1',
  'mentos': '#FF1493',
  
  // DOCES - TRIDENT (por sabor)
  'trident canela': '#D2691E',                 // Cor de canela
  'trident menta': '#00CED1',                  // Turquesa
  'trident melancia': '#FFB6C1',               // Vermelho claro
  'trident morango': '#FF69B4',                // Rosa
  'trident tutti frutti': '#FFB6C1',           // Rosa claro
  'trident tutti-frutti': '#FFB6C1',           // Rosa claro
  'trident uva': '#8B008B',                    // Roxo
  'trident': '#4169E1',                        // Azul padrão
  
  // DOCES - OUTROS
  'bala azedinha': '#FF69B4',
  'bala chita': '#FFD700',
  'bala lilith': '#8B008B',
  'icekiss': '#87CEEB',
  'bala': '#FF69B4',
  'chiclete': '#00CED1',
  'skittles': '#FF0000',
  'fini': '#FF69B4',
  'm&m': '#8B4513',
  'paçoca': '#DEB887',
  'pacoca': '#DEB887',
  'pirulito': '#FF1493',
  
  // GELO
  'gelo': '#87CEEB',
  'ice': '#87CEEB',
};

interface ParsedProduct {
  brand: string;
  size?: string;
  flavor: string;
  originalName: string;
}

/**
 * Detecta o tipo específico de produto de Tabacaria
 * ORDEM IMPORTA: Piteiras (Bem Bolado) primeiro, depois Cigarros
 */
function detectTabacariaType(productName: string): string {
  const normalized = productName.toLowerCase();
  
  // 1. DETECTAR PITEIRAS PRIMEIRO (prioridade máxima para "Bem Bolado")
  if (normalized.includes('bem bolado') ||
      (normalized.includes('piteira') && !normalized.includes('c/piteira')) ||
      normalized.includes('tips') ||
      normalized.includes('filter tip')) {
    return 'Piteira';
  }
  
  // 2. DETECTAR CIGARROS
  // Maço
  if (normalized.includes('maço') || 
      normalized.includes('box') ||
      (normalized.includes('cigarro') && !normalized.includes('picado'))) {
    return 'Cigarros - Maço';
  }
  
  // Picado
  if (normalized.includes('picado') || 
      normalized.includes('tabaco') ||
      normalized.includes('fumo')) {
    return 'Cigarros - Picado';
  }
  
  // Marcas de cigarro conhecidas
  const cigarroBrands = ['marlboro', 'lucky', 'dunhill', 'camel', 'winston', 'pall mall', 'derby', 'eight', 'minster', 'hollywood', 'rothmans', 'free'];
  if (cigarroBrands.some(brand => normalized.includes(brand))) {
    return 'Cigarros - Maço';
  }
  
  // 3. SEDA (adicionar antes de isqueiros)
  if (normalized.includes('seda') || 
      normalized.includes('papel') ||
      normalized.includes('smoking') ||
      normalized.includes('papel de fumar')) {
    return 'Seda';
  }
  
  // 4. ISQUEIROS
  if (normalized.includes('isqueiro') || 
      normalized.includes('lighter') ||
      normalized.includes('bic')) {
    return 'Isqueiro';
  }
  
  // Fallback: usar Tabacaria como categoria genérica
  console.warn(`⚠️ Produto Tabacaria não classificado especificamente: ${productName}`);
  return 'Tabacaria';
}

function extractBrandFallback(name: string): string {
  const words = name.trim().split(/\s+/);
  return words[0] || 'Desconhecido';
}

function normalizeCategoryForPattern(category: string): string {
  return category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function parseProductName(name: string, category: string): ParsedProduct {
  const normalized = normalizeCategoryForPattern(category);
  
  const brandPattern = BRAND_PATTERNS[normalized];
  const brandMatch = brandPattern?.exec(name);
  const brand = brandMatch ? brandMatch[1] : extractBrandFallback(name);
  
  let remainingName = name;
  
  // 1. Remover marca primeiro
  if (brandPattern) {
    remainingName = remainingName.replace(brandPattern, '').trim();
  }
  
  // 2. Extrair e remover TODOS os tamanhos
  let size: string | undefined;
  for (const pattern of SIZE_PATTERNS) {
    const match = pattern.exec(remainingName);
    if (match) {
      size = match[0].trim();
      remainingName = remainingName.replace(pattern, '').trim();
    }
  }
  
  // 3. O que sobrou é o sabor
  let flavor = remainingName.trim();
  
  if (!flavor || flavor.length < 2) {
    flavor = 'Original';
  }
  
  return { brand, size, flavor, originalName: name };
}

export const getProductColor = (productName: string, flavor: string, category?: string): { type: 'color' | 'image' | 'gradient', value: string } => {
  const normalizedName = productName.toLowerCase();
  const normalizedFlavor = flavor.toLowerCase();
  const normalizedCategory = category?.toLowerCase() || '';
  
  // AMSTEL sempre dourado (prioridade máxima)
  if (normalizedName.includes('amstel')) {
    return { type: 'color', value: '#FDB913' };
  }
  
  // Destilados - verificar por categoria E palavras-chave
  if (normalizedCategory.includes('destilado') || normalizedCategory.includes('cachaca') ||
      normalizedCategory.includes('cachaça') || normalizedCategory.includes('vodka') ||
      normalizedCategory.includes('whisky') || normalizedCategory.includes('gin') ||
      normalizedCategory.includes('rum') || normalizedCategory.includes('tequila') ||
      normalizedCategory.includes('conhaque') || normalizedCategory.includes('licor') ||
      normalizedName.includes('whisky') || normalizedName.includes('whiskey') ||
      normalizedName.includes('vodka') || normalizedName.includes('gin') ||
      normalizedName.includes('rum') || normalizedName.includes('tequila') ||
      normalizedName.includes('johnnie') || normalizedName.includes('red label') ||
      normalizedName.includes('jack daniel') || normalizedName.includes('ypioca') ||
      normalizedName.includes('ypióca')) {
    
    // Ordenar marcas por especificidade (mais específicas primeiro)
    const sortedBrands = Object.entries(BRAND_COLORS)
      .filter(([brand]) => {
        // Filtrar apenas destilados
        return brand.includes('red label') || brand.includes('beefeater') || 
               brand.includes('tanqueray') || brand.includes('jack') || 
               brand.includes('absolut') || brand.includes('smirnoff') ||
               brand.includes('ypioca') || brand.includes('ypióca') ||
               brand.includes('51') || brand.includes('cabare') || brand.includes('cabaré') ||
               brand.includes('eternity') || brand.includes('vodka') || 
               brand.includes('whisky') || brand.includes('gin') || 
               brand.includes('rum') || brand.includes('tequila') ||
               brand.includes('bacardi') || brand.includes('jose') ||
               brand.includes('dreher') || brand.includes('presidente') ||
               brand.includes('seleta') || brand.includes('gordons') ||
               brand.includes('bombay') || brand.includes('seagers');
      })
      .sort((a, b) => b[0].length - a[0].length); // Mais específico primeiro
    
    for (const [brand, color] of sortedBrands) {
      if (normalizedName.includes(brand)) {
        // Detectar se é um gradiente CSS
        if (typeof color === 'string' && color.startsWith('linear-gradient')) {
          return { type: 'gradient', value: color };
        }
        return { type: 'color', value: color };
      }
    }
    return { type: 'color', value: '#8B4513' }; // Marrom padrão para destilados
  }

  // Chocolates
  if (normalizedCategory.includes('chocolate') || normalizedName.includes('chocolate') ||
      normalizedName.includes('bis') || normalizedName.includes('baton')) {
    
    // Ordenar por especificidade
    const sortedBrands = Object.entries(BRAND_COLORS)
      .filter(([brand]) => {
        return brand.includes('bis') || brand.includes('baton') || 
               brand.includes('chocolate') || brand.includes('lacta') ||
               brand.includes('hershey') || brand.includes('kitkat') ||
               brand.includes('snickers') || brand.includes('twix') ||
               brand.includes('milka') || brand.includes('garoto') ||
               brand.includes('nestle') || brand.includes('nestlé') ||
               brand.includes('trento') || brand.includes('caixa');
      })
      .sort((a, b) => b[0].length - a[0].length);
    
    for (const [brand, color] of sortedBrands) {
      if (normalizedName.includes(brand)) {
        // Detectar se é um gradiente CSS
        if (typeof color === 'string' && color.startsWith('linear-gradient')) {
          return { type: 'gradient', value: color };
        }
        return { type: 'color', value: color };
      }
    }
    return { type: 'color', value: '#3E2723' }; // Marrom escuro padrão
  }

  // Snacks
  if (normalizedCategory.includes('snack') || normalizedCategory.includes('salgadinho') ||
      normalizedName.includes('doritos') || normalizedName.includes('lays') ||
      normalizedName.includes('cheetos') || normalizedName.includes('ruffles') ||
      normalizedName.includes('fandangos') || normalizedName.includes('amendoim')) {
    
    // Ordenar por especificidade (mais longo = mais específico)
    const sortedBrands = Object.entries(BRAND_COLORS)
      .filter(([brand]) => {
        return brand.includes('doritos') || brand.includes('lays') || 
               brand.includes('cheetos') || brand.includes('ruffles') ||
               brand.includes('fandangos') || brand.includes('baconzitos') ||
               brand.includes('cebolitos') || brand.includes('sensacoes') ||
               brand.includes('sensações') || brand.includes('pringles') ||
               brand.includes('torcida') || brand.includes('croques') ||
               brand.includes('amendoim') || brand.includes('stax') ||
               brand.includes('pingo');
      })
      .sort((a, b) => b[0].length - a[0].length);
    
    for (const [brand, color] of sortedBrands) {
      if (normalizedName.includes(brand)) {
        return { type: 'color', value: color };
      }
    }
    return { type: 'color', value: '#FF6347' }; // Laranja padrão
  }

  // Doces
  if (normalizedCategory.includes('doce') || normalizedCategory.includes('bala') ||
      normalizedCategory.includes('candy') || normalizedCategory.includes('chiclete') ||
      normalizedName.includes('halls') || normalizedName.includes('mentos') ||
      normalizedName.includes('bala')) {
    
    // Ordenar por especificidade
    const sortedBrands = Object.entries(BRAND_COLORS)
      .filter(([brand]) => {
        return brand.includes('halls') || brand.includes('mentos') || 
               brand.includes('bala') || brand.includes('chiclete') ||
               brand.includes('trident') || brand.includes('skittles') ||
               brand.includes('fini') || brand.includes('m&m') ||
               brand.includes('paçoca') || brand.includes('pacoca') ||
               brand.includes('pirulito') || brand.includes('icekiss');
      })
      .sort((a, b) => b[0].length - a[0].length);
    
    for (const [brand, color] of sortedBrands) {
      if (normalizedName.includes(brand)) {
        return { type: 'color', value: color };
      }
    }
    return { type: 'color', value: '#FF69B4' }; // Rosa padrão
  }

  // Gelo
  if (normalizedCategory.includes('gelo') || normalizedName.includes('gelo') ||
      normalizedName.includes('ice')) {
    return { type: 'color', value: '#87CEEB' }; // Azul gelo
  }
  
  // Vinhos usam imagem de madeira - detectar por categoria PRIMEIRO
  if (normalizedCategory.includes('vinho') || normalizedCategory.includes('wine') ||
      normalizedName.includes('vinho') || normalizedName.includes('wine') || 
      normalizedName.includes('campo largo') || normalizedName.includes('aurora') ||
      normalizedName.includes('concha')) {
    return {
      type: 'image',
      value: 'https://static.vecteezy.com/ti/fotos-gratis/p2/2901896-fundo-de-textura-de-madeira-gratis-foto.jpg'
    };
  }
  
  const colorMap: Record<string, string> = {
    // ===== CERVEJAS =====
    'amstel-355ml': '#FDB913',
    'amstel-473ml': '#FDB913',
    'amstel-269ml': '#FDB913',
    'amstel-275ml': '#FDB913',
    'amstel-long neck': '#FDB913',
    'amstel-original': '#FDB913',
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
    
    // ===== ENERGÉTICOS - BALY (17 sabores) =====
    'baly-2l': '#FFD700',
    'baly-473ml': '#FFD700',
    'baly-original': '#FFD700',
    'baly-abacaxi': '#FFD700',
    'baly-abacaxi com hortelã': '#98FF98',
    'baly-abacaxi com hortela': '#98FF98',
    'baly-coco': '#F5DEB3',
    'baly-coco e acai': '#8B4789',
    'baly-coco e açai': '#8B4789',
    'baly-freegels cereja': '#DC143C',
    'baly-cereja': '#DC143C',
    'baly-maca verde': '#9ACD32',
    'baly-maça verde': '#9ACD32',
    'baly-melancia': '#FF6B9D',
    'baly-morango': '#FFB6C1',
    'baly-morango e pessego': '#FFDAB9',
    'baly-morango e pêssego': '#FFDAB9',
    'baly-morango pessego': '#FFDAB9',
    'baly-summer loco manga': '#FFA500',
    'baly-manga': '#FFA500',
    'baly-tropical': '#FFA500',
    'baly-zero': '#E0E0E0',
    
    // ===== ENERGÉTICOS - RED BULL (14 sabores) =====
    'red bull-250ml': '#0047AB',
    'red bull-355ml': '#0047AB',
    'red bull-473ml': '#0047AB',
    'red bull-original': '#0047AB',
    'red bull-tradicional': '#0047AB',
    'red bull-amora': '#C71585',
    'red bull-cereja': '#DC143C',
    'red bull-melancia': '#FF6B9D',
    'red bull-morango': '#FFB6C1',
    'red bull-pêssego': '#FFDAB9',
    'red bull-pessego': '#FFDAB9',
    'red bull-morango e pêssego': '#FFB6C1',
    'red bull-morango e pessego': '#FFB6C1',
    'red bull-morango com pessego': '#FFB6C1',
    'red bull-pitaya': '#FF1493',
    'red bull-pomelo': '#FFE4B5',
    'red bull-summer': '#FFD700',
    'red bull-tropical': '#FFA500',
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
    'coca-cola-zero': '#DC143C',
    'coca-cola-zero açúcar': '#DC143C',
    'coca-cola-zero acucar': '#DC143C',
    'coca-zero': '#DC143C',
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
    
    // ===== DRINKS - BEATS (6 sabores) =====
    'beats-caipirinha': '#E9F9EC',
    'beats-green mix': '#E8FBE5',
    'beats-gt': '#FFF0E0',
    'beats-red mix': '#FFE5E5',
    'beats-senses': '#E9EAFB',
    'beats-tropical': '#FFF4E1',
    
    // ===== DRINKS - LAMBE-LAMBE (2 sabores) =====
    'lambe-lambe-limonada rosa': '#FFB6C1',
    'lambe-lambe-tangerina': '#FFD700',
    'lambe-limonada rosa': '#FFB6C1',
    'lambe-tangerina': '#FFD700',
    
    // ===== DRINKS - SMIRNOFF ICE =====
    'smirnoff-ice': '#D3D3D3',
    'smirnoff ice-original': '#D3D3D3',
    
    // ===== DRINKS - ICE SYN (7 sabores) =====
    'ice syn-kiwi': '#E8FFE8',
    'ice syn-limão': '#F2FFE6',
    'ice syn-limao': '#F2FFE6',
    'ice syn-maca verde': '#ECFFE5',
    'ice syn-maça verde': '#ECFFE5',
    'ice syn-melancia': '#FFE6EF',
    'ice syn-morango': '#FFE6F1',
    'ice syn-tropical': '#EFFFF9',
    
    // ===== DRINKS - MANSÃO MAROMBA (8 sabores) =====
    'mansão maromba-1l': '#FFD700',
    'mansão maromba-original': '#FFD700',
    'mansão maromba-colors berry': '#C71585',
    'mansão maromba-combo maça verde': '#9ACD32',
    'mansão maromba-combo maçã verde': '#9ACD32',
    'mansão maromba-combo tigrinho manga': '#FFA500',
    'mansão maromba-combo tigrinho manga + maracujá': '#FFD700',
    'mansão maromba-combo tigrinho tropical': '#FFA500',
    'mansão maromba-gin + melancia': '#FF6B9D',
    'mansão maromba-gin melancia': '#FF6B9D',
    'mansão maromba-gin cut original': '#B0C4DE',
    'mansão maromba-vodka combo': '#E0E0E0',
    
    // ===== DRINKS - EQUILIBRISTA (3 sabores) =====
    'equilibrista-gingibre': '#FFF4E0',
    'equilibrista-rubra': '#FFE8EB',
    'equilibrista-veneta': '#F3E8FF',
    
    // ===== DRINKS - VANFALL (3 sabores) =====
    'vanfall-fizz mexerica e hortelã': '#FFA500',
    'vanfall-fizz mexerica e hortela': '#FFA500',
    'vanfall-ruby frutas vermelhas': '#DC143C',
    'vanfall-vibra maracujá': '#FFD700',
    'vanfall-vibra maracuja': '#FFD700',
    
    // ===== DRINKS - OUTRAS =====
    'brutal fruit-spritzer': '#FF69B4',
    'moscow mule-original': '#F5DEB3',
    'xá de cana-original': '#B8860B',
    
    // ===== SUCOS - TIAL (todos amarelos) =====
    'tial-abacaxi': '#FFD700',
    'tial-caju': '#FFD700',
    'tial-goiaba': '#FFD700',
    'tial-laranja': '#FFD700',
    'tial-manga': '#FFD700',
    'tial-maracujá': '#FFD700',
    'tial-maracuja': '#FFD700',
    'tial-pêssego': '#FFD700',
    'tial-pessego': '#FFD700',
    'tial-uva': '#FFD700',
    
    // ===== ISOTÔNICOS - GATORADE (12 sabores) =====
    'gatorade-berry blue': '#4169E1',
    'gatorade-frutas citricas': '#FFD700',
    'gatorade-frutas cítricas': '#FFD700',
    'gatorade-laranja': '#FFA500',
    'gatorade-lightning blast': '#E0E0E0',
    'gatorade-limao': '#FFFF00',
    'gatorade-limão': '#FFFF00',
    'gatorade-maracuja': '#FFD700',
    'gatorade-maracujá': '#FFD700',
    'gatorade-midnight ice': '#191970',
    'gatorade-morango maracuja': '#FFB6C1',
    'gatorade-morango maracujá': '#FFB6C1',
    'gatorade-tangerina': '#FF8C00',
    'gatorade-uva': '#8B008B',
    'gatorade-zero frutas silvestres': '#8B4789',
    'gatorade-zero laranja': '#FFA500',
  };
  
  // 1. Tentar chave específica: 'marca-sabor' (primeira palavra)
  let specificKey = `${normalizedName.split(' ')[0]}-${normalizedFlavor}`;
  
  // DEBUG: Verificar lookup de cores
  if (process.env.NODE_ENV === 'development') {
    console.log('🎨 getProductColor:', { 
      productName, 
      flavor, 
      normalizedName, 
      normalizedFlavor, 
      specificKey,
      found: !!colorMap[specificKey],
      color: colorMap[specificKey]
    });
  }
  
  if (colorMap[specificKey]) {
    return { type: 'color', value: colorMap[specificKey] };
  }
  
  // 2. Tentar chave específica com DUAS palavras (ex: "ice syn", "mansão maromba", "pepsi black")
  const firstTwoWords = normalizedName.split(' ').slice(0, 2).join(' ');
  specificKey = `${firstTwoWords}-${normalizedFlavor}`;
  if (colorMap[specificKey]) {
    return { type: 'color', value: colorMap[specificKey] };
  }
  
  // 3. Tentar apenas marca (uma palavra)
  const brand = normalizedName.split(' ')[0];
  if (BRAND_COLORS[brand]) {
    return { type: 'color', value: BRAND_COLORS[brand] };
  }
  
  // 4. Tentar marca com duas palavras (ex: "stella artois", "ice syn", "pepsi black")
  if (BRAND_COLORS[firstTwoWords]) {
    return { type: 'color', value: BRAND_COLORS[firstTwoWords] };
  }
  
  // 5. Fallback padrão
  return { type: 'color', value: '#4169E1' };
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
    
    // Detecção de tipo para Tabacaria
    let actualCategory = category;
    if (category === 'Tabacaria') {
      actualCategory = detectTabacariaType(product.name);
    }
    
    // Usar actualCategory nas regras de agrupamento
    const specificRule = GROUPING_RULES[actualCategory] || rule;
    
    let groupKey = parsed.brand;
    let displayBrand = parsed.brand;
    
    // Agrupamento especial para Tabacaria: sempre agrupar por tipo
    if (category === 'Tabacaria') {
      groupKey = actualCategory;
      displayBrand = actualCategory;
    } else if (category === 'Refrigerantes' && parsed.size) {
      groupKey = parsed.size;
      displayBrand = `Refrigerantes ${parsed.size}`;
    } else if (specificRule.groupBy.includes('size') && parsed.size) {
      groupKey += `-${parsed.size}`;
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = {
        groupKey,
        baseProduct: {
          brand: displayBrand,
          type: category === 'Tabacaria' ? actualCategory : category,
          size: parsed.size,
          category: product.category || actualCategory
        },
        variants: [],
        mainImage: product.image_url,
        priceRange: { min: Infinity, max: -Infinity },
        brandColor: (() => {
          const bg = getProductColor(product.name, parsed.flavor);
          return bg.type === 'color' ? bg.value : '#4169E1';
        })(),
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
