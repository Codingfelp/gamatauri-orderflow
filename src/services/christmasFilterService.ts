import productTags from "@/data/productTags.json";

export interface ProductTag {
  id: string;
  nome: string;
  categoria: string;
  intensidade?: string;
  docura?: string;
  ocasioes: string[];
  harmoniza: string[];
  publico: string[];
  temperatura: string;
  garrafas_por_pessoa: number;
  prioridade_natal: number;
}

export interface FilterCriteria {
  momento: string;
  pessoas: string;
  perfil: string;
}

export interface ScoredProduct extends ProductTag {
  score: number;
  quantity: number;
  reasons: string[];
}

// Map wizard momento to product ocasioes
const momentoToOcasioes: Record<string, string[]> = {
  ceia_familia: ["ceia", "familia", "harmoniza"],
  presente: ["presente", "premium"],
  amigos_festa: ["festa", "amigos", "drinks"],
  brinde_meia_noite: ["brinde", "especial", "comemoracao"],
};

// Map wizard perfil to product attributes
const perfilToIntensidade: Record<string, string[]> = {
  suave: ["leve", "media"],
  equilibrado: ["media", "medio"],
  forte: ["alta", "forte", "intensa"],
};

const perfilToDocura: Record<string, string[]> = {
  suave: ["suave", "doce", "meio-seco"],
  equilibrado: ["meio-seco", "seco"],
  forte: ["seco", "extra-seco"],
};

// Get number of people from range
const getPeopleCount = (pessoas: string): number => {
  const map: Record<string, number> = {
    "1-2": 2,
    "3-5": 4,
    "6-10": 8,
    "10+": 12,
  };
  return map[pessoas] || 4;
};

// Calculate quantity based on people and product
const calculateQuantity = (product: ProductTag, peopleCount: number): number => {
  const base = product.garrafas_por_pessoa * peopleCount;
  return Math.max(1, Math.ceil(base));
};

// Get reasons why this product was selected
const getReasons = (product: ProductTag, criteria: FilterCriteria): string[] => {
  const reasons: string[] = [];
  
  // Intensity match
  if (criteria.perfil === "suave" && ["leve", "media"].includes(product.intensidade || "")) {
    reasons.push("Sabor suave, agrada a maioria");
  } else if (criteria.perfil === "forte" && ["alta", "forte", "intensa"].includes(product.intensidade || "")) {
    reasons.push("Sabor intenso como você pediu");
  } else if (criteria.perfil === "equilibrado") {
    reasons.push("Equilíbrio perfeito");
  }
  
  // Occasion match
  if (criteria.momento === "ceia_familia" && product.ocasioes.includes("ceia")) {
    reasons.push("Ideal para ceia");
  }
  if (criteria.momento === "presente" && product.ocasioes.includes("presente")) {
    reasons.push("Excelente para presentear");
  }
  if (criteria.momento === "amigos_festa" && product.ocasioes.includes("festa")) {
    reasons.push("Perfeito para festa");
  }
  if (criteria.momento === "brinde_meia_noite" && product.ocasioes.includes("brinde")) {
    reasons.push("Especial pro brinde");
  }
  
  // Harmonization
  if (product.harmoniza.includes("sobremesa")) {
    reasons.push("Harmoniza com sobremesa");
  }
  if (product.harmoniza.includes("carnes")) {
    reasons.push("Combina com carnes");
  }
  
  // Temperature
  if (product.temperatura === "gelado") {
    reasons.push("Servir bem gelado");
  }
  
  // Priority
  if (product.prioridade_natal >= 8) {
    reasons.push("Queridinho do Natal");
  }
  
  return reasons.slice(0, 3); // Max 3 reasons
};

