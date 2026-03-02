import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { ProfileSetupModal } from "@/components/ProfileSetupModal";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userId, setUserId] = useState("");
  const [activeTab, setActiveTab] = useState<string>("signin");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signInWithGoogle } = useGoogleAuth();
  const { user, loading: authLoading } = useAuth();

  // Ref to prevent multiple concurrent profile checks from multiple auth events
  const profileCheckInProgress = useRef(false);
  const profileCheckDone = useRef(false);

  const getRedirect = () => {
    const from = (location.state as any)?.from || "/";
    const cart = (location.state as any)?.cart;
    return { from, state: cart ? { cart } : undefined };
  };

  // Monitor authentication state changes (for OAuth redirect)
  useEffect(() => {
    console.log('🔄 [AUTH PAGE] useEffect triggered:', { 
      authLoading, 
      hasUser: !!user, 
      userId: user?.id,
      showProfileModal,
      checkInProgress: profileCheckInProgress.current,
      checkDone: profileCheckDone.current,
    });
    
    // Guard: don't re-check if already checking, already done, or modal is open
    if (!authLoading && user && !showProfileModal && !profileCheckInProgress.current && !profileCheckDone.current) {
      console.log('🔍 [AUTH PAGE] Usuário autenticado detectado, verificando perfil...');
      
      profileCheckInProgress.current = true;
      
      checkProfileComplete(user).then(isComplete => {
        profileCheckInProgress.current = false;
        console.log('✅ [AUTH PAGE] Resultado verificação perfil:', isComplete);
        if (isComplete) {
          profileCheckDone.current = true;
          const { from, state } = getRedirect();
          console.log('✅ [AUTH PAGE] Perfil completo, redirecionando para:', from);
          navigate(from, { state });
        }
        // If not complete, checkProfileComplete already opened the modal
      }).catch(err => {
        profileCheckInProgress.current = false;
        console.error('❌ [AUTH PAGE] Erro ao verificar perfil:', err);
      });
    }
  }, [user, authLoading, showProfileModal]);

  // Reset refs when user changes (logout/login with different account)
  useEffect(() => {
    profileCheckDone.current = false;
    profileCheckInProgress.current = false;
  }, [user?.id]);

  const checkProfileComplete = async (authUser: any, retryCount = 0): Promise<boolean> => {
    try {
      console.log('🔍 [PROFILE CHECK] Tentativa', retryCount + 1, '- Verificando perfil para:', authUser.id);
      
      // Initial delay to give the trigger time to create profile
      if (retryCount === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('phone, address, name, cpf, user_id, email')
        .eq('user_id', authUser.id)
        .maybeSingle();

      console.log('📊 [PROFILE CHECK] Resultado da query:', { profile, error, retryCount });

      if (error) {
        console.error('❌ [PROFILE CHECK] Erro ao buscar perfil:', error);
        setUserId(authUser.id);
        setShowProfileModal(true);
        return false;
      }

      if (!profile) {
        if (retryCount < 3) {
          console.warn(`⏳ [PROFILE CHECK] Perfil não encontrado, tentando novamente... (${retryCount + 1}/3)`);
          await new Promise(resolve => setTimeout(resolve, 500));
          return checkProfileComplete(authUser, retryCount + 1);
        }
        
        console.warn('⚠️ [PROFILE CHECK] Perfil não criado após 3 tentativas, abrindo modal');
        setUserId(authUser.id);
        setShowProfileModal(true);
        return false;
      }

      console.log('📋 [PROFILE CHECK] Perfil encontrado:', profile);

      // Only phone and name are required
      const missingFields = {
        phone: !profile.phone,
        name: !profile.name
      };

      if (missingFields.phone || missingFields.name) {
        console.log('⚠️ [PROFILE CHECK] Perfil incompleto - faltam campos:', missingFields);
        setUserId(authUser.id);
        setShowProfileModal(true);
        return false;
      }
      
      console.log('✅ [PROFILE CHECK] Perfil completo!');
      return true;
    } catch (error) {
      console.error('❌ [PROFILE CHECK] Exceção inesperada:', error);
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return checkProfileComplete(authUser, retryCount + 1);
      }
      setUserId(authUser.id);
      setShowProfileModal(true);
      return false;
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
      toast({ title: "Aguarde...", description: "Abrindo autorização do Google", duration: 3000 });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao fazer login com Google", description: error.message, duration: 10000 });
      setGoogleLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { name },
        },
      });
      if (error) throw error;

      if (data?.user && !data.session) {
        toast({ title: "Verifique seu email!", description: "Enviamos um link de confirmação para " + email, duration: 10000 });
        setLoading(false);
        return;
      }

      if (data?.session && data?.user) {
        // Auto sign-in after signup
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        toast({ title: "Conta criada!", description: "Bem-vindo!" });
        // useEffect will handle profile check and redirect
      }
    } catch (error: any) {
      let msg = error.message;
      if (error.message.includes('User already registered')) {
        msg = "Este email já está cadastrado. Tente fazer login.";
        setActiveTab("signin");
      }
      toast({ variant: "destructive", title: "Erro ao criar conta", description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({ title: "Campos obrigatórios", description: "Preencha email e senha", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        if (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed')) {
          toast({ variant: "destructive", title: "Credenciais inválidas", description: "Email ou senha incorretos.", duration: 8000 });
          setLoading(false);
          return;
        }
        throw error;
      }
      toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
      // useEffect will handle profile check and redirect
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao fazer login", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileModalClose = () => {
    setShowProfileModal(false);
    profileCheckDone.current = true;
    const { from, state } = getRedirect();
    navigate(from, { state });
  };

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
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-accent/50">
              <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">Entrar</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={(e) => { e.preventDefault(); handleSignIn(); }} className="space-y-6">
                <Button type="button" onClick={handleGoogleSignIn} variant="outline" className="w-full h-12 text-base font-semibold border-2 hover:bg-accent" disabled={googleLoading}>
                  {googleLoading ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Entrando...</>) : (
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
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Ou continue com email</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="signin-email" className="text-base font-semibold">E-mail</Label>
                  <Input id="signin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="h-12 text-base" required />
                </div>
                <div>
                  <Label htmlFor="signin-password" className="text-base font-semibold">Senha</Label>
                  <div className="relative">
                    <Input id="signin-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-12 text-base pr-12" required />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]" disabled={loading}>
                  {loading ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Entrando...</>) : 'Entrar'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }} className="space-y-6">
                <Button type="button" onClick={handleGoogleSignIn} variant="outline" className="w-full h-12 text-base font-semibold border-2 hover:bg-accent" disabled={googleLoading}>
                  {googleLoading ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Criando conta...</>) : (
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
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Ou cadastre-se com email</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="signup-name" className="text-base font-semibold">Nome Completo</Label>
                  <Input id="signup-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="h-12 text-base" required />
                </div>
                <div>
                  <Label htmlFor="signup-email" className="text-base font-semibold">E-mail</Label>
                  <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="h-12 text-base" required />
                </div>
                <div>
                  <Label htmlFor="signup-password" className="text-base font-semibold">Senha</Label>
                  <div className="relative">
                    <Input id="signup-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-12 text-base pr-12" required minLength={6} />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]" disabled={loading}>
                  {loading ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Criando conta...</>) : 'Criar Conta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
      <ProfileSetupModal
        open={showProfileModal}
        onClose={handleProfileModalClose}
        userId={userId}
      />
    </div>
  );
}