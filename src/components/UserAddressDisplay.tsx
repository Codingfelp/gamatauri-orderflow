import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MapPin } from "lucide-react";

interface UserAddressDisplayProps {
  className?: string;
}

export const UserAddressDisplay = ({ className = "" }: UserAddressDisplayProps) => {
  const { user } = useAuth();
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAddress = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('address')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setAddress(data?.address || null);
      } catch (error) {
        console.error('Erro ao buscar endereço:', error);
        setAddress(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
  }, [user]);

  if (loading || !address) return null;

  const formatAddress = (addr: string): string => {
    if (addr.toLowerCase().startsWith("r.")) return addr;
    if (addr.toLowerCase().startsWith("rua ")) {
      return "R." + addr.slice(3);
    }
    return "R. " + addr;
  };

  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      <MapPin className="h-4 w-4 text-primary" />
      <span className="font-medium">{formatAddress(address)}</span>
    </div>
  );
};
