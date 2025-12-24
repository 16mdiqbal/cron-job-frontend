import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LoginForm } from '@/components/auth/LoginForm';
import {
  getAndClearPostLoginRedirect,
  isSafeInternalRedirect,
} from '@/services/utils/authRedirect';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  const getStateFromPath = (state: unknown): string | null => {
    if (!state || typeof state !== 'object') return null;
    if (!('from' in state)) return null;
    const from = (state as { from?: unknown }).from;
    if (!from || typeof from !== 'object') return null;

    const pathname = 'pathname' in from ? (from as { pathname?: unknown }).pathname : undefined;
    const search = 'search' in from ? (from as { search?: unknown }).search : undefined;
    const hash = 'hash' in from ? (from as { hash?: unknown }).hash : undefined;

    if (typeof pathname !== 'string') return null;
    return `${pathname}${typeof search === 'string' ? search : ''}${typeof hash === 'string' ? hash : ''}`;
  };

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (isAuthenticated) {
      const statePath = getStateFromPath(location.state);
      const stored = getAndClearPostLoginRedirect();
      const next = statePath || stored;
      const safeNext = next && isSafeInternalRedirect(next) ? next : '/dashboard';
      navigate(safeNext, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-gray-850 dark:to-gray-800 px-4 py-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center">
          <div className="inline-block p-4 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-lg mb-4">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Cron Job Manager
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage and monitor your scheduled jobs
          </p>
        </div>
        <div className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
