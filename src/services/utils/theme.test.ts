import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, getInitialTheme, getStoredTheme, setStoredTheme, toggleTheme } from './theme';

describe('theme utils', () => {
  const originalLocalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage');

  beforeEach(() => {
    const store = new Map<string, string>();
    const memoryStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    };

    try {
      Object.defineProperty(window, 'localStorage', {
        value: memoryStorage,
        configurable: true,
      });
    } catch {
      (window as unknown as { localStorage: unknown }).localStorage = memoryStorage;
    }

    document.documentElement.classList.remove('dark');
    delete document.documentElement.dataset.theme;
    vi.restoreAllMocks();
    // @ts-expect-error - allow tests to control matchMedia presence.
    delete window.matchMedia;
  });

  afterEach(() => {
    if (originalLocalStorage) {
      Object.defineProperty(window, 'localStorage', originalLocalStorage);
    }
  });

  it('defaults to system theme when nothing stored', () => {
    expect(getStoredTheme()).toBeNull();
    expect(getInitialTheme()).toBe('system');
  });

  it('returns stored theme when set', () => {
    setStoredTheme('dark');
    expect(getStoredTheme()).toBe('dark');
    expect(getInitialTheme()).toBe('dark');
  });

  it('applies dark class for explicit dark mode', () => {
    applyTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('follows system preference and updates on change', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    let changeListener: ((event: MediaQueryListEvent) => void) | null = null;

    addEventListener.mockImplementation((_type: string, listener: (event: MediaQueryListEvent) => void) => {
      changeListener = listener;
    });
    removeEventListener.mockImplementation((_type: string, listener: (event: MediaQueryListEvent) => void) => {
      if (changeListener === listener) changeListener = null;
    });

    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener,
      removeEventListener,
    } as unknown as MediaQueryList);

    applyTheme('system');
    expect(document.documentElement.dataset.theme).toBe('system');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    changeListener?.({ matches: false } as MediaQueryListEvent);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    applyTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('toggleTheme maps system -> dark to keep legacy toggle behavior', () => {
    expect(toggleTheme('system')).toBe('dark');
  });
});
