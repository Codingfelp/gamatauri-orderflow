import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, MapPin, Star, Trash2, Pencil, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BottomNavigation } from "@/components/BottomNavigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { useAddressByCEP } from "@/hooks/useAddressByCEP";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BRAZILIAN_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

interface Address {
  id: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  is_primary: boolean;
}

const Addresses = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { fetchAddress, loading: cepLoading, error: cepError } = useAddressByCEP();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [cep, setCep] = useState("");
  const [formData, setFormData] = useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "Belo Horizonte",
    state: "MG",
  });

  const handleCepSearch = async () => {
    const addressData = await fetchAddress(cep);
    if (addressData) {
      setFormData({
        ...formData,
        street: addressData.logradouro || formData.street,
        neighborhood: addressData.bairro || formData.neighborhood,
        city: addressData.localidade || formData.city,
        state: addressData.uf || formData.state,
        complement: addressData.complemento || formData.complement,
      });
      toast.success("Endereço encontrado!");
    }
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 8);
    if (numbers.length > 5) {
      return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
    }
    return numbers;
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchAddresses();
    }
  }, [user, authLoading, navigate]);

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", user!.id)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error("Erro ao buscar endereços:", error);
      toast.error("Erro ao carregar endereços");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!formData.street || !formData.number || !formData.neighborhood) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const isPrimary = editingAddress?.is_primary || addresses.length === 0;
      
      if (editingAddress) {
        const { error } = await supabase
          .from("user_addresses")
          .update(formData)
          .eq("id", editingAddress.id);

        if (error) throw error;
        toast.success("Endereço atualizado");
      } else {
        const { error } = await supabase
          .from("user_addresses")
          .insert({
            ...formData,
            user_id: user!.id,
            is_primary: isPrimary,
          });

        if (error) throw error;
        toast.success("Endereço adicionado");
      }

      // Sincronizar profiles.address se for endereço primário
      if (isPrimary) {
        const fullAddress = `${formData.street}, ${formData.number}${formData.complement ? ', ' + formData.complement : ''}, ${formData.neighborhood}, ${formData.city} - ${formData.state}`;
        
        await supabase
          .from('profiles')
          .update({ address: fullAddress })
          .eq('user_id', user!.id);
      }

      setShowDialog(false);
      setEditingAddress(null);
      setCep("");
      setFormData({
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "Belo Horizonte",
        state: "MG",
      });
      fetchAddresses();
    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
      toast.error("Erro ao salvar endereço");
    }
  };

  const handleSetPrimary = async (addressId: string) => {
    try {
      // Remove primary de todos
      await supabase
        .from("user_addresses")
        .update({ is_primary: false })
        .eq("user_id", user!.id);

      // Define o selecionado como principal
      const { error } = await supabase
        .from("user_addresses")
        .update({ is_primary: true })
        .eq("id", addressId);

      if (error) throw error;
      
      // Sincronizar profiles.address com o novo endereço primário
      const { data: newPrimaryAddress } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("id", addressId)
        .single();
      
      if (newPrimaryAddress) {
        const fullAddress = `${newPrimaryAddress.street}, ${newPrimaryAddress.number}${newPrimaryAddress.complement ? ', ' + newPrimaryAddress.complement : ''}, ${newPrimaryAddress.neighborhood}, ${newPrimaryAddress.city} - ${newPrimaryAddress.state}`;
        
        await supabase
          .from('profiles')
          .update({ address: fullAddress })
          .eq('user_id', user!.id);
      }
      
      toast.success("Endereço principal atualizado");
      fetchAddresses();
    } catch (error) {
      console.error("Erro ao definir endereço principal:", error);
      toast.error("Erro ao atualizar endereço");
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const { error } = await supabase
        .from("user_addresses")
        .delete()
        .eq("id", addressId);

      if (error) throw error;
      toast.success("Endereço removido");
      fetchAddresses();
    } catch (error) {
      console.error("Erro ao deletar endereço:", error);
      toast.error("Erro ao remover endereço");
    }
  };

  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    setCep("");
    setFormData({
      street: address.street,
      number: address.number,
      complement: address.complement || "",
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
    });
    setShowDialog(true);
  };

  const openNewDialog = () => {
    setEditingAddress(null);
    setCep("");
    setFormData({
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "Belo Horizonte",
      state: "MG",
    });
    setShowDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/profile")}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl md:text-2xl font-bold">Meus Endereços</h1>
            </div>
            <Button size="sm" onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-1" />
              Novo
            </Button>
          </div>
        </div>
      </div>

      {/* Addresses List */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {addresses.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">Nenhum endereço cadastrado</p>
            <Button onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar endereço
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {addresses.map((address) => (
              <Card key={address.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                    {address.is_primary && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditDialog(address)}
                      className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(address.id)}
                      className="p-2 hover:bg-destructive/10 rounded-full transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </div>
                <p className="text-sm md:text-base font-medium mb-1">
                  {address.street}, {address.number}
                  {address.complement && `, ${address.complement}`}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground mb-3">
                  {address.neighborhood}, {address.city} - {address.state}
                </p>
                {!address.is_primary && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetPrimary(address.id)}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Definir como principal
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Editar endereço" : "Novo endereço"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* CEP Search */}
            <div>
              <Label>CEP (opcional)</Label>
              <div className="flex gap-2">
                <Input
                  value={cep}
                  onChange={(e) => setCep(formatCep(e.target.value))}
                  placeholder="00000-000"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCepSearch}
                  disabled={cepLoading || cep.replace(/\D/g, "").length !== 8}
                >
                  {cepLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {cepError && (
                <p className="text-xs text-destructive mt-1">{cepError}</p>
              )}
            </div>

            <div>
              <Label>Rua *</Label>
              <Input
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                placeholder="Nome da rua"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Número *</Label>
                <Input
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="123"
                />
              </div>
              <div>
                <Label>Complemento</Label>
                <Input
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                  placeholder="Apto 45"
                />
              </div>
            </div>
            <div>
              <Label>Bairro *</Label>
              <Input
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                placeholder="Centro"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label>Cidade *</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Belo Horizonte"
                />
              </div>
              <div>
                <Label>UF *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => setFormData({ ...formData, state: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSaveAddress} className="w-full">
              {editingAddress ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
};

export default Addresses;
