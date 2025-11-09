/**
 * Category keyword mapping for intelligent product filtering
 * Each category has keywords that match product names
 */

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  // Águas (PRIORIDADE - verificar primeiro)
  "Águas": [
    "crystal", "acquissima", "minalba", "lindoya", "pureza vital", 
    "bonafont", "agua", "água", "water", "mineral"
  ],

  // Chocolates
  "Chocolates": [
    "bis", "oreo", "lacta", "diamante negro", "sonho de valsa", "amaro", "trento", 
    "laka", "baton", "bombom", "ouro branco", "pirakids", "shot", "kitkat", "chocolate"
  ],

  // Copão (Drinks Combo)
  "Copão": [
    "rocks com", "red label com", "white horse com", "tanqueray com", 
    "ballantines com", "gordons com", "com red bull", "com baly", "com fusion"
  ],

  // Cigarros
  "Cigarros": [
    "lucky strike", "brothers", "dunhill", "porto faria", "black picado", 
    "paiol", "picado", "cigarro", "maço"
  ],

  // Gelos
  "Gelos": [
    "gelo filtrado", "gelo saborizado", "gelo escamado", "gelo", "cubos"
  ],

  // Refrigerantes e Energéticos
  "Refrigerantes": [
    "coca-cola", "pepsi", "fanta", "sprite", "guarana", "kuat", "sukita",
    "monster", "red bull", "baly", "fusion", "h2oh", "soda", "tonica",
    "refrigerante", "energetico"
  ],

  // Refrigerantes Zero
  "Refrigerantes Zero": [
    "zero", "diet", "light"
  ],

  // Cervejas
  "Cervejas": [
    "colorado", "goose island", "stella", "wals", "itaipava", "patagonia",
    "petra", "skol", "budweiser", "spaten", "amstel", "brahma", "antarctica",
    "bohemia", "duplo malte", "caracu", "corona", "heineken", "michelob",
    "original", "serramalte", "hoegaarden", "cerveja", "beer"
  ],

  // Cervejas Zero
  "Cervejas Zero": [
    "cerveja zero", "beer zero", "brahma zero", "budweiser zero", "corona zero", "heineken zero"
  ],

  // Drinks Prontos
  "Drinks": [
    "beats", "smirnoff ice", "xeque mate", "lambe-lambe", "moscow mule",
    "mansao maromba", "ice syn", "xa de cana", "equilibrista", "vanfall", "brutal fruit"
  ],

  // Sucos e Isotônicos (SEM água aqui)
  "Sucos": [
    "gatorade", "tial", "kero coco", "maguary", "suco", "isoton",
    "isotonico", "isotônico", "del valle", "ades", "fresh"
  ],

  // Destilados
  "Destilados": [
    "cachaca", "51", "velho barreiro", "ypioca", "seleta", "corote",
    "vodka", "absolut", "smirnoff", "ciroc", "grey goose",
    "whisky", "jack daniels", "johnnie walker", "black label", "red label",
    "buchanans", "chivas", "old parr", "jim beam",
    "tequila", "don julio", "rum", "bacardi", "montilla",
    "licor", "baileys", "amarula", "jagermeister", "cointreau",
    "aperitivo", "campari", "aperol", "cabare", "destilado"
  ],

  // Vinhos
  "Vinhos": [
    "vinho", "wine", "santa carolina", "casal", "concha y toro", "campo largo",
    "cancao", "garcia", "helena", "casillero", "gato negro", "pergola",
    "novecento", "malbec", "cabernet", "sauvignon", "chardonnay", "merlot",
    "carmenere", "shiraz", "rose"
  ],

  // Snacks
  "Snacks": [
    "amendoim", "baconzitos", "cebolitos", "cheetos", "doritos", "pingo",
    "fandangos", "lays", "ruffles", "pringles", "stax", "sticksy", "torcida"
  ],

  // Doces
  "Doces": [
    "halls", "azedinha", "trident", "mentos", "pe de moca", "chita",
    "lilith", "pacoca", "icekiss", "bala", "chiclete", "doce"
  ]
};
