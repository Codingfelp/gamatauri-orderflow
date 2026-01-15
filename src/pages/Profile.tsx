import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Tag, MapPin, Settings as SettingsIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Logout realizado com sucesso");
      navigate("/");
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  const menuItems = [
    {
      icon: User,
      title: "Dados da conta",
      description: "Nome, telefone, email e CPF",
      action: () => navigate("/settings"),
    },
    {
      icon: Tag,
      title: "Cupons",
      description: "Veja seus cupons disponíveis",
      action: () => toast.info("Em breve: gerenciamento de cupons"),
    },
    {
      icon: MapPin,
      title: "Endereços",
      description: "Gerencie seus endereços salvos",
      action: () => navigate("/addresses"),
    },
    {
      icon: SettingsIcon,
      title: "Configurações",
      description: "Preferências e notificações",
      action: () => toast.info("Em breve: configurações avançadas"),
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-primary-foreground/10 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold">Meu Perfil</h1>
          </div>

          {user && (
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <User className="h-8 w-8" />
              </div>
              <div>
                <p className="font-semibold text-lg">{user.email?.split('@')[0]}</p>
                <p className="text-sm text-primary-foreground/80">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Card className="divide-y">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.action}
                className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm md:text-base">{item.title}</p>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </Card>

        <Separator className="my-6" />

        <Button
          variant="outline"
          className="w-full md:w-auto"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair da conta
        </Button>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Profile;
