import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Loader2 } from "lucide-react";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { ProfileSetupModal } from "@/components/ProfileSetupModal";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { fetchProfile } from "@/services/api/profile";

export default function Auth() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signInWithGoogle } = useGoogleAuth();
  const { user, loading: authLoading } = useAuth();

  const profileCheckInProgress = useRef(false);
  const profileCheckDone = useRef(false);

  const getRedirect = () => {
    const from = (location.state as any)?.from || "/";
    const cart = (location.state as any)?.cart;
    return { from, state: cart ? { cart } : undefined };
  };

  useEffect(() => {
    if (!authLoading && user && !showProfileModal && !profileCheckInProgress.current && !profileCheckDone.current) {
      profileCheckInProgress.current = true;

      checkProfileComplete().then(isComplete => {
        profileCheckInProgress.current = false;
        if (isComplete) {
          profileCheckDone.current = true;
          const { from, state } = getRedirect();
          navigate(from, { state });
        }
      }).catch(() => {
        profileCheckInProgress.current = false;
      });
    }
  }, [user, authLoading, showProfileModal]);

  useEffect(() => {
    profileCheckDone.current = false;
    profileCheckInProgress.current = false;
  }, [user?.id]);

  const checkProfileComplete = async (): Promise<boolean> => {
    try {
      const profile = await fetchProfile();
      if (!profile.phone || !profile.name) {
        setShowProfileModal(true);
        return false;
      }
      return true;
    } catch {
      setShowProfileModal(true);
      return false;
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao fazer login com Google", description: error.message, duration: 10000 });
    } finally {
      setGoogleLoading(false);
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
            <p className="text-muted-foreground">Entre com sua conta Google para continuar</p>
          </div>

          <Button
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
        </Card>
      </div>
      <ProfileSetupModal
        open={showProfileModal}
        onClose={handleProfileModalClose}
      />
    </div>
  );
}
