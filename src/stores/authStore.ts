import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { authService, type LoginRequest } from '@/services/api/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
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
      isAuthenticated: false,
      isLoading: false,
      error: null,

      /**
       * Login user
       */
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await authService.login(credentials);

          // Save to localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: unknown) {
          const errorMessage =
            (error as any)?.response?.data?.message || (error as Error)?.message || 'Login failed';
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
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          // Clear localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
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

      /**
       * Clear authentication state
       */
      clearAuth: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      /**
       * Initialize auth from localStorage
       */
      initializeAuth: async () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({
              user,
              token,
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
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
