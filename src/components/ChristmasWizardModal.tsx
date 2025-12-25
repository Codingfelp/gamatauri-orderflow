import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wine, Gift, PartyPopper, Sparkles, Users, Flame, Scale, Flower2, ChevronRight, Check, Loader2 } from "lucide-react";

interface ChristmasWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (result: WizardResult) => void;
}

export interface WizardResult {
  momento: string;
  pessoas: string;
  perfil: string;
  suggestedCategory: string;
  suggestedProducts: SuggestedProduct[];
}

interface SuggestedProduct {
  category: string;
  reason: string;
  quantity: number;
}

const momentoOptions = [
  { value: "ceia_familia", label: "Ceia em família", emoji: "🥂", icon: Wine, tip: "Vinhos e espumantes clássicos" },
  { value: "presente", label: "Presente", emoji: "🎁", icon: Gift, tip: "Kits e destilados premium" },
  { value: "amigos_festa", label: "Amigos / Festa", emoji: "🍹", icon: PartyPopper, tip: "Drinks e combos" },
  { value: "brinde_meia_noite", label: "Brinde da meia-noite", emoji: "✨", icon: Sparkles, tip: "Espumantes especiais" },
];

const pessoasOptions = [
  { value: "1-2", label: "1–2", subtitle: "Intimista" },
  { value: "3-5", label: "3–5", subtitle: "Pequeno grupo" },
  { value: "6-10", label: "6–10", subtitle: "Reunião" },
  { value: "10+", label: "10+", subtitle: "Festão!" },
];

const perfilOptions = [
  { value: "suave", label: "Suave", icon: Flower2, tip: "Perfeito pra quem não gosta de bebida forte", color: "from-pink-400 to-rose-500" },
  { value: "equilibrado", label: "Equilibrado", icon: Scale, tip: "O meio-termo ideal", color: "from-amber-400 to-orange-500" },
  { value: "forte", label: "Forte", icon: Flame, tip: "Pra quem aprecia sabor intenso", color: "from-red-500 to-red-700" },
];

const getBottleEstimate = (pessoas: string): number => {
  const map: Record<string, number> = { "1-2": 1, "3-5": 2, "6-10": 4, "10+": 6 };
  return map[pessoas] || 2;
};

const getSuggestions = (momento: string, perfil: string, pessoas: string): SuggestedProduct[] => {
  const qty = getBottleEstimate(pessoas);
  
  if (momento === "presente") {
    return [
      { category: "Destilados", reason: "Presente sofisticado", quantity: 1 },
      { category: "Vinhos", reason: "Clássico que agrada", quantity: 1 },
    ];
  }
  
  if (momento === "brinde_meia_noite") {
    return [
      { category: "Vinhos", reason: "Espumante pro brinde", quantity: Math.ceil(qty / 2) },
    ];
  }
  
  if (momento === "amigos_festa") {
    if (perfil === "forte") {
      return [
        { category: "Destilados", reason: "Pra drinks fortes", quantity: 2 },
        { category: "Cervejas", reason: "Cerveja gelada", quantity: qty * 2 },
      ];
    }
    return [
      { category: "Drinks", reason: "Prático e saboroso", quantity: qty * 2 },
      { category: "Cervejas", reason: "Sempre cai bem", quantity: qty },
    ];
  }
  
  // ceia_familia
  if (perfil === "suave") {
    return [
      { category: "Vinhos", reason: "Vinho suave pra ceia", quantity: qty },
      { category: "Sucos", reason: "Pra quem não bebe", quantity: 2 },
    ];
  }
  if (perfil === "forte") {
    return [
      { category: "Vinhos", reason: "Vinho tinto encorpado", quantity: qty },
      { category: "Destilados", reason: "Digestivo", quantity: 1 },
    ];
  }
  return [
    { category: "Vinhos", reason: "Vinho pra harmonizar", quantity: qty },
    { category: "Vinhos", reason: "Espumante pro brinde", quantity: 1 },
  ];
};

const getPrimaryCategory = (momento: string, perfil: string): string => {
  if (momento === "presente") return "Destilados";
  if (momento === "brinde_meia_noite") return "Vinhos";
  if (momento === "amigos_festa") return perfil === "forte" ? "Destilados" : "Drinks";
  if (perfil === "forte") return "Destilados";
  return "Vinhos";
};

