type JwtPayload = {
  exp?: number;
  iat?: number;
  [key: string]: unknown;
};

const base64UrlDecode = (value: string) => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  const str = padded + '='.repeat(padLength);
  return atob(str);
};

export const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const parts = (token || '').split('.');
    if (parts.length < 2) return null;
    const json = base64UrlDecode(parts[1]);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
};

export const getTokenExpiryMs = (token: string): number | null => {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (!exp || typeof exp !== 'number') return null;
  return exp * 1000;
};

