import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useColorEditor } from "@/contexts/ColorEditorContext";
import { useToast } from "@/hooks/use-toast";

interface ColorEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  category: string | null;
  onColorChange?: (color: string) => void;
}

export const ColorEditorModal = ({ 
  isOpen, 
  onClose, 
  productName, 
  category,
  onColorChange 
}: ColorEditorModalProps) => {
  const { getProductColors, updateColor, saveColors, isSaving } = useColorEditor();
  const { toast } = useToast();
  
  const currentColors = getProductColors(productName, category);
  const [tempColor, setTempColor] = useState(currentColors?.modal_bg_color || '#ffffff');
  
  // Sincronizar tempColor quando abrir modal ou produto mudar
  useEffect(() => {
    if (isOpen) {
      const colors = getProductColors(productName, category);
      setTempColor(colors?.modal_bg_color || '#ffffff');
    }
  }, [isOpen, productName, category, getProductColors]);
  
  // Atualizar cor em tempo real
  const handleColorChange = (newColor: string) => {
    setTempColor(newColor);
    updateColor(productName, category, 'modal_bg_color', newColor);
    onColorChange?.(newColor);
  };
  
  const handleSave = async () => {
    try {
      await saveColors();
      toast({ 
        title: "✅ Cores salvas!",
        description: `Cor de fundo do produto "${productName}" atualizada.`
      });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar cores:', error);
      toast({ 
        title: "❌ Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  const handleCancel = () => {
    // Restaurar cor original
    const originalColors = getProductColors(productName, category);
    const originalColor = originalColors?.modal_bg_color || '#ffffff';
    setTempColor(originalColor);
    onColorChange?.(originalColor);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-sm rounded-2xl z-[200]">
        <DialogHeader>
          <DialogTitle className="text-lg">Editar Cor de Fundo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Preview do produto com cor */}
          <div 
            className="w-full h-24 rounded-xl border-2 border-border shadow-inner flex items-center justify-center transition-colors"
            style={{ backgroundColor: tempColor }}
          >
            <span 
              className="text-sm font-medium px-3 py-1 rounded-full bg-black/20 text-white drop-shadow"
            >
              Preview
            </span>
          </div>
          
          {/* Seletor de cor nativo (amplo e fácil de usar) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Selecione a cor:</label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={tempColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-16 h-16 rounded-xl border-2 border-border cursor-pointer p-1"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={tempColor}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val) || val === '#') {
                      setTempColor(val);
                      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                        handleColorChange(val);
                      }
                    }
                  }}
                  placeholder="#ffffff"
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm uppercase"
                />
              </div>
            </div>
          </div>
          
          {/* Cores pré-definidas */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Cores rápidas:</label>
            <div className="flex flex-wrap gap-2">
              {[
                '#ffffff', '#f5f5f5', '#e0e0e0', '#1a1a1a', '#000000',
                '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6',
                '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#6366f1'
              ].map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                    tempColor === color ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Botões de ação */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
