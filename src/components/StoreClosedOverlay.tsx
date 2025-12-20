import { useStoreStatus } from "@/contexts/StoreStatusContext";
import { Store, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const StoreClosedOverlay = () => {
  const { storeStatus, isLoading } = useStoreStatus();

  // Don't show while loading or if store is open
  if (isLoading || storeStatus.isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
      >
        <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          {/* Animated icon */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative mb-8"
          >
            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
              <Store className="w-16 h-16 text-muted-foreground" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <Clock className="w-6 h-6 text-primary" />
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-foreground mb-4"
          >
            Loja Fechada
          </motion.h1>

          {/* Message */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground text-lg mb-6"
          >
            {storeStatus.closedMessage}
          </motion.p>

          {/* Reason if provided */}
          {storeStatus.closedReason && (
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-muted-foreground/70 text-sm mb-6"
            >
              {storeStatus.closedReason}
            </motion.p>
          )}

          {/* Reassurance message */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-muted/50 rounded-xl p-4"
          >
            <p className="text-foreground/80 text-sm">
              Em breve estaremos prontos para atendê-lo! 🙂
            </p>
          </motion.div>

          {/* Pulsing indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 flex items-center gap-2 text-muted-foreground text-sm"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-2 h-2 rounded-full bg-yellow-500"
            />
            <span>Aguardando reabertura...</span>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
