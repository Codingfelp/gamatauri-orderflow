import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase';
import { supabase } from '@/integrations/supabase/client';

export const useFirebaseAuth = () => {
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Sign in to Supabase with the email
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: user.uid,
      });

      // If user doesn't exist, create account
      if (error && error.message.includes('Invalid')) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: user.email!,
          password: user.uid,
          options: {
            data: {
              display_name: user.displayName,
              avatar_url: user.photoURL,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        
        if (signUpError) throw signUpError;
      } else if (error) {
        throw error;
      }

      return { user, error: null };
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      return { user: null, error };
    }
  };

  return { signInWithGoogle };
};
