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

// =====================================================
// CATEGORY RULES PER MOMENTO (CRITICAL FOR INTELLIGENCE)
// =====================================================

// Categories ALLOWED per momento (allowlist approach)
// IMPORTANT: Ceia must be ONLY wines + espumantes (no beers).
const allowedCategoriesPerMomento: Record<string, string[]> = {
  ceia_familia: ["vinho", "vinho-tinto", "vinho-branco", "espumante"],
  presente: ["whisky", "vodka", "gin", "rum", "vinho", "vinho-tinto", "espumante", "kit"],
  amigos_festa: ["vodka", "gin", "rum", "tequila", "cerveja", "drink", "espumante"],
  brinde_meia_noite: ["espumante", "vinho", "vinho-branco"],
};

// Categories BLOCKED per momento (explicit blocklist)
const blockedCategoriesPerMomento: Record<string, string[]> = {
  ceia_familia: ["whisky", "vodka", "gin", "rum", "tequila", "cachaca"], // No spirits for family dinner
  presente: [], // Most things can be gifts
  amigos_festa: [], // Party is flexible
  brinde_meia_noite: ["whisky", "vodka", "gin", "rum", "tequila", "cachaca", "cerveja"], // Champagne/wine only
};

// Map wizard momento to product ocasioes (for scoring, not filtering)
const momentoToOcasioes: Record<string, string[]> = {
  ceia_familia: ["ceia", "familia", "harmoniza"],
  presente: ["presente", "premium"],
  amigos_festa: ["festa", "amigos", "drinks"],
  brinde_meia_noite: ["brinde", "especial", "comemoracao"],
};

// Map wizard perfil to allowed intensidade
const perfilToIntensidade: Record<string, string[]> = {
  suave: ["leve", "media"],
  equilibrado: ["media", "medio"],
  forte: ["media", "alta", "forte", "intensa"],
};

