import { signInWithGoogle as apiSignInWithGoogle } from '@/services/api/auth';
import { supabase } from '@/integrations/supabase/client';

let cachedClientId: string | null = null;

async function getClientId(): Promise<string> {
  if (cachedClientId) return cachedClientId;
  const { data, error } = await supabase.functions.invoke('get-app-config');
  if (error || !data?.google_client_id) {
    throw new Error('Não foi possível obter configuração do Google');
  }
  cachedClientId = data.google_client_id;
  return cachedClientId;
}

function loadGIS(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.id) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar Google Identity Services'));
    document.head.appendChild(script);
  });
}

export const useGoogleAuth = () => {
  const signInWithGoogle = async (): Promise<{ user: any; error: any }> => {
    try {
      const [clientId] = await Promise.all([getClientId(), loadGIS()]);

      return new Promise((resolve) => {
        const g = (window as any).google.accounts.id;

        g.initialize({
          client_id: clientId,
          callback: async (response: { credential: string }) => {
            try {
              const result = await apiSignInWithGoogle(response.credential);
              resolve({ user: result.user, error: null });
            } catch (err) {
              resolve({ user: null, error: err });
            }
          },
        });

        g.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback: render Google Sign-In button in a popup overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5)';
            const container = document.createElement('div');
            container.style.cssText = 'background:white;padding:32px;border-radius:16px;min-width:320px;text-align:center';
            container.innerHTML = '<p style="margin-bottom:16px;font-weight:600;color:#333">Selecione sua conta Google</p>';
            const btnDiv = document.createElement('div');
            container.appendChild(btnDiv);
            overlay.appendChild(container);
            document.body.appendChild(overlay);

            g.renderButton(btnDiv, {
              type: 'standard',
              size: 'large',
              theme: 'outline',
              text: 'continue_with',
              width: 280,
            });

            overlay.addEventListener('click', (e: MouseEvent) => {
              if (e.target === overlay) {
                overlay.remove();
                resolve({ user: null, error: new Error('Login cancelado') });
              }
            });
          }
        });
      });
    } catch (error) {
      return { user: null, error };
    }
  };

  return { signInWithGoogle };
};
