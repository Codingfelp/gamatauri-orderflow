import { Home, Search, Package, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const navItems = [
    { path: "/", label: "Início", icon: Home },
    { path: "/busca", label: "Busca", icon: Search },
    { path: "/orders", label: "Pedidos", icon: Package },
    { path: "/profile", label: "Perfil", icon: User },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    navigate(item.path);
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t shadow-lg"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item)}
              className={`
                flex flex-col items-center justify-center gap-1 w-full h-full
                transition-all duration-200 active:scale-95
                ${active ? "text-primary" : "text-muted-foreground"}
              `}
            >
              <Icon 
                className={`
                  w-5 h-5 transition-all duration-200
                  ${active ? "scale-110" : "hover:scale-105"}
                `} 
              />
              <span 
                className={`
                  text-[10px] font-medium transition-all duration-200
                  ${active ? "font-bold" : ""}
                `}
              >
                {item.label}
              </span>
              {active && (
                <div className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-t-full animate-fade-in" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