// Map wizard perfil to allowed docura (for wines)
const perfilToDocura: Record<string, string[]> = {
  suave: ["suave", "doce", "meio-seco"],
  equilibrado: ["meio-seco", "seco"],
  // "forte" aqui significa mais estrutura/sabor; para ceia ainda faz sentido incluir meio-seco + seco
  forte: ["meio-seco", "seco", "extra-seco", "brut"],
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

// Check if category is allowed for the momento
const isCategoryAllowedForMomento = (categoria: string, momento: string): boolean => {
  const cat = categoria.toLowerCase();
  
  // Check blocklist first (explicit blocks)
  const blocked = blockedCategoriesPerMomento[momento] || [];
  if (blocked.some(b => cat.includes(b))) {
    return false;
  }
  
  // Check allowlist (must be in allowed categories)
  const allowed = allowedCategoriesPerMomento[momento] || [];
  return allowed.some(a => cat.includes(a));
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
  const targetOcasioes = momentoToOcasioes[criteria.momento] || [];
  if (product.ocasioes.some(o => targetOcasioes.includes(o))) {
    if (criteria.momento === "ceia_familia") {
      reasons.push("Ideal para ceia em família");
    } else if (criteria.momento === "presente") {
      reasons.push("Excelente para presentear");
    } else if (criteria.momento === "amigos_festa") {
      reasons.push("Perfeito para festa");
    } else if (criteria.momento === "brinde_meia_noite") {
      reasons.push("Especial pro brinde");
    }
  }
  
  // Harmonization for ceia
  if (criteria.momento === "ceia_familia") {
    if (product.harmoniza.includes("carnes")) {
      reasons.push("Combina com carnes");
    }
    if (product.harmoniza.includes("sobremesa")) {
      reasons.push("Harmoniza com sobremesa");
    }
  }
  
  // Temperature tip
  if (product.temperatura === "gelado") {
    reasons.push("Servir bem gelado 🧊");
  }
  
  // Priority badge
  if (product.prioridade_natal >= 9) {
    reasons.push("⭐ Queridinho do Natal");
  }
  
  return reasons.slice(0, 3); // Max 3 reasons
};

// Calculate score for ranking (momento match is now critical since we pre-filter)
const calculateScore = (product: ProductTag, criteria: FilterCriteria): number => {
  let score = 0;
  
  // Ocasioes match (weight: 10 - highest priority)
  const targetOcasioes = momentoToOcasioes[criteria.momento] || [];
  const ocasionMatches = product.ocasioes.filter(o => targetOcasioes.includes(o)).length;
  score += ocasionMatches * 10;
  
  // Christmas priority (weight: 3)
  score += product.prioridade_natal * 3;
  
  // Intensity/profile match (weight: 8)
  const targetIntensidades = perfilToIntensidade[criteria.perfil] || [];
  if (targetIntensidades.includes(product.intensidade || "media")) {
    score += 8;
  }
  
  // Docura match for wines/espumantes (weight: 6)
  const cat = product.categoria.toLowerCase();
  if (cat.includes("vinho") || cat.includes("espumante")) {
    const targetDocuras = perfilToDocura[criteria.perfil] || [];
    if (targetDocuras.includes(product.docura || "")) {
      score += 6;
    }
  }
  
  // Public match (weight: 4)
  if (criteria.perfil === "suave" && product.publico.includes("iniciante")) {
    score += 4;
  }
  if (product.publico.includes("geral")) {
    score += 2;
  }
  
  // Harmonization bonus for ceia (weight: 3)
  if (criteria.momento === "ceia_familia") {
    if (product.harmoniza.includes("carnes") || product.harmoniza.includes("ceia")) {
      score += 3;
    }
  }
  
  return score;
};

// =====================================================
// MAIN FILTERING FUNCTION (INTELLIGENT)
// =====================================================
export const filterProductsByWizard = (criteria: FilterCriteria): ScoredProduct[] => {
  const products = productTags as ProductTag[];
  const peopleCount = getPeopleCount(criteria.pessoas);
  
  console.log(`[ChristmasFilter] Starting filter: momento=${criteria.momento}, perfil=${criteria.perfil}, pessoas=${criteria.pessoas}`);
  
  // STEP 1: HARD FILTER by category allowlist/blocklist for the momento
  // This is the CRITICAL fix - categories are strictly enforced
  let filtered = products.filter(p => {
    const allowed = isCategoryAllowedForMomento(p.categoria, criteria.momento);
    if (!allowed) {
      console.log(`[ChristmasFilter] Blocked: ${p.nome} (${p.categoria}) - not allowed for ${criteria.momento}`);
    }
    return allowed;
  });
  
  console.log(`[ChristmasFilter] After category filter: ${filtered.length} products`);

  // Ceia MUST be strictly wines + espumantes (extra safety layer)
  if (criteria.momento === "ceia_familia") {
    filtered = filtered.filter(p => {
      const cat = p.categoria.toLowerCase();
      return cat.includes("vinho") || cat.includes("espumante");
    });

    // Special rule: Ceia + Suave => only wines with "sweet" or "suave" in the name
    if (criteria.perfil === "suave") {
      filtered = filtered.filter(p => {
        const name = (p.nome || "").toLowerCase().trim();
        return name.includes("sweet") || name.includes("suave");
      });
    }
  }

  console.log(`[ChristmasFilter] After ceia rules: ${filtered.length} products`);

  // STEP 2: Filter by intensity profile
  if (criteria.perfil === "suave") {
    filtered = filtered.filter(p => {
      const intensity = (p.intensidade || "media").toLowerCase();
      return ["leve", "media", "suave"].includes(intensity);
    });
  } else if (criteria.perfil === "forte") {
    filtered = filtered.filter(p => {
      const intensity = (p.intensidade || "media").toLowerCase();
      return ["media", "alta", "forte", "intensa", "encorpado"].includes(intensity);
    });
  }
  // "equilibrado" accepts all intensities
  
  console.log(`[ChristmasFilter] After intensity filter: ${filtered.length} products`);
  
  // STEP 3: For wines, also filter by docura
  const targetDocuras = perfilToDocura[criteria.perfil] || [];
  filtered = filtered.map(p => {
    const cat = p.categoria.toLowerCase();
    if ((cat.includes("vinho") || cat.includes("espumante")) && p.docura) {
      const docuraMatches = targetDocuras.includes(p.docura.toLowerCase());
      // Add a penalty flag for mismatched docura (will affect scoring)
      return { ...p, docuraMatch: docuraMatches };
    }
    return { ...p, docuraMatch: true };
   }).filter(p => {
    // Ceia + Forte => prioritize meio-seco/seco (avoid brut/extra-seco drifting to brinde)
    if (criteria.momento === "ceia_familia" && criteria.perfil === "forte") {
      const cat = p.categoria.toLowerCase();
      if ((cat.includes("vinho") || cat.includes("espumante")) && p.docura) {
        const doc = p.docura.toLowerCase();
        return doc === "meio-seco" || doc === "seco";
      }
    }

    return true;
  });
  
  console.log(`[ChristmasFilter] After docura filter: ${filtered.length} products`);

  // STEP 4: Score and rank
  const scored: ScoredProduct[] = filtered.map(p => ({
    ...p,
    score: calculateScore(p, criteria),
    quantity: calculateQuantity(p, peopleCount),
    reasons: getReasons(p, criteria),
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Log top results
  console.log(`[ChristmasFilter] Top 6 results:`, scored.slice(0, 6).map(p => `${p.nome} (score: ${p.score})`));

  // Return top 6 products
  return scored.slice(0, 6);
};

// Get product IDs that match the criteria
export const getFilteredProductIds = (criteria: FilterCriteria): string[] => {
  const filtered = filterProductsByWizard(criteria);
  return filtered.map(p => p.id);
};

// Get primary category based on criteria (fallback)
export const getPrimaryCategoryFromFilter = (criteria: FilterCriteria): string => {
  const momentoToCategory: Record<string, string> = {
    ceia_familia: "Vinhos",
    presente: "Destilados",
    amigos_festa: "Drinks",
    brinde_meia_noite: "Vinhos",
  };
  return momentoToCategory[criteria.momento] || "Vinhos";
};
