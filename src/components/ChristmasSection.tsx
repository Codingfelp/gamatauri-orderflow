import { useState } from "react";
import { Wine, Gift, PartyPopper, Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { ChristmasWizardModal, WizardResult } from "./ChristmasWizardModal";
import { useToast } from "@/hooks/use-toast";

interface ChristmasMoment {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  category: string;
  isMain?: boolean;
}

const christmasMoments: ChristmasMoment[] = [
  {
    id: "ceia",
    icon: <Wine className="w-4 h-4" />,
    title: "Ceia em Família",
    subtitle: "Vinhos e espumantes",
    category: "Vinhos",
    isMain: true,
  },
  {
    id: "presentes",
    icon: <Gift className="w-4 h-4" />,
    title: "Presentes",
    subtitle: "Whiskies e kits",
    category: "Destilados",
  },
  {
    id: "amigos",
    icon: <PartyPopper className="w-4 h-4" />,
    title: "Com Amigos",
    subtitle: "Drinks e combos",
    category: "Drinks",
  },
  {
    id: "brinde",
    icon: <Sparkles className="w-4 h-4" />,
    title: "Meia-Noite",
    subtitle: "Espumantes",
    category: "Vinhos",
  },
];

interface ChristmasSectionProps {
  onCategoryClick?: (category: string) => void;
}

export const ChristmasSection = ({ onCategoryClick }: ChristmasSectionProps) => {
  const [wizardOpen, setWizardOpen] = useState(false);
  const { toast } = useToast();

  const handleCardClick = (moment: ChristmasMoment) => {
    if (onCategoryClick && moment.category) {
      onCategoryClick(moment.category);
    }
  };

  const handleWizardComplete = (result: WizardResult) => {
    toast({
      title: "Seleção pronta! 🎄",
      description: `Mostrando ${result.suggestedCategory} para você`,
    });
    if (onCategoryClick) {
      onCategoryClick(result.suggestedCategory);
    }
  };

  return (
    <section className="py-3 px-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🎄</span>
        <h2 className="text-sm font-bold text-foreground">
          Natal que Brilha
        </h2>
      </div>

      {/* Sophisticated CTA Button */}
      <motion.button
        onClick={() => setWizardOpen(true)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mb-3 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/60 dark:border-amber-700/40 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🎅</span>
          <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
            A gente monta pra você
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
      </motion.button>

      {/* Cards with hierarchy */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {christmasMoments.map((moment, index) => (
          <motion.button
            key={moment.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleCardClick(moment)}
            className={`
              flex-shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-xl
              transition-all duration-200
              ${moment.isMain 
                ? 'bg-red-600 text-white shadow-md hover:shadow-lg hover:bg-red-700' 
                : 'bg-card text-foreground border border-border/50 shadow-sm hover:shadow-md hover:border-red-200 dark:hover:border-red-800'
              }
            `}
          >
            <span className={`p-1.5 rounded-lg ${moment.isMain ? 'bg-white/20' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
              {moment.icon}
            </span>
            <div className="text-left">
              <h3 className={`font-semibold text-xs leading-tight whitespace-nowrap ${moment.isMain ? '' : 'text-foreground'}`}>
                {moment.title}
              </h3>
              <p className={`text-[10px] whitespace-nowrap ${moment.isMain ? 'opacity-80' : 'text-muted-foreground'}`}>
                {moment.subtitle}
              </p>
            </div>
            <ChevronRight className={`w-4 h-4 ml-1 ${moment.isMain ? 'opacity-60' : 'text-muted-foreground'}`} />
          </motion.button>
        ))}
      </div>

      {/* Wizard Modal */}
      <ChristmasWizardModal
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onComplete={handleWizardComplete}
      />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
};