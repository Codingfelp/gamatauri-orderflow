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
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 border-none max-h-[90vh] overflow-y-auto">
        {/* Progress Bar */}
        <div className="sticky top-0 z-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
          <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2">
              <motion.span 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xl"
              >
                🎄
              </motion.span>
              <span className="font-semibold text-foreground text-sm">
                Montando seu pedido
              </span>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i <= step ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-600"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 pb-6">
          <AnimatePresence mode="wait">
            {/* STEP 0: Momento */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="text-xl font-bold text-foreground mb-1">
                  Pra qual momento é esse pedido?
                </h2>
                <p className="text-muted-foreground text-sm mb-5">
                  Escolha a ocasião perfeita
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {momentoOptions.map((opt) => {
                    const Icon = opt.icon;
                    const selected = momento === opt.value;
                    return (
                      <motion.button
                        key={opt.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleMomentoSelect(opt.value)}
                        className={`
                          relative p-4 rounded-2xl text-left transition-all border-2
                          ${selected 
                            ? "border-amber-500 bg-amber-50 dark:bg-amber-900/30 shadow-lg shadow-amber-500/20" 
                            : "border-transparent bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                          }
                        `}
                      >
                        {selected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center"
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                        <span className="text-3xl mb-2 block">{opt.emoji}</span>
                        <h3 className="font-semibold text-foreground text-sm">{opt.label}</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{opt.tip}</p>
                      </motion.button>
                    );
                  })}
                </div>

                {momento && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5"
                  >
                    <p className="text-center text-sm text-amber-600 dark:text-amber-400 font-medium mb-4">
                      {getMomentoFeedback()}
                    </p>
                    <Button
                      onClick={nextStep}
                      className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-zinc-900 font-bold rounded-xl"
                    >
                      Continuar
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STEP 1: Pessoas */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  onClick={prevStep}
                  className="text-sm text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1"
                >
                  ← Voltar
                </button>
                
                <h2 className="text-xl font-bold text-foreground mb-1">
                  Quantas pessoas vão brindar?
                </h2>
                <p className="text-muted-foreground text-sm mb-5">
                  Assim calculamos a quantidade ideal
                </p>

                <div className="flex gap-3">
                  {pessoasOptions.map((opt) => {
                    const selected = pessoas === opt.value;
                    return (
                      <motion.button
                        key={opt.value}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handlePessoasSelect(opt.value)}
                        className={`
                          flex-1 py-4 rounded-xl text-center transition-all border-2
                          ${selected 
                            ? "border-amber-500 bg-amber-50 dark:bg-amber-900/30" 
                            : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                          }
                        `}
                      >
                        <span className="text-xl font-bold text-foreground block">{opt.label}</span>
                        <span className="text-[10px] text-muted-foreground">{opt.subtitle}</span>
                      </motion.button>
                    );
                  })}
                </div>

                {pessoas && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5"
                  >
                    <div className="bg-amber-100 dark:bg-amber-900/30 rounded-xl p-3 text-center mb-4">
                      <span className="text-amber-700 dark:text-amber-300 text-sm">
                        Boa! Isso costuma dar <strong>~{getBottleEstimate(pessoas)} garrafas</strong> 🍾
                      </span>
                    </div>
                    <Button
                      onClick={nextStep}
                      className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-zinc-900 font-bold rounded-xl"
                    >
                      Continuar
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STEP 2: Perfil */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  onClick={prevStep}
                  className="text-sm text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1"
                >
                  ← Voltar
                </button>

                <h2 className="text-xl font-bold text-foreground mb-1">
                  Qual o estilo ideal?
                </h2>
                <p className="text-muted-foreground text-sm mb-5">
                  Escolha o perfil de sabor
                </p>

                <div className="space-y-3">
                  {perfilOptions.map((opt) => {
                    const Icon = opt.icon;
                    const selected = perfil === opt.value;
                    return (
                      <motion.button
                        key={opt.value}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePerfilSelect(opt.value)}
                        className={`
                          w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all border-2
                          ${selected 
                            ? "border-amber-500 bg-amber-50 dark:bg-amber-900/30" 
                            : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                          }
                        `}
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${opt.color} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{opt.label}</h3>
                          <p className="text-xs text-muted-foreground">{opt.tip}</p>
                        </div>
                        {selected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {perfil && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5"
                  >
                    <Button
                      onClick={handleFinish}
                      disabled={isLoading}
                      className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl"
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer decoration */}
        <div className="h-1 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500" />
      </DialogContent>
    </Dialog>
  );
};
