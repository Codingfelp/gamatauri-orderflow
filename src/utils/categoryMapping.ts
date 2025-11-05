// Mapeia o valor do botão de categoria para as categorias reais da API
export const CATEGORY_MAPPING: Record<string, string[]> = {
  "Refrigerantes": ["Refrigerante", "Energetico", "Red Bull", "Monster"],
  "Refrigerantes Zero": ["Refrigerante Zero", "Coca Zero", "Pepsi Zero"],
  "Cervejas": ["Cerveja", "Heineken", "Skol", "Brahma", "Corona", "Budweiser"],
  "Cervejas Zero": ["Cerveja Zero", "Heineken Zero"],
  "Drinks": ["Drink", "Ice", "Smirnoff Ice"],
  "Sucos": ["Suco", "Agua", "Isotônico", "H2OH", "Del Valle"],
  "Destilados": ["Vodka", "Whisky", "Gin", "Rum", "Cachaça", "Tequila", "Licor"],
  "Vinhos": ["Vinho"],
  "Snacks": ["Snack", "Salgadinho", "Amendoim", "Batata"],
  "Doces": ["Doce", "Bala", "Chiclete", "Pirulito"],
  "Chocolates": ["Chocolate"],
  "Copão": ["Copão", "Copao"],
  "Cigarros": ["Cigarro"],
  "Gelos": ["Gelo"],
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
