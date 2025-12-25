import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, Gift, Wine, Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";

interface ChristmasWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (preferences: WizardResult) => void;
}

export interface WizardResult {
  peopleCount: string;
  purpose: string;
  taste: string;
  suggestedCategory: string;
}

const steps = [
  {
    id: "people",
    question: "Quantas pessoas vão celebrar?",
    icon: Users,
    options: [
      { value: "1-2", label: "1-2 pessoas", emoji: "👫" },
      { value: "3-5", label: "3-5 pessoas", emoji: "👨‍👩‍👧" },
      { value: "6-10", label: "6-10 pessoas", emoji: "🎉" },
      { value: "10+", label: "Mais de 10", emoji: "🎊" },
    ],
  },
  {
    id: "purpose",
    question: "Qual é a ocasião?",
    icon: Gift,
    options: [
      { value: "consumir", label: "Para beber", emoji: "🍷" },
      { value: "presentear", label: "Para presentear", emoji: "🎁" },
      { value: "ambos", label: "Os dois!", emoji: "✨" },
    ],
  },
  {
    id: "taste",
    question: "Prefere algo...",
    icon: Wine,
    options: [
      { value: "suave", label: "Suave e leve", emoji: "🌸" },
      { value: "equilibrado", label: "Equilibrado", emoji: "⚖️" },
      { value: "forte", label: "Forte e marcante", emoji: "🔥" },
      { value: "surpreenda", label: "Me surpreenda!", emoji: "🎲" },
    ],
  },
];

const getSuggestedCategory = (result: Partial<WizardResult>): string => {
  if (result.purpose === "presentear") return "destilados";
  if (result.taste === "suave") return "vinhos";
  if (result.taste === "forte") return "destilados";
  if (result.peopleCount === "10+" || result.peopleCount === "6-10") return "cervejas";
  return "vinhos";
};

export const ChristmasWizardModal = ({ open, onOpenChange, onComplete }: ChristmasWizardModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleSelect = (stepId: string, value: string) => {
    const newAnswers = { ...answers, [stepId]: value };
    setAnswers(newAnswers);

    if (currentStep < steps.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    } else {
      // Complete
      const result: WizardResult = {
        peopleCount: newAnswers.people || "",
        purpose: newAnswers.purpose || "",
        taste: newAnswers.taste || "",
        suggestedCategory: getSuggestedCategory(newAnswers),
      };
      onComplete(result);
      onOpenChange(false);
      // Reset for next time
      setTimeout(() => {
        setCurrentStep(0);
        setAnswers({});
      }, 300);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-gradient-to-br from-rose-950 via-zinc-900 to-emerald-950 border-none">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          <div className="flex items-center justify-between mt-4">
            {currentStep > 0 ? (
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-white/60 hover:text-white transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
            ) : (
              <div />
            )}
            <span className="text-white/40 text-sm">
              {currentStep + 1} de {steps.length}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-amber-500/20">
                  <Icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {currentStepData.question}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {currentStepData.options.map((option) => {
                  const isSelected = answers[currentStepData.id] === option.value;
                  return (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelect(currentStepData.id, option.value)}
                      className={`
                        relative p-4 rounded-xl text-left transition-all
                        ${isSelected 
                          ? 'bg-amber-500 text-zinc-900' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                        }
                      `}
                    >
                      <span className="text-2xl mb-2 block">{option.emoji}</span>
                      <span className="font-medium text-sm">{option.label}</span>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2"
                        >
                          <Check className="w-4 h-4" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer decoration */}
        <div className="h-2 bg-gradient-to-r from-red-600 via-amber-500 to-emerald-600" />
      </DialogContent>
    </Dialog>
  );
};
