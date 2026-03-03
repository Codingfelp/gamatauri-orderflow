import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User } from "lucide-react";
import { updateProfile } from "@/services/api/profile";

interface ProfileSetupModalProps {
  open: boolean;
  onClose: () => void;
}

export const ProfileSetupModal = ({ open, onClose }: ProfileSetupModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const { toast } = useToast();

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast({ title: "Campo obrigatório", description: "Por favor, preencha seu nome completo", variant: "destructive" }); return; }
    if (!formData.phone.trim()) { toast({ title: "Campo obrigatório", description: "Por favor, preencha seu telefone", variant: "destructive" }); return; }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) { toast({ title: "Telefone inválido", description: "Por favor, preencha um telefone válido com DDD", variant: "destructive" }); return; }

    setLoading(true);
    try {
      await updateProfile({ name: formData.name.trim(), phone: formData.phone.trim() });
      toast({ title: "Perfil completado!", description: "Seus dados foram salvos com sucesso." });
      onClose();
    } catch (error: any) {
      toast({ title: "Erro ao salvar perfil", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="sm:max-w-md animate-scale-in">
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center">Complete seu perfil</DialogTitle>
          <DialogDescription className="text-center">Precisamos de algumas informações básicas para continuar</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-semibold flex items-center gap-2"><span>Nome Completo</span><span className="text-primary">*</span></Label>
            <Input id="name" type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="João Silva" className="h-12 text-base border-2 focus:border-primary transition-all" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-base font-semibold flex items-center gap-2"><span>Telefone</span><span className="text-primary">*</span></Label>
            <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))} placeholder="(31) 98765-4321" className="h-12 text-base border-2 focus:border-primary transition-all" required />
          </div>
          <Button type="submit" className="w-full h-12 text-base font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300" disabled={loading}>
            {loading ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Salvando...</>) : 'Salvar e Continuar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
