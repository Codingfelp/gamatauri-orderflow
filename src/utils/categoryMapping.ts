// Mapeia o valor do botão de categoria para as categorias reais da API
export const CATEGORY_MAPPING: Record<string, string[]> = {
  "Águas": [
    "Agua", "Água", "Water", "Mineral"
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
    "Cachaça", "Tequila", "Licor", "Conhaque", "Pisco"
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

// Verifica se uma categoria de produto pertence a uma categoria do carousel
export function categoryMatchesFilter(productCategory: string, filterCategory: string): boolean {
  if (!filterCategory) return true;
  
  const mappedCategories = CATEGORY_MAPPING[filterCategory];
  if (!mappedCategories) return productCategory === filterCategory;
  
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
