import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Address {
  id?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
}

interface AddressSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAddress: (address: string) => void;
  userId: string;
}

export const AddressSelector = ({ open, onOpenChange, onSelectAddress, userId }: AddressSelectorProps) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Address>({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipcode: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open && userId) {
      loadAddresses();
    }
  }, [open, userId]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("address")
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      if (profile?.address) {
        // Parse stored addresses (assuming comma-separated for now)
        setAddresses([{ street: profile.address, number: "", neighborhood: "", city: "", state: "", zipcode: "" }]);
      }
    } catch (error: any) {
      console.error("Error loading addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAddress = (address: Address) => {
    const fullAddress = `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ""} - ${address.neighborhood}`;
    onSelectAddress(fullAddress);
    onOpenChange(false);
  };

  const handleAddAddress = async () => {
    if (!newAddress.street || !newAddress.number || !newAddress.neighborhood) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha rua, número e bairro",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const fullAddress = `${newAddress.street}, ${newAddress.number}${newAddress.complement ? ` - ${newAddress.complement}` : ""} - ${newAddress.neighborhood}`;
      
      const { error } = await supabase
        .from("profiles")
        .update({ address: fullAddress })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Endereço adicionado",
        description: "Seu endereço foi salvo com sucesso",
      });

      onSelectAddress(fullAddress);
      onOpenChange(false);
      setShowAddForm(false);
      setNewAddress({
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zipcode: "",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar endereço",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Endereço de entrega
          </DialogTitle>
        </DialogHeader>

        {loading && !showAddForm ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : showAddForm ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="street">Rua *</Label>
              <Input
                id="street"
                value={newAddress.street}
                onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                placeholder="Nome da rua"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="number">Número *</Label>
                <Input
                  id="number"
                  value={newAddress.number}
                  onChange={(e) => setNewAddress({ ...newAddress, number: e.target.value })}
                  placeholder="123"
                />
              </div>
              <div>
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={newAddress.complement}
                  onChange={(e) => setNewAddress({ ...newAddress, complement: e.target.value })}
                  placeholder="Apto 101"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="neighborhood">Bairro *</Label>
              <Input
                id="neighborhood"
                value={newAddress.neighborhood}
                onChange={(e) => setNewAddress({ ...newAddress, neighborhood: e.target.value })}
                placeholder="Nome do bairro"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddAddress}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar endereço"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.length > 0 ? (
              addresses.map((addr, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectAddress(addr)}
                  className="p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors hover:border-primary"
                >
                  <p className="font-medium">{addr.street}{addr.number && `, ${addr.number}`}</p>
                  {addr.neighborhood && (
                    <p className="text-sm text-muted-foreground">{addr.neighborhood}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Nenhum endereço cadastrado
              </p>
            )}

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4" />
              Adicionar novo endereço
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
