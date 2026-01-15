import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Save, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useColorEditor } from '@/contexts/ColorEditorContext';
import { toast } from 'sonner';

export const EditModeToolbar = () => {
  const { isEditMode, toggleEditMode, hasUnsavedChanges, saveColors, isSaving, canEdit } = useColorEditor();

  if (!canEdit) return null;

  const handleSave = async () => {
    try {
      await saveColors();
      toast.success('Cores salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar cores');
    }
  };

  return (
    <AnimatePresence>
      {isEditMode && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 bg-card border border-primary shadow-2xl rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 text-primary">
              <Palette className="w-5 h-5" />
              <span className="text-sm font-semibold">Modo Edição</span>
            </div>
            
            {hasUnsavedChanges && (
              <div className="flex items-center gap-1 text-amber-500 text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>Alterações não salvas</span>
              </div>
            )}

            <div className="flex items-center gap-2 ml-2">
              <Button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving}
                size="sm"
                className="gap-1"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
              
              <Button
                onClick={toggleEditMode}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <X className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
