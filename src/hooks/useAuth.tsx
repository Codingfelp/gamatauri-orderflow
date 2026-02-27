import { useEffect, useState, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST - this handles INITIAL_SESSION event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('🔔 [USE AUTH] Auth state change:', { 
          event, 
          hasSession: !!currentSession, 
          userId: currentSession?.user?.id,
        });
        
        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Mark loading done on initial session event
        if (event === 'INITIAL_SESSION' || !initializedRef.current) {
          initializedRef.current = true;
          setLoading(false);
        }
      }
    );

    // Fallback: if INITIAL_SESSION never fires within 3s, resolve loading
    const fallbackTimer = setTimeout(() => {
      if (mounted && !initializedRef.current) {
        console.warn('⚠️ [USE AUTH] Fallback: forçando fim do loading');
        initializedRef.current = true;
        setLoading(false);
      }
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut({ scope: 'local' });
  };

  return { user, session, loading, signOut };
};
