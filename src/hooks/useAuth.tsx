import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    console.log('🔄 [USE AUTH] Hook inicializado, verificando sessão...');
    
    // 1️⃣ FIRST: Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        console.log('📊 [USE AUTH] Sessão recuperada:', { 
          hasSession: !!session, 
          userId: session?.user?.id,
          email: session?.user?.email 
        });
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false); // ✅ Set loading to false only after initial session check
      }
    });

    // 2️⃣ THEN: Set up listener for FUTURE auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔔 [USE AUTH] Auth state change:', { 
          event, 
          hasSession: !!session, 
          userId: session?.user?.id,
          email: session?.user?.email 
        });
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          // Don't set loading here - it's only for initial load
        }
      }
    );

    return () => {
      console.log('🛑 [USE AUTH] Hook desmontado');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, loading, signOut };
};
