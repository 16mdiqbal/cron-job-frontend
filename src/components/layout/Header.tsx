import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';
import { Menu, Clock, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { applyTheme, getInitialTheme, setStoredTheme, toggleTheme, type ThemeMode } from '@/services/utils/theme';
import { QuickActionsMenu } from '@/components/layout/QuickActionsMenu';
import { getTokenExpiryMs } from '@/services/utils/jwt';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, token, refreshToken, refreshSession } = useAuthStore();
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [dismissedUntilExpiry, setDismissedUntilExpiry] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const expiryMs = useMemo(() => (token ? getTokenExpiryMs(token) : null), [token]);
  const msRemaining = expiryMs ? expiryMs - nowMs : null;

  useEffect(() => {
    setDismissedUntilExpiry(false);
  }, [expiryMs]);

  useEffect(() => {
    // Graceful auto-refresh when close to expiry and refresh token exists.
    if (!refreshToken) return;
    if (!msRemaining || msRemaining <= 0) return;
    if (msRemaining > 60_000) return;
    if (refreshing) return;
    setRefreshing(true);
    refreshSession()
      .catch(() => undefined)
      .finally(() => setRefreshing(false));
  }, [msRemaining, refreshToken, refreshing, refreshSession]);

  const showWarning =
    Boolean(refreshToken) &&
    Boolean(msRemaining) &&
    msRemaining! > 0 &&
    msRemaining! <= 2 * 60_000 &&
    !dismissedUntilExpiry;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSession();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-sm will-change-transform">
      {showWarning && (
        <div className="border-b border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30">
          <div className="flex flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-amber-900 dark:text-amber-100">
              Session expires soon ({Math.max(0, Math.ceil(msRemaining! / 1000))}s).
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? 'Refreshing…' : 'Stay signed in'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDismissedUntilExpiry(true)}
                className="border-amber-300 dark:border-amber-900/60"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex h-16 items-center px-4">
        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 group transition-transform hover:scale-105">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg shadow-md group-hover:shadow-lg transition-shadow">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Cron Job Manager</span>
        </Link>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          <QuickActionsMenu />

          <Tooltip content={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} position="bottom">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const next = toggleTheme(theme);
                setTheme(next);
                setStoredTheme(next);
                applyTheme(next);
              }}
              className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 dark:hover:from-gray-700 dark:hover:to-gray-600 rounded-lg transition-all"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </Tooltip>

          {/* Notifications */}
          <NotificationsDropdown />

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden text-right md:block px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 border border-indigo-100 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user?.name || user?.email}</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 capitalize font-medium">{user?.role}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
