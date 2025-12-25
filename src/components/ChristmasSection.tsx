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
  onFilteredProducts?: (productIds: string[]) => void;
}

export const ChristmasSection = ({ onCategoryClick, onFilteredProducts }: ChristmasSectionProps) => {
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
      description: `${result.filteredProducts.length} produtos selecionados para você`,
    });
    
    // Pass filtered product IDs to parent
    if (onFilteredProducts && result.filteredProducts.length > 0) {
      onFilteredProducts(result.filteredProducts.map(p => p.id));
    } else if (onCategoryClick) {
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

      {/* Sophisticated CTA Button with Santa Hat Icon */}
      <motion.button
        onClick={() => setWizardOpen(true)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mb-3 py-3 px-4 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border border-red-200/60 dark:border-red-800/40 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          {/* Santa Hat SVG Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-red-600 dark:text-red-400">
            <path d="M12 2C10.5 2 9 3.5 9 5C9 5.5 9.1 6 9.3 6.4C7.4 7.5 6 9.5 6 12V19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V12C18 9.5 16.6 7.5 14.7 6.4C14.9 6 15 5.5 15 5C15 3.5 13.5 2 12 2Z" fill="currentColor"/>
            <circle cx="12" cy="5" r="2" fill="white"/>
            <path d="M6 19H18V21H6V19Z" fill="white"/>
          </svg>
          <span className="text-sm font-medium text-red-800 dark:text-red-200">
            A gente monta pra você
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-red-500 dark:text-red-400 group-hover:translate-x-0.5 transition-transform" />
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