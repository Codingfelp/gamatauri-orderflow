import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Package, MapPin, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { ActiveOrderBanner } from "@/components/ActiveOrderBanner";
import { AddressSelector } from "@/components/AddressSelector";
import { ProfileIncompleteAlert } from "@/components/ProfileIncompleteAlert";
import { supabase } from "@/integrations/supabase/client";

export const Header = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [userAddress, setUserAddress] = useState<string>("");
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadUserAddress();
      checkProfileComplete();
    }
  }, [user]);

  const loadUserAddress = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("address")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      if (data?.address) {
        setUserAddress(data.address);
      }
    } catch (error) {
      console.error("Error loading address:", error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const checkProfileComplete = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, cpf, phone, address")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      const missing: string[] = [];
      if (!data?.name) missing.push('nome');
      if (!(data as any)?.cpf) missing.push('CPF');
      if (!data?.phone) missing.push('telefone');
      if (!data?.address) missing.push('endereço');

      setMissingFields(missing);
    } catch (error) {
      console.error("Error checking profile:", error);
    }
  };

  const handleAddressSelect = (address: string) => {
    setUserAddress(address);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-md backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 flex h-20 items-center justify-between">
          <div className="flex-1" />

          {user && (
            <div 
              onClick={() => setShowAddressSelector(true)}
              className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 px-4 py-2 rounded-lg transition-colors"
            >
              <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground text-center">Entregar em</p>
                <p className="font-semibold text-sm text-center">
                  {userAddress || "Selecione o endereço"} ▼
                </p>
              </div>
            </div>
          )}

          <div className="flex-1 flex justify-end items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-12 w-12 rounded-full hover:bg-accent transition-colors">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 shadow-xl">
                  <div className="flex items-center justify-start gap-2 p-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold text-card-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/orders')} className="cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    Pedidos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => navigate("/auth")} size="lg" className="font-semibold">
                <User className="mr-2 h-5 w-5" />
                Entrar
              </Button>
            )}
          </div>
        </div>
      </header>
      <ProfileIncompleteAlert missingFields={missingFields} />
      <ActiveOrderBanner />
      
      {user && (
        <AddressSelector
          open={showAddressSelector}
          onOpenChange={setShowAddressSelector}
          onSelectAddress={handleAddressSelect}
          userId={user.id}
        />
      )}
    </>
  );
};
