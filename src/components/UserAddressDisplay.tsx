import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, ChevronDown } from "lucide-react";
import { AddressSelectorModal } from "./AddressSelectorModal";
import { fetchAddresses } from "@/services/api/addresses";

interface UserAddressDisplayProps {
  className?: string;
}

export const UserAddressDisplay = ({ className = "" }: UserAddressDisplayProps) => {
  const { user } = useAuth();
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    const loadAddress = async () => {
      if (!user) { setLoading(false); return; }
      try {
        const addresses = await fetchAddresses();
        const primary = addresses.find(a => a.is_primary || a.is_default);
        if (primary) {
          setAddress(`${primary.street}, ${primary.number} - ${primary.neighborhood}`);
        }
      } catch (error) {
        console.error('Erro ao buscar endereço:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAddress();
  }, [user]);

  if (loading || !address) return null;

  const formatAddress = (addr: string): string => {
    if (addr.toLowerCase().startsWith("r.")) return addr;
    if (addr.toLowerCase().startsWith("rua ")) return "R." + addr.slice(3);
    return "R. " + addr;
  };

  return (
    <>
      <button onClick={() => setShowSelector(true)} className={`flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors ${className}`}>
        <MapPin className="h-4 w-4 text-primary" />
        <span className="font-medium">{formatAddress(address)}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      <AddressSelectorModal open={showSelector} onOpenChange={setShowSelector} onSelectAddress={() => {}} />
    </>
  );
};
