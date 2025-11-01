import { supabase } from '@/integrations/supabase/client';

export const useFirebaseAuth = () => {
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
      
      // OAuth redirects automatically, no user returned here
      return { user: null, error: null };
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      return { user: null, error };
    }
  };

  return { signInWithGoogle };
};
