import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { getErrorMessage } from '@/services/utils/error';
import { authService, type LoginRequest } from '@/services/api/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setRefreshToken: (token: string | null) => void;
  clearAuth: () => void;
  initializeAuth: () => Promise<void>;
  setError: (error: string | null) => void;
}

/**
 * Authentication Store
 * Manages authentication state and actions
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      /**
       * Login user
       */
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const { token, refreshToken, user } = await authService.login(credentials);

          // Save to localStorage
          localStorage.setItem('token', token);
          if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
          localStorage.setItem('user', JSON.stringify(user));

          set({
            user,
            token,
            refreshToken: refreshToken || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(
            error,
            'Login failed. Please check your credentials and try again.'
          );
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      /**
       * Logout user
       */
      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear state
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          // Clear all storage
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          localStorage.removeItem('auth-storage'); // Clear Zustand persist cache
          sessionStorage.clear(); // Clear session storage
        }
      },

      refreshSession: async () => {
        try {
          const newToken = await authService.refreshToken();
          localStorage.setItem('token', newToken);
          set({ token: newToken, isAuthenticated: true });
        } catch (e) {
          console.error('Failed to refresh session:', e);
          get().clearAuth();
          throw e;
        }
      },

      /**
       * Set user
       */
      setUser: (user: User) => {
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, isAuthenticated: true });
      },

      /**
       * Set token
       */
      setToken: (token: string) => {
        localStorage.setItem('token', token);
        set({ token, isAuthenticated: true });
      },

      setRefreshToken: (token: string | null) => {
        if (token) localStorage.setItem('refresh_token', token);
        else localStorage.removeItem('refresh_token');
        set({ refreshToken: token });
      },

      /**
       * Clear authentication state
       */
      clearAuth: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('auth-storage'); // Clear Zustand persist cache
        sessionStorage.clear(); // Clear session storage
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      /**
       * Initialize auth from localStorage
       */
      initializeAuth: async () => {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refresh_token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({
              user,
              token,
              refreshToken: refreshToken || null,
              isAuthenticated: true,
            });

            // Optionally verify token is still valid
            // const currentUser = await authService.getCurrentUser();
            // set({ user: currentUser });
          } catch (error) {
            console.error('Failed to initialize auth:', error);
            get().clearAuth();
          }
        }
      },

      /**
       * Set error message
       */
      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
