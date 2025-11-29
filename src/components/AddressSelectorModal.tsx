import { useState, useEffect } from "react";
import { MapPin, Plus, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

export const AddressSelectorModal = ({
  open,
  onOpenChange,
  onSelectAddress,
}: AddressSelectorModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && user) {
      fetchAddresses();
    }
  }, [open, user]);

  const fetchAddresses = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", user.id)
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

  const handleSelectAddress = async (address: Address) => {
    try {
      // Remove primary de todos
      await supabase
        .from("user_addresses")
        .update({ is_primary: false })
        .eq("user_id", user!.id);

      // Define o selecionado como principal
      await supabase
        .from("user_addresses")
        .update({ is_primary: true })
        .eq("id", address.id);

      // Atualiza o endereço no profile
      const fullAddress = `${address.street}, ${address.number}${address.complement ? ', ' + address.complement : ''}, ${address.neighborhood}, ${address.city} - ${address.state}`;
      
      await supabase
        .from("profiles")
        .update({ address: fullAddress })
        .eq("user_id", user!.id);

      onSelectAddress(address);
      onOpenChange(false);
      toast.success("Endereço atualizado");
      
      // Reload da página para atualizar o endereço exibido
      window.location.reload();
    } catch (error) {
      console.error("Erro ao selecionar endereço:", error);
      toast.error("Erro ao selecionar endereço");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Selecione um endereço</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">
                Nenhum endereço cadastrado
              </p>
              <Button onClick={() => navigate("/addresses")}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar endereço
              </Button>
            </div>
          ) : (
            <>
              {addresses.map((address) => (
                <Card
                  key={address.id}
                  onClick={() => handleSelectAddress(address)}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                    address.is_primary ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold">
                          {address.street}, {address.number}
                        </p>
                        {address.is_primary && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      {address.complement && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {address.complement}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {address.neighborhood}, {address.city} - {address.state}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {address.shipping_fee !== null ? (
                        <div>
                          <p className="text-xs text-muted-foreground">Frete</p>
                          <p className="font-bold text-primary">
                            R$ {address.shipping_fee.toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          Calcular frete
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  onOpenChange(false);
                  navigate("/addresses");
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Gerenciar endereços
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
