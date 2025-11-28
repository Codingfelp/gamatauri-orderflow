import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, MapPin, Star, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomNavigation } from "@/components/BottomNavigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "Belo Horizonte",
    state: "MG",
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchAddresses();
  }, [user]);

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
            is_primary: addresses.length === 0,
          });

        if (error) throw error;
        toast.success("Endereço adicionado");
      }

      setShowDialog(false);
      setEditingAddress(null);
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
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/profile")}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold">Meus Endereços</h1>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingAddress(null);
                setShowDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Novo
            </Button>
          </div>
        </div>
      </div>

      {/* Addresses List */}
      <div className="max-w-md mx-auto px-4 py-6">
        {addresses.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">Nenhum endereço cadastrado</p>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar endereço
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
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
                <p className="text-sm font-medium mb-1">
                  {address.street}, {address.number}
                  {address.complement && `, ${address.complement}`}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
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
                <Label>Cidade</Label>
                <Input value={formData.city} disabled />
              </div>
              <div>
                <Label>UF</Label>
                <Input value={formData.state} disabled />
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
