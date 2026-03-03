import { useState, useEffect } from "react";
import { MapPin, Plus, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { fetchAddresses, updateAddress, type AddressData } from "@/services/api/addresses";

interface Address {
  id: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  is_primary: boolean;
  shipping_fee: number | null;
}

interface AddressSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAddress: (address: Address) => void;
}

export const AddressSelectorModal = ({ open, onOpenChange, onSelectAddress }: AddressSelectorModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && user) loadAddresses();
  }, [open, user]);

  const loadAddresses = async () => {
    try {
      const data = await fetchAddresses();
      setAddresses(data.map((a) => ({
        id: a.id, street: a.street, number: a.number,
        complement: a.complement || null, neighborhood: a.neighborhood,
        city: a.city, state: a.state,
        is_primary: a.is_primary || a.is_default || false,
        shipping_fee: a.shipping_fee ?? null,
      })));
    } catch (error) {
      console.error("Erro ao buscar endereços:", error);
      toast.error("Erro ao carregar endereços");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAddress = async (address: Address) => {
    try {
      await updateAddress(address.id, { is_primary: true, is_default: true } as any);
      onSelectAddress({ ...address, is_primary: true });
      onOpenChange(false);
      toast.success("Endereço atualizado");
    } catch (error) {
      console.error("Erro ao selecionar endereço:", error);
      toast.error("Erro ao selecionar endereço");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Selecione um endereço</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground mb-4">Nenhum endereço cadastrado</p>
              <Button onClick={() => navigate("/addresses")}><Plus className="h-4 w-4 mr-2" />Adicionar endereço</Button>
            </div>
          ) : (
            <>
              {addresses.map((address) => {
                const isSelected = address.is_primary;
                return (
                  <button
                    key={address.id}
                    onClick={() => handleSelectAddress(address)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isSelected ? "bg-destructive text-destructive-foreground border-destructive" : "bg-card border-border hover:border-primary/40 hover:bg-accent/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className={`h-4 w-4 flex-shrink-0 mt-0.5 ${isSelected ? "text-destructive-foreground" : "text-muted-foreground"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isSelected ? "text-destructive-foreground" : "text-foreground"}`}>{address.street}, {address.number}</p>
                        {address.complement && <p className={`text-xs mt-0.5 ${isSelected ? "text-destructive-foreground/80" : "text-muted-foreground"}`}>{address.complement}</p>}
                        <p className={`text-xs mt-0.5 ${isSelected ? "text-destructive-foreground/80" : "text-muted-foreground"}`}>{address.neighborhood}, {address.city} - {address.state}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {address.shipping_fee !== null && (
                          <span className={`text-sm font-bold ${isSelected ? "text-destructive-foreground" : "text-primary"}`}>R$ {Math.ceil(address.shipping_fee)}</span>
                        )}
                        {isSelected && <Check className="h-4 w-4 text-destructive-foreground" />}
                      </div>
                    </div>
                  </button>
                );
              })}
              <Button variant="outline" className="w-full mt-2" onClick={() => { onOpenChange(false); navigate("/addresses"); }}>
                <Plus className="h-4 w-4 mr-2" />Gerenciar endereços
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
