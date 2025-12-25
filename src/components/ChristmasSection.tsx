import { useState } from "react";
import { Wine, Gift, PartyPopper, Sparkles, ChevronRight, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { ChristmasWizardModal, WizardResult } from "./ChristmasWizardModal";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";

interface ChristmasMoment {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  gradient: string;
  category: string;
}

const christmasMoments: ChristmasMoment[] = [
  {
    id: "ceia",
    icon: <Wine className="w-4 h-4" />,
    title: "Ceia em Família",
    subtitle: "Vinhos e espumantes",
    gradient: "from-amber-500 to-orange-600",
    category: "Vinhos",
  },
  {
    id: "presentes",
    icon: <Gift className="w-4 h-4" />,
    title: "Presentes",
    subtitle: "Whiskies e kits",
    gradient: "from-emerald-500 to-teal-600",
    category: "Destilados",
  },
  {
    id: "amigos",
    icon: <PartyPopper className="w-4 h-4" />,
    title: "Com Amigos",
    subtitle: "Drinks e combos",
    gradient: "from-rose-500 to-pink-600",
    category: "Drinks",
  },
  {
    id: "brinde",
    icon: <Sparkles className="w-4 h-4" />,
    title: "Meia-Noite",
    subtitle: "Espumantes",
    gradient: "from-violet-500 to-purple-600",
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
      {/* Header with prominent CTA */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🎄</span>
          <h2 className="text-sm font-bold text-foreground">
            Natal que Brilha
          </h2>
        </div>
      </div>

      {/* Prominent Wizard CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3"
      >
        <Button
          onClick={() => setWizardOpen(true)}
          className="w-full h-12 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600 text-zinc-900 font-bold rounded-xl shadow-lg shadow-amber-500/25 border-0"
        >
          <Wand2 className="w-5 h-5 mr-2" />
          A gente monta pra você
          <Sparkles className="w-4 h-4 ml-2 animate-pulse" />
        </Button>
      </motion.div>

      {/* Compact Horizontal Scroll Cards */}
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
              bg-gradient-to-r ${moment.gradient}
              text-white shadow-md hover:shadow-lg transition-shadow
            `}
          >
            <span className="p-1.5 bg-white/20 rounded-lg">
              {moment.icon}
            </span>
            <div className="text-left">
              <h3 className="font-semibold text-xs leading-tight whitespace-nowrap">
                {moment.title}
              </h3>
              <p className="text-[10px] opacity-80 whitespace-nowrap">
                {moment.subtitle}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 opacity-60 ml-1" />
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
