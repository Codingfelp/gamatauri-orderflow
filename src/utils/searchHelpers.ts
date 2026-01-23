/**
 * Helpers para a lógica de busca de produtos
 * Separa busca genérica de categoria vs busca por marca/produto específico
 */

// Lista de termos genéricos de categoria (quando usuário busca "cervejas", "snacks", etc.)
const GENERIC_CATEGORY_TERMS = [
  // Cervejas
  "cerveja", "cervejas",
  // Destilados
  "destilado", "destilados",
  // Subcategorias de destilados (termos genéricos)
  "vodka", "vodkas",
  "whisky", "whiskeys", "whiskey",
  "gin", "gins",
  "cachaca", "cachaça", "cachaças",
  "rum", "runs",
  "tequila", "tequilas",
  "licor", "licores",
  "conhaque", "conhaques",
  // Vinhos
  "vinho", "vinhos",
  // Snacks
  "snack", "snacks", "salgadinho", "salgadinhos",
  // Chocolates
  "chocolate", "chocolates",
  // Doces
  "doce", "doces", "bala", "balas",
  // Refrigerantes
  "refrigerante", "refrigerantes", "energetico", "energeticos", "energético", "energéticos",
  // Águas
  "agua", "águas", "aguas", "água",
  // Sucos
  "suco", "sucos",
  // Gelos
  "gelo", "gelos",
  // Drinks
  "drink", "drinks",
  // Tabacaria
  "tabacaria", "cigarro", "cigarros", "seda", "sedas",
  // Copão
  "copao", "copão",
];

/**
 * Verifica se o termo de busca é genérico (categoria) ou específico (marca/produto)
 */
export const isGenericCategorySearch = (search: string): boolean => {
  const s = search.toLowerCase().trim();
  return GENERIC_CATEGORY_TERMS.includes(s);
};

/**
 * Mapeamento de subcategorias de destilados para filtrar diretamente
 */
export const DESTILADO_SUBCATEGORIES: Record<string, string[]> = {
  "Vodka": ["vodka", "vodkas"],
  "Whisky": ["whisky", "whiskey", "whiskeys"],
  "Gin": ["gin", "gins"],
  "Cachaca": ["cachaca", "cachaça", "cachaças"],
  "Rum": ["rum", "runs"],
  "Tequila": ["tequila", "tequilas"],
  "Licor": ["licor", "licores"],
  "Conhaque": ["conhaque", "conhaques"],
};

/**
 * Retorna a subcategoria de destilado correspondente ao termo de busca
 * ou null se não for uma subcategoria
 */
export const getDestiladoSubcategory = (search: string): string | null => {
  const s = search.toLowerCase().trim();
  for (const [category, keywords] of Object.entries(DESTILADO_SUBCATEGORIES)) {
    if (keywords.includes(s)) {
      return category;
    }
  }
  return null;
};

/**
 * Mapeamento de categorias genéricas para filtro
 */
export const GENERIC_CATEGORY_MAPPING: Record<string, string> = {
  // Cervejas
  "cerveja": "Cervejas",
  "cervejas": "Cervejas",
  // Destilados
  "destilado": "Destilados",
  "destilados": "Destilados",
  // Subcategorias (mapeiam para a categoria exata no banco)
  "vodka": "Vodka",
  "vodkas": "Vodka",
  "whisky": "Whisky",
  "whiskey": "Whisky",
  "whiskeys": "Whisky",
  "gin": "Gin",
  "gins": "Gin",
  "cachaca": "Cachaca",
  "cachaça": "Cachaca",
  "cachaças": "Cachaca",
  "rum": "Rum",
  "runs": "Rum",
  "tequila": "Tequila",
  "tequilas": "Tequila",
  "licor": "Licor",
  "licores": "Licor",
  "conhaque": "Conhaque",
  "conhaques": "Conhaque",
  // Vinhos
  "vinho": "Vinhos",
  "vinhos": "Vinhos",
  // Snacks
  "snack": "Snacks",
  "snacks": "Snacks",
  "salgadinho": "Snacks",
  "salgadinhos": "Snacks",
  // Chocolates
  "chocolate": "Chocolates",
  "chocolates": "Chocolates",
  // Doces
  "doce": "Doces",
  "doces": "Doces",
  "bala": "Doces",
  "balas": "Doces",
  // Refrigerantes
  "refrigerante": "Refrigerantes",
  "refrigerantes": "Refrigerantes",
  "energetico": "Refrigerantes",
  "energeticos": "Refrigerantes",
  "energético": "Refrigerantes",
  "energéticos": "Refrigerantes",
  // Águas
  "agua": "Águas",
  "águas": "Águas",
  "aguas": "Águas",
  "água": "Águas",
  // Sucos
  "suco": "Sucos",
  "sucos": "Sucos",
  // Gelos
  "gelo": "Gelos",
  "gelos": "Gelos",
  // Drinks
  "drink": "Drinks",
  "drinks": "Drinks",
  // Tabacaria
  "tabacaria": "Tabacaria",
  "cigarro": "Tabacaria",
  "cigarros": "Tabacaria",
  "seda": "Tabacaria",
  "sedas": "Tabacaria",
  // Copão
  "copao": "Copão",
  "copão": "Copão",
};

/**
 * Retorna a categoria correspondente ao termo genérico de busca
 */
export const getGenericCategory = (search: string): string | null => {
  const s = search.toLowerCase().trim();
  return GENERIC_CATEGORY_MAPPING[s] || null;
};

/**
 * Lista de subcategorias de destilados (para filtro exato por product.category)
 */
export const DESTILADO_SUBCATEGORY_LIST = [
  "Vodka", "Whisky", "Gin", "Cachaca", "Rum", "Tequila", "Licor", "Conhaque"
];
