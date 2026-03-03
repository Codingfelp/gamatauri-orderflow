import { useEffect, useState, useCallback } from "react";
import { getStoredAuth, clearStoredAuth, type ExternalUser } from "@/services/api/client";

export type AppUser = ExternalUser;

export const useAuth = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const syncAuth = useCallback(() => {
    const stored = getStoredAuth();
    setUser(stored?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    syncAuth();

    const handleChange = () => {
      const stored = getStoredAuth();
      setUser(stored?.user ?? null);
    };

    window.addEventListener('auth-change', handleChange);
    return () => window.removeEventListener('auth-change', handleChange);
  }, [syncAuth]);

  const signOut = () => {
    clearStoredAuth();
    setUser(null);
  };

  return { user, loading, signOut };
};
