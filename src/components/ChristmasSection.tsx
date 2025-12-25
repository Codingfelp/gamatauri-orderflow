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

export interface WizardProductMeta {
  id: string;
  reasons: string[];
  docura?: string;
  intensidade?: string;
  ocasioes?: string[];
}

interface ChristmasSectionProps {
  onCategoryClick?: (category: string) => void;
  onWizardSelection?: (payload: { ids: string[]; metaById: Record<string, WizardProductMeta> }) => void;
}

export const ChristmasSection = ({ onCategoryClick, onWizardSelection }: ChristmasSectionProps) => {
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

    if (onWizardSelection && result.filteredProducts.length > 0) {
      const ids = result.filteredProducts.map((p) => p.id);
      const metaById: Record<string, WizardProductMeta> = {};
      result.filteredProducts.forEach((p) => {
        metaById[p.id] = {
          id: p.id,
          reasons: p.reasons,
          docura: p.docura,
          intensidade: p.intensidade,
          ocasioes: p.ocasioes,
        };
      });
      onWizardSelection({ ids, metaById });
      return;
    }

    // fallback
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

      {/* Sophisticated CTA Button with Minimalist Santa Hat Icon */}
      <motion.button
        onClick={() => setWizardOpen(true)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mb-3 py-3 px-4 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border border-red-200/60 dark:border-red-800/40 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          {/* Minimalist Santa Hat SVG Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-red-600 dark:text-red-400 flex-shrink-0">
            {/* Hat base/brim */}
            <path d="M4 20C4 19 5 18 8 18H16C19 18 20 19 20 20C20 21 19 22 12 22C5 22 4 21 4 20Z" fill="currentColor" opacity="0.9"/>
            {/* Main hat cone */}
            <path d="M7 18C7 18 8 8 12 4C16 8 17 18 17 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor"/>
            {/* Pompom */}
            <circle cx="12" cy="4" r="2.5" fill="white" stroke="currentColor" strokeWidth="0.5"/>
            {/* Fur trim */}
            <path d="M5 18H19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
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