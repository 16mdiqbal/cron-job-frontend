import { describe, it, expect } from 'vitest';

describe('Phase 1 Setup', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should have environment variables configured', () => {
    expect(import.meta.env.VITE_API_URL).toBeDefined();
  });
});
