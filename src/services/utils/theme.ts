export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

export function getStoredTheme(): ThemeMode | null {
  if (typeof window === 'undefined') return null;
  if (typeof window.localStorage?.getItem !== 'function') return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return null;
}

export function setStoredTheme(theme: ThemeMode) {
  if (typeof window === 'undefined') return;
  if (typeof window.localStorage?.setItem !== 'function') return;
  window.localStorage.setItem(STORAGE_KEY, theme);
}

type EffectiveTheme = Exclude<ThemeMode, 'system'>;

function getSystemTheme(): EffectiveTheme {
  if (typeof window === 'undefined') return 'light';
  if (typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

let systemThemeMql: MediaQueryList | null = null;
let systemThemeListener: ((event: MediaQueryListEvent) => void) | null = null;

function detachSystemThemeListener() {
  if (!systemThemeMql || !systemThemeListener) return;
  if (typeof systemThemeMql.removeEventListener === 'function') {
    systemThemeMql.removeEventListener('change', systemThemeListener);
  } else {
    systemThemeMql.removeListener(systemThemeListener);
  }
  systemThemeMql = null;
  systemThemeListener = null;
}

function attachSystemThemeListener() {
  if (typeof window === 'undefined') return;
  if (typeof window.matchMedia !== 'function') return;

  if (systemThemeMql && systemThemeListener) return;

  systemThemeMql = window.matchMedia('(prefers-color-scheme: dark)');
  systemThemeListener = (event) => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', event.matches);
  };

  if (typeof systemThemeMql.addEventListener === 'function') {
    systemThemeMql.addEventListener('change', systemThemeListener);
  } else {
    systemThemeMql.addListener(systemThemeListener);
  }
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;

  if (theme === 'system') {
    const effective = getSystemTheme();
    document.documentElement.classList.toggle('dark', effective === 'dark');
    attachSystemThemeListener();
    return;
  }

  detachSystemThemeListener();
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function getInitialTheme(): ThemeMode {
  const stored = getStoredTheme();
  return stored ?? 'system';
}

export function toggleTheme(current: ThemeMode): ThemeMode {
  if (current === 'system') return 'dark';
  return current === 'dark' ? 'light' : 'dark';
}
