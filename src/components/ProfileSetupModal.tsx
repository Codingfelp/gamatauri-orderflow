import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package } from "lucide-react";

interface ProfileSetupModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export const ProfileSetupModal = ({ open, onClose, userId }: ProfileSetupModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    address: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha seu telefone",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone: formData.phone.trim(),
          address: formData.address.trim() || null,
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Perfil completado!",
        description: "Seus dados foram salvos com sucesso.",
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="sm:max-w-md animate-scale-in">
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center">Complete seu perfil</DialogTitle>
          <DialogDescription className="text-center">
            Precisamos de algumas informações para finalizar seu cadastro
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-base font-semibold flex items-center gap-2">
              <span>Telefone</span>
              <span className="text-primary">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(31) 98765-4321"
              className="h-12 text-base border-2 focus:border-primary transition-all"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="text-base font-semibold">
              Endereço (opcional)
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Rua, número, bairro"
              className="min-h-[80px] text-base border-2 focus:border-primary transition-all resize-none"
              rows={3}
            />
          </div>
          <Button
            type="submit"
            className="w-full h-12 text-base font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar e Continuar'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};