import { client } from './client';
import type { User } from '@/types/models';

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'viewer';
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  role?: 'admin' | 'user' | 'viewer';
  is_active?: boolean;
}

export interface UsersResponse {
  count: number;
  users: User[];
}

export interface UserResponse {
  user: User;
}

/**
 * User Management Service
 * Handles all user-related API calls (Admin only)
 */
export const userService = {
  /**
   * Get all users (Admin only)
   */
  async getUsers(): Promise<User[]> {
    const response = await client.get<UsersResponse>('/auth/users');
    return response.data.users;
  },

  /**
   * Get specific user by ID
   */
  async getUser(userId: string): Promise<User> {
    const response = await client.get<UserResponse>(`/auth/users/${userId}`);
    return response.data.user;
  },

  /**
   * Create new user (Admin only)
   */
  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await client.post<{ message: string; user: User }>('/auth/register', data);
    return response.data.user;
  },

  /**
   * Update user (Admin can update any user, users can update themselves)
   */
  async updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
    const response = await client.put<{ message: string; user: User; updated_fields: string[] }>(
      `/auth/users/${userId}`,
      data
    );
    return response.data.user;
  },

  /**
   * Delete user (Admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    await client.delete(`/auth/users/${userId}`);
  },
};
