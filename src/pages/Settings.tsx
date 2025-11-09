import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowLeft, Search } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { formatCPF, validateCPF } from "@/utils/cpfValidator";
import { useAddressByCEP } from "@/hooks/useAddressByCEP";

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    phone: "",
    cep: "",
    address: "",
  });
  const { fetchAddress, loading: cepLoading, error: cepError } = useAddressByCEP();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      loadProfile();
    }
  }, [user, authLoading]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, cpf, phone, address')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name || "",
          cpf: formatCPF((data as any).cpf || ""),
          phone: data.phone || "",
          cep: "",
          address: data.address || "",
        });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

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

    if (!user) return;

    // Validações
    if (!formData.name.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha seu nome completo",
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
        description: "Por favor, preencha seu endereço",
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
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
      
      // Recarregar página para atualizar header
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-accent/5 to-accent/10">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-accent/5 to-accent/10">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card className="shadow-xl border-2 border-primary/10">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-3xl font-bold">Configurações</CardTitle>
            <CardDescription>
              Gerencie suas informações pessoais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <Label htmlFor="cep" className="text-base font-semibold flex items-center gap-2">
                  <span>CEP</span>
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
                  className="min-h-[100px] text-base border-2 focus:border-primary transition-all resize-none"
                  rows={4}
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
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
