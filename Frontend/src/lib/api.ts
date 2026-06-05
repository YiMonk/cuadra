import { AuthTokens } from './auth-tokens';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

type FetchOptions = RequestInit & { skipAuth?: boolean };

let _refreshPromise: Promise<void> | null = null;

async function _refresh(): Promise<void> {
  const token = AuthTokens.getRefresh();
  if (!token) throw new Error('no refresh token');
  const res = await fetch(`${BASE}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: token }),
  });
  if (!res.ok) {
    AuthTokens.clear();
    throw new Error('session expired');
  }
  const data = await res.json();
  AuthTokens.set(data.access_token);
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth, ...fetchOpts } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOpts.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = AuthTokens.getAccess();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${BASE}${path}`, { ...fetchOpts, headers });

  // Auto-refresh on 401
  if (res.status === 401 && !skipAuth) {
    if (!_refreshPromise) {
      _refreshPromise = _refresh().finally(() => { _refreshPromise = null; });
    }
    try {
      await _refreshPromise;
    } catch {
      throw new ApiError(401, 'session expired');
    }
    const newToken = AuthTokens.getAccess();
    if (newToken) headers['Authorization'] = `Bearer ${newToken}`;
    res = await fetch(`${BASE}${path}`, { ...fetchOpts, headers });
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? JSON.stringify(body);
    } catch { /* ignore */ }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Convenience wrappers
export const api = {
  get: <T>(path: string, opts?: FetchOptions) =>
    apiFetch<T>(path, { method: 'GET', ...opts }),
  post: <T>(path: string, body?: unknown, opts?: FetchOptions) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body), ...opts }),
  patch: <T>(path: string, body?: unknown, opts?: FetchOptions) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...opts }),
  put: <T>(path: string, body?: unknown, opts?: FetchOptions) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body), ...opts }),
  delete: <T>(path: string, opts?: FetchOptions) =>
    apiFetch<T>(path, { method: 'DELETE', ...opts }),
};