export const ChristmasWizardModal = ({ open, onOpenChange, onComplete }: ChristmasWizardModalProps) => {
  const [step, setStep] = useState(0);
  const [momento, setMomento] = useState("");
  const [pessoas, setPessoas] = useState("");
  const [perfil, setPerfil] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetState = () => {
    setStep(0);
    setMomento("");
    setPessoas("");
    setPerfil("");
    setIsLoading(false);
  };

  useEffect(() => {
    if (!open) {
      setTimeout(resetState, 300);
    }
  }, [open]);

  const handleMomentoSelect = (value: string) => {
    setMomento(value);
    // Vibration feedback on mobile
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handlePessoasSelect = (value: string) => {
    setPessoas(value);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handlePerfilSelect = (value: string) => {
    setPerfil(value);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleFinish = () => {
    setIsLoading(true);
    // Simulate "thinking"
    setTimeout(() => {
      const result: WizardResult = {
        momento,
        pessoas,
        perfil,
        suggestedCategory: getPrimaryCategory(momento, perfil),
        suggestedProducts: getSuggestions(momento, perfil, pessoas),
      };
      onComplete(result);
      onOpenChange(false);
    }, 1500);
  };

  const getMomentoFeedback = () => {
    const map: Record<string, string> = {
      ceia_familia: "Boa escolha pra família! 🎄",
      presente: "Presente que impressiona! 🎁",
      amigos_festa: "Bora animar! 🎉",
      brinde_meia_noite: "O momento mais especial! ✨",
    };
    return map[momento] || "";
  };

  const progress = ((step + 1) / 3) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card border border-border max-h-[85vh] overflow-y-auto">
        {/* Header with progress */}
        <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border">
          <div className="px-5 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎄</span>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">
                    Montando seu pedido
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Passo {step + 1} de 3
                  </p>
                </div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-amber-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <AnimatePresence mode="wait">
            {/* STEP 0: Momento */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-base font-semibold text-foreground mb-0.5">
                  Qual é o clima dessa celebração?
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Isso ajuda a gente a escolher melhor
                </p>

                <div className="space-y-2">
                  {momentoOptions.map((opt) => {
                    const selected = momento === opt.value;
                    return (
                      <motion.button
                        key={opt.value}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleMomentoSelect(opt.value)}
                        className={`
                          w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all
                          ${selected 
                            ? "bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 dark:border-amber-500" 
                            : "bg-muted/50 border-2 border-transparent hover:bg-muted"
                          }
                        `}
                      >
                        <span className="text-xl">{opt.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground text-sm">{opt.label}</h3>
                          <p className="text-[11px] text-muted-foreground truncate">{opt.tip}</p>
                        </div>
                        {selected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0"
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {momento && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 space-y-3"
                    >
                      <p className="text-center text-xs text-amber-600 dark:text-amber-400 font-medium">
                        {getMomentoFeedback()}
                      </p>
                      <Button
                        onClick={nextStep}
                        className="w-full h-10 bg-foreground hover:bg-foreground/90 text-background font-medium rounded-lg"
                      >
                        Continuar
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* STEP 1: Pessoas */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={prevStep}
                  className="text-xs text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1"
                >
                  ← Voltar
                </button>
                
                <h2 className="text-base font-semibold text-foreground mb-0.5">
                  Quantas pessoas vão brindar?
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Assim calculamos a quantidade ideal
                </p>

                <div className="grid grid-cols-4 gap-2">
                  {pessoasOptions.map((opt) => {
                    const selected = pessoas === opt.value;
                    return (
                      <motion.button
                        key={opt.value}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePessoasSelect(opt.value)}
                        className={`
                          py-3 rounded-lg text-center transition-all
                          ${selected 
                            ? "bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 dark:border-amber-500" 
                            : "bg-muted/50 border-2 border-transparent hover:bg-muted"
                          }
                        `}
                      >
                        <span className="text-sm font-bold text-foreground block">{opt.label}</span>
                        <span className="text-[9px] text-muted-foreground">{opt.subtitle}</span>
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {pessoas && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 space-y-3"
                    >
                      <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                        <span className="text-muted-foreground text-xs">
                          Isso costuma dar <strong className="text-foreground">~{getBottleEstimate(pessoas)} garrafas</strong> 🍾
                        </span>
                      </div>
                      <Button
                        onClick={nextStep}
                        className="w-full h-10 bg-foreground hover:bg-foreground/90 text-background font-medium rounded-lg"
                      >
                        Continuar
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* STEP 2: Perfil */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={prevStep}
                  className="text-xs text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1"
                >
                  ← Voltar
                </button>

                <h2 className="text-base font-semibold text-foreground mb-0.5">
                  Qual o estilo ideal?
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Escolha o perfil de sabor
                </p>

                <div className="space-y-2">
                  {perfilOptions.map((opt) => {
                    const Icon = opt.icon;
                    const selected = perfil === opt.value;
                    return (
                      <motion.button
                        key={opt.value}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePerfilSelect(opt.value)}
                        className={`
                          w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all
                          ${selected 
                            ? "bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 dark:border-amber-500" 
                            : "bg-muted/50 border-2 border-transparent hover:bg-muted"
                          }
                        `}
                      >
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${opt.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground text-sm">{opt.label}</h3>
                          <p className="text-[11px] text-muted-foreground truncate">{opt.tip}</p>
                        </div>
                        {selected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0"
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {perfil && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4"
                    >
                      <Button
                        onClick={handleFinish}
                        disabled={isLoading}
                        className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Pensando na sua ceia...
                          </>
                        ) : (
                          <>
                            Montar meu pedido
                            <Sparkles className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};