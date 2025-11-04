import { supabase } from '@/integrations/supabase/client';

export const useFirebaseAuth = () => {
  const signInWithGoogle = async () => {
    try {
      console.log('🚀 [GOOGLE AUTH] Iniciando fluxo de autenticação OAuth');
      console.log('📍 [GOOGLE AUTH] Redirect URL configurada:', `${window.location.origin}/`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'openid email profile',
        },
      });

      console.log('📊 [GOOGLE AUTH] Resposta OAuth:', { data, error });

      if (error) {
        console.error('❌ [GOOGLE AUTH] Erro na chamada OAuth:', error);
        // Enhanced error handling for OAuth
        if (error.message.includes('403') || error.message.includes('Forbidden')) {
          throw new Error('Erro 403: Configuração OAuth incorreta.\n\n' +
            '✓ Verifique no Google Cloud Console:\n' +
            '  - Authorized JavaScript origins: https://lsxukelagellagzvjyuy.supabase.co\n' +
            '  - Authorized redirect URIs: https://lsxukelagellagzvjyuy.supabase.co/auth/v1/callback\n\n' +
            '✓ Verifique no Lovable Cloud (Auth Settings → Google):\n' +
            '  - Client ID e Client Secret estão corretos\n' +
            '  - Provider Google está habilitado');
        }
        
        if (error.message.includes('redirect_uri_mismatch')) {
          throw new Error('Erro: URI de redirecionamento não autorizada.\n\n' +
            'Adicione esta URL nas "Authorized redirect URIs" no Google Console:\n' +
            'https://lsxukelagellagzvjyuy.supabase.co/auth/v1/callback');
        }
        
        if (error.message.includes('invalid_client')) {
          throw new Error('Erro: Credenciais OAuth inválidas.\n\n' +
            'Verifique se o Client ID e Client Secret estão corretos no Lovable Cloud.');
        }
        
        throw error;
      }
      
      console.log('✅ [GOOGLE AUTH] OAuth iniciado com sucesso, aguardando redirecionamento...');
      // OAuth redirects automatically, no user returned here
      return { user: null, error: null };
    } catch (error: any) {
      console.error('❌ [GOOGLE AUTH] Exceção capturada:', error);
      console.error('❌ [GOOGLE AUTH] Stack trace:', error.stack);
      return { user: null, error };
    }
  };

  return { signInWithGoogle };
};
