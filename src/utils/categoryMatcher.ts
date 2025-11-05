import { CATEGORY_KEYWORDS } from '@/config/categoryMapping';

/**
 * Normalizes text for comparison by removing accents and converting to lowercase
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Checks if a product matches a specific category based on keywords
 */
export function matchProductToCategory(productName: string, category: string): boolean {
  const normalizedProduct = normalizeText(productName);
  const keywords = CATEGORY_KEYWORDS[category] || [];
  
  return keywords.some(keyword => {
    const normalizedKeyword = normalizeText(keyword);
    return normalizedProduct.includes(normalizedKeyword);
  });
}

/**
 * Gets the best matching category for a product
 * Returns the category name or null if no match found
 */
export function getCategoryForProduct(productName: string): string | null {
  // Priority order for overlapping categories
  const priorityCategories = [
    'Cervejas Zero',
    'Refrigerantes Zero',
    'Copão',
    'Cigarros',
    'Gelos',
    'Chocolates',
    'Cervejas',
    'Drinks',
    'Vinhos',
    'Destilados',
    'Refrigerantes',
    'Sucos',
    'Snacks',
    'Doces'
  ];

  for (const category of priorityCategories) {
    if (matchProductToCategory(productName, category)) {
      return category;
    }
  }

  return null;
}
