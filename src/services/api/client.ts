/**
 * External API Client
 * Manages sessions and HTTP calls to the Gamatauri REST API
 */

const API_BASE = 'https://uppkjvovtvlgwfciqrbt.supabase.co/functions/v1';

const SESSION_KEY = 'gamatauri_session';

export interface ExternalSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface ExternalUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface StoredAuth {
  session: ExternalSession;
  user: ExternalUser;
}

// ── Session management ──────────────────────────────────────────

export function getStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: StoredAuth = JSON.parse(raw);
    // Check expiration (with 60s buffer)
    if (parsed.session.expires_at * 1000 < Date.now() - 60_000) {
      console.warn('[API] Session expired, clearing');
      clearStoredAuth();
      return null;
    }
    return parsed;
  } catch {
    clearStoredAuth();
    return null;
  }
}

export function setStoredAuth(session: ExternalSession, user: ExternalUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ session, user }));
  // Dispatch event for cross-component sync
  window.dispatchEvent(new Event('auth-change'));
}

export function clearStoredAuth() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event('auth-change'));
}

// ── HTTP helpers ────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  params?: Record<string, string>;
  auth?: boolean; // default true
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, params, auth = true, headers: extraHeaders } = options;

  const url = new URL(`${API_BASE}/${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  if (auth) {
    const stored = getStoredAuth();
    if (stored) {
      headers['Authorization'] = `Bearer ${stored.session.access_token}`;
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    // Handle 401 - session expired
    if (res.status === 401) {
      clearStoredAuth();
    }
    throw new ApiError(
      data?.error || data?.message || `HTTP ${res.status}`,
      res.status,
      data,
    );
  }

  return data as T;
}

export { API_BASE };
