// Mapeia o valor do botão de categoria para as categorias reais da API
export const CATEGORY_MAPPING: Record<string, string[]> = {
  "Águas": [
    "Agua", "Água", "Water", "Mineral", "Pureza", "Crystal", "Minalba", "Lindoya", "Bonafont"
  ],
  "Refrigerantes": [
    "Refrigerante", "Coca-Cola", "Pepsi", "Guaraná", "Fanta", "Sprite"
  ],
  "Energéticos": [
    "Energetico", "Energético", "Energy", "Red Bull", "Monster", 
    "TNT Energy", "Fusion"
  ],
  "Refrigerantes Zero": [
    "Refrigerante Zero", "Coca Zero", "Pepsi Zero", 
    "Zero Açúcar", "Diet"
  ],
  "Cervejas": [
    "Cerveja", "Beer", "Heineken", "Skol", "Brahma", 
    "Corona", "Budweiser", "Stella", "Original", "Itaipava"
  ],
  "Cervejas Zero": [
    "Cerveja Zero", "Heineken Zero", "Heineken 0.0",
    "Sem Álcool", "Non Alcoholic"
  ],
  "Drinks": [
    "Drink", "Ice", "Smirnoff Ice", "Catuaba", "Skol Beats",
    "TNT", "Corote"
  ],
  "Sucos": [
    "Suco", "Juice", "Isotônico", "Isotonico", "Isotónico", 
    "H2OH", "Del Valle", "Gatorade", "Powerade", "Tial", "Maguary"
  ],
  "Destilados": [
    "Vodka", "Whisky", "Whiskey", "Gin", "Rum", 
    "Cachaça", "Cachaca", "Tequila", "Licor", "Conhaque", "Pisco"
  ],
  "Vinhos": [
    "Vinho", "Wine", "Espumante", "Champagne"
  ],
  "Snacks": [
    "Snack", "Salgadinho", "Amendoim", "Batata", 
    "Doritos", "Ruffles", "Cheetos"
  ],
  "Doces": [
    "Doce", "Bala", "Chiclete", "Pirulito", "Jujuba",
    "Drops", "Mentos"
  ],
  "Chocolates": [
    "Chocolate", "Bis", "KitKat", "Lacta", "Garoto",
    "Nestlé", "Ferrero"
  ],
  "Copão": [
    "Copão", "Copao", "Copo"
  ],
  "Tabacaria": [
    "Cigarro", "Cigarette", "Marlboro", "Derby",
    "Seda", "Papel", "Smoking", "OCB",
    "Isqueiro", "Lighter", "Bic", "Zippo",
    "Piteira", "Filtro", "Filter", "Tips"
  ],
  "Gelos": [
    "Gelo", "Ice", "Gela"
  ],
};

// Mapeamento granular para busca específica de subcategorias de destilados
export const SEARCH_SUBCATEGORY_MAPPING: Record<string, string[]> = {
  "Vodka": ["vodka", "absolut", "smirnoff", "grey goose", "ciroc"],
  "Whisky": ["whisky", "whiskey", "johnnie", "jack daniels", "chivas", "old parr", "buchanans", "jim beam", "red label", "black label"],
  "Gin": ["gin", "tanqueray", "bombay", "beefeater", "gordons"],
  "Cachaça": ["cachaca", "cachaça", "51", "velho barreiro", "ypioca", "seleta"],
  "Rum": ["rum", "bacardi", "montilla", "havana"],
  "Tequila": ["tequila", "jose cuervo", "don julio"],
  "Licor": ["licor", "amarula", "baileys", "jagermeister", "cointreau"],
  "Conhaque": ["conhaque", "dreher"],
};

// Verifica se uma categoria de produto pertence a uma categoria do carousel
export function categoryMatchesFilter(productCategory: string, filterCategory: string): boolean {
  if (!filterCategory) return true;
  
  // Se for subcategoria de destilados, comparar diretamente
  const destSubcats = ["Vodka", "Whisky", "Gin", "Cachaca", "Rum", "Tequila", "Licor", "Conhaque"];
  if (destSubcats.includes(filterCategory)) {
    return productCategory?.toLowerCase() === filterCategory.toLowerCase();
  }
  
  const mappedCategories = CATEGORY_MAPPING[filterCategory];
  if (!mappedCategories) return productCategory === filterCategory;
  
  // Para Águas, verificar contra as categorias possíveis no banco de dados
  if (filterCategory === "Águas") {
    const aguaDbCategories = ["agua", "água", "water", "mineral"];
    return aguaDbCategories.some(kw => productCategory?.toLowerCase() === kw);
  }
  
  return mappedCategories.some(cat => 
    productCategory?.toLowerCase().includes(cat.toLowerCase())
  );
}

// Normaliza categoria da API para categoria de exibição do carousel
export function normalizeCategory(apiCategory: string | null): string {
  if (!apiCategory) return "Outros";
  
  // Procura qual categoria do carousel corresponde
  for (const [carouselCategory, apiCategories] of Object.entries(CATEGORY_MAPPING)) {
    if (apiCategories.some(cat => apiCategory.toLowerCase().includes(cat.toLowerCase()))) {
      return carouselCategory;
    }
  }
  
  return apiCategory; // Se não encontrar, usa a categoria da API mesmo
}
