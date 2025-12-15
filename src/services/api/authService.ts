import { client } from './client';
import type { User, ApiResponse } from '@/types';

// Login request payload - supports both username and email
export interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
}

// Login response
export interface LoginResponse {
  token: string;
  user: User;
}

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
export const authService = {
  /**
   * Login user with email/username and password
   * @param credentials - User email or username and password
   * @returns Token and user information
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await client.post('/auth/login', credentials);
    // Backend returns { access_token, user }, map to { token, user }
    return {
      token: data.access_token,
      user: data.user,
    };
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await client.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, we still clear local storage
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Get current authenticated user
   * @returns Current user information
   */
  async getCurrentUser(): Promise<User> {
    const { data } = await client.get<ApiResponse<User>>('/auth/me');
    return data.data;
  },

  /**
   * Refresh authentication token
   * @returns New token
   */
  async refreshToken(): Promise<string> {
    const { data } = await client.post<ApiResponse<{ token: string }>>('/auth/refresh');
    return data.data.token;
  },
};

export default authService;
