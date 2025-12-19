import axios from 'axios';
import { setPostLoginRedirect } from '@/services/utils/authRedirect';
import { authService } from '@/services/api/authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance
export const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to headers
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      // Respect explicitly provided Authorization header (e.g., refresh token requests).
      if (!('Authorization' in config.headers) && !('authorization' in config.headers)) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
client.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: any) => {
    if (error.response) {
      const status = error.response.status;
      const isLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/login');
      const originalRequest = error.config;

      switch (status) {
        case 401:
        case 422: // JWT validation errors also return 422
          // Try a one-time token refresh (if refresh token exists) and retry request.
          if (
            !isLoginPage &&
            originalRequest &&
            !originalRequest.__isRetryRequest &&
            !String(originalRequest.url || '').includes('/auth/login') &&
            !String(originalRequest.url || '').includes('/auth/refresh') &&
            localStorage.getItem('refresh_token')
          ) {
            originalRequest.__isRetryRequest = true;
            try {
              const newToken = await authService.refreshToken();
              localStorage.setItem('token', newToken);
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return client(originalRequest);
            } catch (e) {
              // fallthrough to clearing + redirect
            }
          }

          // Unauthorized - Clear token and redirect to login
          // Only clear and redirect if NOT on login page (avoid loops)
          if (!isLoginPage) {
            try {
              setPostLoginRedirect(
                `${window.location.pathname}${window.location.search}${window.location.hash}`
              );
            } catch {
              // ignore
            }
            // Clear all auth-related storage including Zustand persist cache
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('auth-storage'); // Zustand persist key
            sessionStorage.clear(); // Clear session storage too
            window.location.href = '/login';
          }
          break;
        case 403:
          // Forbidden - User doesn't have permission
          console.error('Access forbidden');
          break;
        case 404:
          // Not found
          console.error('Resource not found');
          break;
        case 500:
          // Server error
          console.error('Server error occurred');
          break;
        default:
          console.error('An error occurred:', error.message);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received from server');
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default client;
