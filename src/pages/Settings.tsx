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
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
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
        // Parsear endereço existente
        const address = data.address || "";
        const parts = address.split(',').map((p: string) => p.trim());
        
        // Tentar extrair número da primeira parte
        const streetPart = parts[0] || '';
        const numberMatch = streetPart.match(/\d+[A-Za-z]?$/);
        const street = numberMatch ? streetPart.replace(/\d+[A-Za-z]?$/, '').trim() : streetPart;
        const number = numberMatch ? numberMatch[0] : '';
        
        // Extrair complemento se existir (procurar por palavras como Apto, Bloco, etc)
        const complement = parts[1]?.match(/(Apto|Apt|Bloco|Casa|Lote).*/i)?.[0] || '';
        const neighborhood = complement ? parts[2] || '' : parts[1] || '';
        const cityState = parts[parts.length - 1] || '';
        const [city, state] = cityState.split('-').map((s: string) => s.trim());
        
        setFormData({
          name: data.name || "",
          cpf: formatCPF((data as any).cpf || ""),
          phone: data.phone || "",
          cep: "",
          street: street,
          number: number,
          complement: complement,
          neighborhood: neighborhood,
          city: city || "",
          state: state || "",
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
      setFormData(prev => ({ 
        ...prev, 
        street: addressData.logradouro,
        neighborhood: addressData.bairro,
        city: addressData.localidade,
        state: addressData.uf,
      }));
      toast({
        title: "Endereço encontrado!",
        description: "Agora informe o número da sua casa",
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

    if (!formData.street.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha a rua",
        variant: "destructive",
      });
      return;
    }

    if (!formData.number.trim()) {
      toast({
        title: "Número obrigatório",
        description: "Por favor, informe o número da sua casa/prédio",
        variant: "destructive",
      });
      return;
    }

    if (!formData.neighborhood.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha o bairro",
        variant: "destructive",
      });
      return;
    }

    // Montar endereço completo
    const fullAddress = `${formData.street}, ${formData.number}${formData.complement ? ', ' + formData.complement : ''}, ${formData.neighborhood}, ${formData.city} - ${formData.state}`;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name.trim(),
          cpf: cpfDigits,
          phone: formData.phone.trim(),
          address: fullAddress,
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
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/profile')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card className="shadow-xl border-2 border-primary/10">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl md:text-3xl font-bold">Dados da Conta</CardTitle>
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
                <Label htmlFor="street" className="text-base font-semibold flex items-center gap-2">
                  <span>Rua</span>
                  <span className="text-primary">*</span>
                </Label>
                <Input
                  id="street"
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                  placeholder="Nome da Rua"
                  className="h-12 text-base border-2 focus:border-primary transition-all"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number" className="text-base font-semibold flex items-center gap-2">
                    <span>Número</span>
                    <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="number"
                    type="text"
                    value={formData.number}
                    onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                    placeholder="123"
                    className="h-12 text-base border-2 focus:border-primary transition-all"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="complement" className="text-base font-semibold">
                    Complemento
                  </Label>
                  <Input
                    id="complement"
                    type="text"
                    value={formData.complement}
                    onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
                    placeholder="Apto 101"
                    className="h-12 text-base border-2 focus:border-primary transition-all"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="neighborhood" className="text-base font-semibold flex items-center gap-2">
                  <span>Bairro</span>
                  <span className="text-primary">*</span>
                </Label>
                <Input
                  id="neighborhood"
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  placeholder="Nome do Bairro"
                  className="h-12 text-base border-2 focus:border-primary transition-all"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="col-span-2 sm:col-span-2 space-y-2">
                  <Label htmlFor="city" className="text-base font-semibold">
                    Cidade
                  </Label>
                  <Input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Cidade"
                    className="h-12 text-base border-2 focus:border-primary transition-all"
                    readOnly
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-base font-semibold">
                    UF
                  </Label>
                  <Input
                    id="state"
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="MG"
                    maxLength={2}
                    className="h-12 text-base border-2 focus:border-primary transition-all uppercase"
                    readOnly
                  />
                </div>
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
