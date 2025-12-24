import { describe, expect, it } from 'vitest';
import { decodeJwtPayload, getTokenExpiryMs } from './jwt';

const base64Url = (obj: unknown) => {
  const json = JSON.stringify(obj);
  const b64 = Buffer.from(json, 'utf8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

describe('jwt utils', () => {
  it('decodes payload and reads expiry', () => {
    const token = `aaa.${base64Url({ exp: 1700000000, role: 'admin' })}.bbb`;
    expect(decodeJwtPayload(token)?.role).toBe('admin');
    expect(getTokenExpiryMs(token)).toBe(1700000000 * 1000);
  });

  it('returns null for invalid token', () => {
    expect(decodeJwtPayload('nope')).toBeNull();
    expect(getTokenExpiryMs('nope')).toBeNull();
  });
});
