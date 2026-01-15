import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, CreditCard, MapPin, Mail, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    cpf: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading profile:", error);
        return;
      }

      if (profile) {
        setFormData({
          name: profile.name || "",
          phone: profile.phone || "",
          cpf: profile.cpf ? formatCPF(profile.cpf) : "",
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe seu nome.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.phone.trim()) {
      toast({
        title: "Telefone obrigatório",
        description: "Por favor, informe seu telefone.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      const cpfDigits = formData.cpf.replace(/\D/g, "") || null;
      
      const { error } = await supabase
        .from("profiles")
        .update({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          cpf: cpfDigits,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user?.id);

      if (error) throw error;

      setSaved(true);
      toast({
        title: "Dados salvos",
        description: "Suas informações foram atualizadas com sucesso.",
      });

      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar suas informações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const userInitials = formData.name
    ? formData.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 p-4 max-w-3xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Dados da Conta</h1>
        </div>
      </header>

      <main className="p-4 pb-8 max-w-3xl mx-auto space-y-6">
        {/* Profile Card */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={avatarUrl} alt={formData.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-lg truncate">
                {formData.name || "Complete seu perfil"}
              </h2>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
              {user?.app_metadata?.provider === "google" && (
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                  <Check className="h-3 w-3" />
                  Google conectado
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="p-5 space-y-5">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Informações Pessoais
            </h3>
            
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-muted-foreground" />
                Nome completo
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome completo"
                className="h-12 text-base"
              />
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Telefone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
                className="h-12 text-base"
                maxLength={15}
              />
            </div>

            <Separator />

            {/* CPF - Optional */}
            <div className="space-y-2">
              <Label htmlFor="cpf" className="flex items-center gap-2 text-sm font-medium">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                CPF
                <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                placeholder="000.000.000-00"
                className="h-12 text-base"
                maxLength={14}
              />
              <p className="text-xs text-muted-foreground">
                Necessário apenas para emissão de nota fiscal
              </p>
            </div>
          </Card>

          {/* Addresses Link */}
          <Card 
            className="p-5 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate("/addresses")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Meus Endereços</h3>
                  <p className="text-sm text-muted-foreground">Gerencie seus endereços de entrega</p>
                </div>
              </div>
              <ArrowLeft className="h-5 w-5 text-muted-foreground rotate-180" />
            </div>
          </Card>

          {/* Save Button */}
          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Salvando...
              </>
            ) : saved ? (
              <>
                <Check className="h-5 w-5 mr-2" />
                Salvo!
              </>
            ) : (
              "Salvar alterações"
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
