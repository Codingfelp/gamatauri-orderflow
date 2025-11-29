import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Package, Bell, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { ActiveOrderBanner } from "@/components/ActiveOrderBanner";
import { AddressSelectorModal } from "@/components/AddressSelectorModal";
import { ProfileIncompleteAlert } from "@/components/ProfileIncompleteAlert";
import { AddressIncompleteAlert } from "@/components/AddressIncompleteAlert";
import { isAddressComplete } from "@/utils/addressValidator";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/gamatauri-logo.png";

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

export const Header = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [userAddress, setUserAddress] = useState<string>("");
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [addressIncompleteReason, setAddressIncompleteReason] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserAddress();
      checkProfileComplete();
      checkAddressComplete();
    }
  }, [user]);

  const loadUserAddress = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_primary", true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        const fullAddress = `${data.street}, ${data.number}${data.complement ? ` - ${data.complement}` : ""} - ${data.neighborhood}`;
        setUserAddress(fullAddress);
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

  const checkAddressComplete = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('address')
        .eq('user_id', user.id)
        .single();
      
      const validation = isAddressComplete(profile?.address);
      if (!validation.complete) {
        setAddressIncompleteReason(validation.reason);
      } else {
        setAddressIncompleteReason(null);
      }
    } catch (error) {
      console.error("Error checking address:", error);
    }
  };

  const handleAddressSelect = (address: Address) => {
    const fullAddress = `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ""} - ${address.neighborhood}`;
    setUserAddress(fullAddress);
    checkAddressComplete();
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-md backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between relative">
            {/* LOGO À ESQUERDA (apenas desktop) */}
            <div className="hidden md:flex items-center cursor-pointer flex-shrink-0" onClick={() => navigate('/')}>
              <img 
                src={logo} 
                alt="Gamatauri - Distribuidora de Bebidas" 
                className="h-8 w-auto object-contain hover:opacity-80 transition-opacity"
              />
            </div>

            {/* ESPAÇO VAZIO MOBILE */}
            <div className="flex-1 md:hidden" />

            {/* ENDEREÇO - CENTRALIZADO NO DESKTOP */}
            {user && (
              <div 
                onClick={() => setShowAddressSelector(true)}
                className="flex items-center cursor-pointer hover:bg-accent/50 px-2 md:px-4 py-2 rounded-lg transition-colors md:absolute md:left-1/2 md:-translate-x-1/2"
              >
                <div className="text-left md:text-center">
                  <p className="text-[10px] md:text-xs text-muted-foreground">Entregar em</p>
                  <p className="font-semibold text-xs md:text-sm">
                    {userAddress || "Selecione o endereço"}
                  </p>
                </div>
              </div>
            )}

            {/* NOTIFICAÇÕES (MOBILE) / AVATAR (DESKTOP) - SEMPRE À DIREITA */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {/* Mobile: Ícone de Notificações */}
                  <button 
                    className="md:hidden relative p-2 hover:bg-accent rounded-full transition-colors"
                    aria-label="Notificações"
                  >
                    <Bell className="h-6 w-6 text-foreground" />
                    {/* Bolinha vermelha de notificação */}
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background"></span>
                  </button>

                  {/* Desktop: Avatar com Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="hidden md:flex relative h-12 w-12 rounded-full hover:bg-accent transition-colors">
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
                </>
              ) : (
                <Button onClick={() => navigate("/auth")} size="lg" className="font-semibold">
                  <User className="mr-2 h-5 w-5" />
                  Entrar
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
      <ProfileIncompleteAlert missingFields={missingFields} />
      {addressIncompleteReason && <AddressIncompleteAlert reason={addressIncompleteReason} />}
      <ActiveOrderBanner />
      
      {user && (
        <AddressSelectorModal
          open={showAddressSelector}
          onOpenChange={setShowAddressSelector}
          onSelectAddress={handleAddressSelect}
        />
      )}
    </>
  );
};
