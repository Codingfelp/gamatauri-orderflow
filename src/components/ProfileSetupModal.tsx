import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package, Search } from "lucide-react";
import { formatCPF, validateCPF } from "@/utils/cpfValidator";
import { useAddressByCEP } from "@/hooks/useAddressByCEP";

interface ProfileSetupModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export const ProfileSetupModal = ({ open, onClose, userId }: ProfileSetupModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    phone: "",
    cep: "",
    address: "",
  });
  const { toast } = useToast();
  const { fetchAddress, loading: cepLoading, error: cepError } = useAddressByCEP();

  const handleCEPSearch = async () => {
    if (formData.cep.length < 8) return;
    
    const addressData = await fetchAddress(formData.cep);
    
    if (addressData) {
      const fullAddress = `${addressData.logradouro}, ${addressData.bairro}, ${addressData.localidade} - ${addressData.uf}`;
      setFormData(prev => ({ ...prev, address: fullAddress }));
      toast({
        title: "Endereço encontrado!",
        description: "Complete com número e complemento se necessário",
      });
    } else if (cepError) {
      toast({
        title: "CEP não encontrado",
        description: cepError,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha seu nome completo",
        variant: "destructive",
      });
      return;
    }

    if (!formData.cpf.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha seu CPF",
        variant: "destructive",
      });
      return;
    }

    const cpfValidation = validateCPF(formData.cpf);
    if (!cpfValidation.valid) {
      toast({
        title: "CPF inválido",
        description: cpfValidation.error,
        variant: "destructive",
      });
      return;
    }
    
    const cpfDigits = formData.cpf.replace(/\D/g, '');

    // Verificar se CPF já existe
    const { data: existingProfile, error: cpfCheckError } = await supabase
      .from('profiles')
      .select('user_id, name')
      .eq('cpf', cpfDigits)
      .neq('user_id', userId)
      .maybeSingle();

    if (cpfCheckError) {
      console.error('Erro ao verificar CPF:', cpfCheckError);
    }

    if (existingProfile) {
      toast({
        title: "CPF já cadastrado",
        description: `Este CPF já está vinculado a outra conta (${existingProfile.name}). Cada CPF pode ter apenas uma conta.`,
        variant: "destructive",
        duration: 8000,
      });
      
      // Deslogar o usuário
      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = '/auth';
      }, 2000);
      
      return;
    }

    if (!formData.phone.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha seu telefone",
        variant: "destructive",
      });
      return;
    }

    if (!formData.address.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha seu endereço completo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name.trim(),
          cpf: cpfDigits,
          phone: formData.phone.trim(),
          address: formData.address.trim(),
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
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-semibold flex items-center gap-2">
              <span>Nome Completo</span>
              <span className="text-primary">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="João Silva"
              className="h-12 text-base border-2 focus:border-primary transition-all"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cpf" className="text-base font-semibold flex items-center gap-2">
              <span>CPF</span>
              <span className="text-primary">*</span>
            </Label>
            <Input
              id="cpf"
              type="text"
              value={formData.cpf}
              onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
              placeholder="123.456.789-01"
              maxLength={14}
              className="h-12 text-base border-2 focus:border-primary transition-all"
              required
            />
          </div>
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
            <Label htmlFor="cep" className="text-base font-semibold">
              CEP
            </Label>
            <div className="flex gap-2">
              <Input
                id="cep"
                type="text"
                value={formData.cep}
                onChange={(e) => {
                  const formatted = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setFormData(prev => ({ ...prev, cep: formatted }));
                }}
                onBlur={handleCEPSearch}
                placeholder="00000-000"
                maxLength={9}
                className="flex-1 h-12 text-base border-2 focus:border-primary transition-all"
              />
              <Button
                type="button"
                onClick={handleCEPSearch}
                disabled={cepLoading || formData.cep.length !== 8}
                variant="outline"
                size="icon"
                className="h-12 w-12"
              >
                {cepLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="text-base font-semibold flex items-center gap-2">
              <span>Endereço completo</span>
              <span className="text-primary">*</span>
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="R. Nome da Rua, 123, Bairro, Cidade - UF"
              className="min-h-[80px] text-base border-2 focus:border-primary transition-all resize-none"
              rows={3}
              required
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