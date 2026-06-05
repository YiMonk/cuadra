const ACCESS_KEY = 'cuadra_access_token';
const REFRESH_KEY = 'cuadra_refresh_token';

function isBrowser() {
  return typeof window !== 'undefined';
}

export const AuthTokens = {
  getAccess(): string | null {
    if (!isBrowser()) return null;
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefresh(): string | null {
    if (!isBrowser()) return null;
    return localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh?: string) {
    if (!isBrowser()) return;
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    // Cookie for Next.js middleware (no-js route protection)
    document.cookie = 'cuadra-session=1; path=/; SameSite=Strict';
  },
  clear() {
    if (!isBrowser()) return;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    document.cookie = 'cuadra-session=; path=/; max-age=0';
  },
};
