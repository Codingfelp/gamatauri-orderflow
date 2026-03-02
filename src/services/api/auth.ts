import { apiRequest, setStoredAuth, clearStoredAuth, type ExternalSession, type ExternalUser } from './client';

interface AuthResponse {
  success: boolean;
  session: ExternalSession;
  user: ExternalUser;
}

interface SessionResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    profile?: {
      id: string;
      name: string;
      phone: string;
      cpf: string;
    };
  };
}

/**
 * Authenticate with Google id_token
 */
export async function signInWithGoogle(idToken: string): Promise<{ user: ExternalUser }> {
  const data = await apiRequest<AuthResponse>('app-auth/google', {
    method: 'POST',
    body: { id_token: idToken },
    auth: false,
  });

  if (!data.success || !data.session) {
    throw new Error('Falha na autenticação');
  }

  setStoredAuth(data.session, data.user);
  return { user: data.user };
}

/**
 * Verify current session
 */
export async function getSession(): Promise<SessionResponse['user'] | null> {
  try {
    const data = await apiRequest<SessionResponse>('app-auth/session', {
      method: 'GET',
    });
    return data.success ? data.user : null;
  } catch {
    return null;
  }
}

/**
 * Sign out
 */
export function signOut() {
  clearStoredAuth();
}
