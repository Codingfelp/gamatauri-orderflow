import { useState } from "react";
import { Wine, Gift, PartyPopper, Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface ChristmasMoment {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  gradient: string;
  textColor: string;
  badgeStyle: string;
  category?: string;
}

const christmasMoments: ChristmasMoment[] = [
  {
    id: "ceia",
    icon: <Wine className="w-8 h-8" />,
    title: "Ceia em Família",
    subtitle: "O clássico que todo mundo concorda",
    description: "Vinhos suaves, espumantes e cervejas premium",
    badge: "Mais vendidos no Natal",
    gradient: "bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-100",
    textColor: "text-amber-900",
    badgeStyle: "bg-amber-600 text-white",
    category: "vinhos",
  },
  {
    id: "presentes",
    icon: <Gift className="w-8 h-8" />,
    title: "Presentes que Impressionam",
    subtitle: "Sem erro, sem vergonha",
    description: "Whiskies, gins premium e kits presenteáveis",
    badge: "Ótima escolha para presente",
    gradient: "bg-gradient-to-br from-emerald-800 via-green-700 to-emerald-900",
    textColor: "text-white",
    badgeStyle: "bg-white/90 text-emerald-800",
    category: "destilados",
  },
  {
    id: "amigos",
    icon: <PartyPopper className="w-8 h-8" />,
    title: "Natal com Amigos",
    subtitle: "Risadas, música e copos cheios",
    description: "Vodkas, energéticos e combos prontos",
    badge: "Combos econômicos",
    gradient: "bg-gradient-to-br from-red-400 via-rose-500 to-red-600",
    textColor: "text-white",
    badgeStyle: "bg-white/90 text-red-700",
    category: "drinks-prontos",
  },
  {
    id: "brinde",
    icon: <Sparkles className="w-8 h-8" />,
    title: "Brinde da Meia-Noite",
    subtitle: "O momento mais esperado",
    description: "Espumantes brut, moscatel e opções geladas",
    badge: "Estoure à meia-noite",
    gradient: "bg-gradient-to-br from-zinc-900 via-zinc-800 to-black",
    textColor: "text-white",
    badgeStyle: "bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-900 animate-pulse",
    category: "vinhos",
  },
];

interface ChristmasSectionProps {
  onCategoryClick?: (category: string) => void;
}

export const ChristmasSection = ({ onCategoryClick }: ChristmasSectionProps) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [touchFeedback, setTouchFeedback] = useState<string | null>(null);

  const handleCardClick = (moment: ChristmasMoment) => {
    setTouchFeedback(moment.id);
    setTimeout(() => setTouchFeedback(null), 1000);
    
    if (onCategoryClick && moment.category) {
      onCategoryClick(moment.category);
    }
  };

  return (
    <section className="py-6 relative overflow-hidden">
      {/* Background with warm gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-rose-950/40 via-amber-950/30 to-background pointer-events-none" />
      
      {/* Subtle snow effect */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: -10,
            }}
            animate={{
              y: ["0vh", "100vh"],
              x: [0, Math.random() * 20 - 10],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            <span className="mr-2">🎄</span>
            Natal que Brilha no Copo
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Seleções especiais para celebrar, presentear e brindar
          </p>
        </div>

        {/* Horizontal Scrolling Cards */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-4 snap-x snap-mandatory">
            {christmasMoments.map((moment, index) => (
              <motion.div
                key={moment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="snap-start flex-shrink-0 w-[280px] md:w-[320px]"
              >
                <button
                  onClick={() => handleCardClick(moment)}
                  onMouseEnter={() => setHoveredCard(moment.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`
                    relative w-full p-5 rounded-2xl ${moment.gradient} ${moment.textColor}
                    transition-all duration-300 transform
                    hover:scale-[1.02] hover:shadow-2xl
                    active:scale-[0.98]
                    overflow-hidden group text-left
                  `}
                >
                  {/* Golden glow on hover */}
                  <div 
                    className={`
                      absolute inset-0 bg-gradient-to-t from-amber-400/20 to-transparent
                      opacity-0 transition-opacity duration-300
                      ${hoveredCard === moment.id ? 'opacity-100' : ''}
                    `}
                  />

                  {/* Badge */}
                  <span className={`
                    inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3
                    ${moment.badgeStyle}
                  `}>
                    {moment.badge}
                  </span>

                  {/* Icon */}
                  <div className="mb-3 opacity-90">
                    {moment.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold mb-1">
                    {moment.title}
                  </h3>
                  <p className="text-sm opacity-80 mb-2 italic">
                    "{moment.subtitle}"
                  </p>
                  <p className="text-xs opacity-70 mb-4">
                    {moment.description}
                  </p>

                  {/* CTA */}
                  <div className="flex items-center gap-1 text-sm font-semibold group-hover:gap-2 transition-all">
                    Ver seleção
                    <ChevronRight className="w-4 h-4" />
                  </div>

                  {/* Touch feedback */}
                  {touchFeedback === moment.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                                 bg-white/90 text-zinc-800 px-4 py-2 rounded-full text-sm font-medium shadow-lg"
                    >
                      Boa escolha 🎄
                    </motion.div>
                  )}

                  {/* Decorative snowflakes on hover */}
                  {hoveredCard === moment.id && (
                    <>
                      <motion.span
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: [0, 1, 0], y: -20 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute top-2 right-4 text-lg"
                      >
                        ❄️
                      </motion.span>
                      <motion.span
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: [0, 1, 0], y: -15 }}
                        transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}
                        className="absolute top-4 right-12 text-sm"
                      >
                        ❄️
                      </motion.span>
                    </>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Optional CTA - Mini wizard teaser */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-center"
        >
          <button className="
            inline-flex items-center gap-2 px-5 py-2.5 
            bg-gradient-to-r from-amber-500 to-yellow-500
            hover:from-amber-600 hover:to-yellow-600
            text-zinc-900 font-semibold rounded-full
            transition-all duration-300 transform hover:scale-105
            shadow-lg hover:shadow-amber-500/30
          ">
            <Sparkles className="w-4 h-4" />
            Não sabe o que escolher? A gente monta pra você
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>

      {/* Add scrollbar-hide utility */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};
