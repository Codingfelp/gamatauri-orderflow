import { signInWithPopup } from 'firebase/auth';
import { supabase } from '@/integrations/supabase/client';

export const useFirebaseAuth = () => {
  const signInWithGoogle = async () => {
    try {
      // Lazy load Firebase to avoid build issues
      const { auth, googleProvider } = await import('@/config/firebase');
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user.email) {
        throw new Error('Email não disponível');
      }

      // Tentar fazer login no Supabase com o email do Google
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.uid,
      });

      // Se não existir, criar conta
      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: user.email,
          password: user.uid,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: user.displayName || user.email,
              avatar_url: user.photoURL,
            },
          },
        });

        if (signUpError) throw signUpError;

        // Fazer login após criar conta
        const { error: postSignUpError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: user.uid,
        });

        if (postSignUpError) throw postSignUpError;
      }

      return { user, error: null };
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      if (error.code === 'auth/unauthorized-domain') {
        return { 
          user: null, 
          error: {
            ...error,
            message: 'Domínio não autorizado. Configure os domínios no Firebase Console.'
          }
        };
      }
      
      return { user: null, error };
    }
  };

  return { signInWithGoogle };
};
