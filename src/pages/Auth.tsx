import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Loader2 } from "lucide-react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { ProfileSetupModal } from "@/components/ProfileSetupModal";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signInWithGoogle } = useFirebaseAuth();
  const { user, loading: authLoading } = useAuth();

  // Monitor authentication state changes (for OAuth redirect)
  useEffect(() => {
    if (!authLoading && user && !showProfileModal) {
      console.log('🔍 Verificando perfil do usuário:', user.id);
      checkProfileComplete(user).then(isComplete => {
        console.log('✅ Perfil completo:', isComplete);
        if (isComplete) {
          const from = (location.state as any)?.from || "/";
          const cart = (location.state as any)?.cart;
          navigate(from, { state: cart ? { cart } : undefined });
        } else {
          console.log('⚠️ Perfil incompleto, abrindo modal de setup');
        }
      });
    }
  }, [user, authLoading]);

  const checkProfileComplete = async (user: any) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('phone, address, name')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        // Se o perfil não existir, abrir modal
        setUserId(user.id);
        setShowProfileModal(true);
        return false;
      }

      if (!profile || !profile.phone) {
        console.log('⚠️ Perfil incompleto:', profile);
        setUserId(user.id);
        setShowProfileModal(true);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erro inesperado ao verificar perfil:', error);
      return false;
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        throw error;
      }

      // OAuth redirects automatically, profile check happens in useEffect after redirect
      toast({
        title: "Aguarde...",
        description: "Abrindo autorização do Google",
        duration: 3000,
      });
    } catch (error: any) {
      // Determine error type and provide detailed instructions
      const errorMessage = error.message || '';
      let title = "Erro ao fazer login com Google";
      let description = errorMessage;
      
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        title = "⚠️ Configuração OAuth Necessária";
        description = errorMessage;
      } else if (errorMessage.includes('redirect_uri_mismatch')) {
        title = "⚠️ URI de Redirecionamento Inválida";
        description = errorMessage;
      } else if (errorMessage.includes('invalid_client')) {
        title = "⚠️ Credenciais OAuth Inválidas";
        description = errorMessage;
      }
      
      toast({
        variant: "destructive",
        title,
        description,
        duration: 10000,
      });
      setGoogleLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: name,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Conta criada!",
        description: "Você já pode fazer login.",
      });
      
      const { error: signInError, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      
      if (data?.user) {
        const isComplete = await checkProfileComplete(data.user);
        if (isComplete) {
          const from = (location.state as any)?.from || "/";
          const cart = (location.state as any)?.cart;
          navigate(from, { state: cart ? { cart } : undefined });
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        const isComplete = await checkProfileComplete(data.user);
        if (isComplete) {
          toast({
            title: "Bem-vindo!",
            description: "Login realizado com sucesso.",
          });
          const from = (location.state as any)?.from || "/";
          const cart = (location.state as any)?.cart;
          navigate(from, { state: cart ? { cart } : undefined });
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
        <Header />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <Header />
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <Card className="w-full max-w-md p-10 shadow-2xl border-2 border-primary/20">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-primary mb-2">Bem-vindo!</h1>
            <p className="text-muted-foreground">Entre ou crie sua conta para continuar</p>
          </div>
          
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-accent/50">
              <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">Entrar</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={(e) => { e.preventDefault(); handleSignIn(); }} className="space-y-6">
                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  variant="outline"
                  className="w-full h-12 text-base font-semibold border-2 hover:bg-accent"
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continuar com Google
                    </>
                  )}
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Ou continue com email</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="signin-email" className="text-base font-semibold">E-mail</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="h-12 text-base"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signin-password" className="text-base font-semibold">Senha</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 text-base"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }} className="space-y-6">
                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  variant="outline"
                  className="w-full h-12 text-base font-semibold border-2 hover:bg-accent"
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continuar com Google
                    </>
                  )}
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Ou cadastre-se com email</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="signup-name" className="text-base font-semibold">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="h-12 text-base"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-email" className="text-base font-semibold">E-mail</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="h-12 text-base"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password" className="text-base font-semibold">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 text-base"
                    required
                    minLength={6}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    'Criar Conta'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
      <ProfileSetupModal
        open={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          const from = (location.state as any)?.from || "/";
          const cart = (location.state as any)?.cart;
          navigate(from, { state: cart ? { cart } : undefined });
        }}
        userId={userId}
      />
    </div>
  );
}
