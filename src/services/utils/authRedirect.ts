export const POST_LOGIN_REDIRECT_KEY = 'postLoginRedirect';

export const setPostLoginRedirect = (path: string) => {
  if (typeof window === 'undefined') return;
  const safe = (path || '').trim();
  if (!safe) return;
  try {
    sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, safe);
  } catch {
    // ignore storage errors
  }
};

export const getAndClearPostLoginRedirect = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const value = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
    if (value) sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
    return value;
  } catch {
    return null;
  }
};

export const isSafeInternalRedirect = (path: string) => {
  const p = (path || '').trim();
  if (!p.startsWith('/')) return false;
  if (p.startsWith('//')) return false;
  if (p.startsWith('/login')) return false;
  return true;
};
