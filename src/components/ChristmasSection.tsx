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
  badge: string;
  gradient: string;
  size: "large" | "medium" | "small";
  category?: string;
}

const christmasMoments: ChristmasMoment[] = [
  {
    id: "ceia",
    icon: <Wine className="w-5 h-5" />,
    title: "Ceia em Família",
    subtitle: "Vinhos e espumantes",
    badge: "🔥 Top Natal",
    gradient: "from-amber-600 to-orange-700",
    size: "large",
    category: "vinhos",
  },
  {
    id: "presentes",
    icon: <Gift className="w-5 h-5" />,
    title: "Presentes",
    subtitle: "Whiskies e kits",
    badge: "🎁",
    gradient: "from-emerald-600 to-teal-700",
    size: "medium",
    category: "destilados",
  },
  {
    id: "amigos",
    icon: <PartyPopper className="w-5 h-5" />,
    title: "Com Amigos",
    subtitle: "Drinks e combos",
    badge: "🎉",
    gradient: "from-rose-500 to-pink-600",
    size: "medium",
    category: "drinks-prontos",
  },
  {
    id: "brinde",
    icon: <Sparkles className="w-5 h-5" />,
    title: "Meia-Noite",
    subtitle: "Espumantes",
    badge: "✨",
    gradient: "from-violet-600 to-purple-700",
    size: "small",
    category: "vinhos",
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
    <section className="py-4 px-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎄</span>
          <h2 className="text-base font-bold text-foreground">
            Natal que Brilha
          </h2>
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 hover:underline"
        >
          Me ajude a escolher
          <Sparkles className="w-3 h-3" />
        </button>
      </div>

      {/* Bento Grid Layout - Cards com tamanhos diferentes */}
      <div className="grid grid-cols-4 gap-2 auto-rows-[80px]">
        {/* Large Card - Ceia (2x2) */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => handleCardClick(christmasMoments[0])}
          className={`
            col-span-2 row-span-2 relative rounded-2xl overflow-hidden
            bg-gradient-to-br ${christmasMoments[0].gradient}
            text-white text-left p-4 group
          `}
        >
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                {christmasMoments[0].badge}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1 opacity-90">
                {christmasMoments[0].icon}
              </div>
              <h3 className="font-bold text-lg leading-tight">
                {christmasMoments[0].title}
              </h3>
              <p className="text-xs opacity-80">
                {christmasMoments[0].subtitle}
              </p>
            </div>
          </div>
          <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 opacity-60 group-hover:translate-x-1 transition-transform" />
        </motion.button>

        {/* Medium Card - Presentes (2x1) */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => handleCardClick(christmasMoments[1])}
          className={`
            col-span-2 row-span-1 relative rounded-xl overflow-hidden
            bg-gradient-to-br ${christmasMoments[1].gradient}
            text-white text-left p-3 group
          `}
        >
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-2">
              <span className="text-lg">{christmasMoments[1].badge}</span>
              <div>
                <h3 className="font-semibold text-sm">
                  {christmasMoments[1].title}
                </h3>
                <p className="text-[10px] opacity-80">
                  {christmasMoments[1].subtitle}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.button>

        {/* Medium Card - Amigos (2x1) */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => handleCardClick(christmasMoments[2])}
          className={`
            col-span-2 row-span-1 relative rounded-xl overflow-hidden
            bg-gradient-to-br ${christmasMoments[2].gradient}
            text-white text-left p-3 group
          `}
        >
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-2">
              <span className="text-lg">{christmasMoments[2].badge}</span>
              <div>
                <h3 className="font-semibold text-sm">
                  {christmasMoments[2].title}
                </h3>
                <p className="text-[10px] opacity-80">
                  {christmasMoments[2].subtitle}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.button>
      </div>

      {/* Small highlight - Brinde Meia-Noite */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => handleCardClick(christmasMoments[3])}
        className="
          w-full mt-2 relative rounded-xl overflow-hidden
          bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900
          text-white text-left p-3 group
          border border-amber-500/30
        "
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl animate-pulse">✨</span>
            <div>
              <h3 className="font-semibold text-sm">
                Brinde da Meia-Noite
              </h3>
              <p className="text-[10px] text-amber-400">
                Espumantes para o momento especial
              </p>
            </div>
          </div>
          <span className="text-xs bg-amber-500 text-zinc-900 px-2 py-1 rounded-full font-bold">
            Ver
          </span>
        </div>
      </motion.button>

      {/* Wizard Modal */}
      <ChristmasWizardModal
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onComplete={handleWizardComplete}
      />
    </section>
  );
};