// Calculate score for ranking
const calculateScore = (product: ProductTag, criteria: FilterCriteria): number => {
  let score = 0;
  
  // Christmas priority (weight: 3)
  score += product.prioridade_natal * 3;
  
  // Moment match (weight: 5)
  const targetOcasioes = momentoToOcasioes[criteria.momento] || [];
  const ocasionMatch = product.ocasioes.some(o => targetOcasioes.includes(o));
  if (ocasionMatch) score += 5;
  
  // Intensity/profile match (weight: 4)
  const targetIntensidades = perfilToIntensidade[criteria.perfil] || [];
  if (targetIntensidades.includes(product.intensidade || "")) {
    score += 4;
  }
  
  // Docura match for wines (weight: 3)
  if (product.categoria.includes("vinho") || product.categoria.includes("espumante")) {
    const targetDocuras = perfilToDocura[criteria.perfil] || [];
    if (targetDocuras.includes(product.docura || "")) {
      score += 3;
    }
  }
  
  // Public match (weight: 2)
  if (criteria.perfil === "suave" && product.publico.includes("iniciante")) {
    score += 2;
  }
  if (product.publico.includes("geral")) {
    score += 1;
  }
  
  return score;
};

// Main filtering function
export const filterProductsByWizard = (criteria: FilterCriteria): ScoredProduct[] => {
  const products = productTags as ProductTag[];
  const peopleCount = getPeopleCount(criteria.pessoas);
  const targetOcasioes = momentoToOcasioes[criteria.momento] || [];
  const targetIntensidades = perfilToIntensidade[criteria.perfil] || [];
  
  // Step 1: Filter by moment (ocasioes)
  let filtered = products.filter(p => {
    // Check if any product occasion matches target
    return p.ocasioes.some(o => targetOcasioes.includes(o)) || 
           // Also include high priority products
           p.prioridade_natal >= 7;
  });
  
  // Step 2: Filter by profile (intensity)
  if (criteria.perfil === "suave") {
    filtered = filtered.filter(p => {
      const intensity = p.intensidade || "media";
      return ["leve", "media"].includes(intensity);
    });
  } else if (criteria.perfil === "forte") {
    filtered = filtered.filter(p => {
      const intensity = p.intensidade || "media";
      return ["media", "alta", "forte", "intensa"].includes(intensity);
    });
  }
  
  // Step 3: Exclude specific combinations
  if (criteria.momento === "ceia_familia" && criteria.perfil === "suave") {
    // Exclude strong spirits for family dinner with suave preference
    filtered = filtered.filter(p => {
      if (["whisky", "vodka", "rum", "gin"].includes(p.categoria)) {
        return false;
      }
      return true;
    });
  }
  
  if (criteria.momento === "presente") {
    // Prioritize premium for gifts
    filtered = filtered.sort((a, b) => b.prioridade_natal - a.prioridade_natal);
  }
  
  // Step 4: Score and rank
  const scored: ScoredProduct[] = filtered.map(p => ({
    ...p,
    score: calculateScore(p, criteria),
    quantity: calculateQuantity(p, peopleCount),
    reasons: getReasons(p, criteria),
  }));
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  // Return top 6 products
  return scored.slice(0, 6);
};

// Get product IDs that match the criteria
export const getFilteredProductIds = (criteria: FilterCriteria): string[] => {
  const filtered = filterProductsByWizard(criteria);
  return filtered.map(p => p.id);
};

// Get primary category based on criteria
export const getPrimaryCategoryFromFilter = (criteria: FilterCriteria): string => {
  const filtered = filterProductsByWizard(criteria);
  if (filtered.length === 0) return "Vinhos";
  
  // Count categories
  const categoryCount: Record<string, number> = {};
  filtered.forEach(p => {
    const cat = normalizeCategoryForDisplay(p.categoria);
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });
  
  // Return most common
  const sorted = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || "Vinhos";
};

// Normalize product category to display category
const normalizeCategoryForDisplay = (categoria: string): string => {
  const mapping: Record<string, string> = {
    vinho: "Vinhos",
    "vinho-tinto": "Vinhos",
    "vinho-branco": "Vinhos",
    espumante: "Vinhos",
    whisky: "Destilados",
    vodka: "Destilados",
    gin: "Destilados",
    rum: "Destilados",
    tequila: "Destilados",
    cachaca: "Destilados",
    cerveja: "Cervejas",
    drink: "Drinks",
    suco: "Sucos",
  };
  
  return mapping[categoria.toLowerCase()] || "Vinhos";
};
