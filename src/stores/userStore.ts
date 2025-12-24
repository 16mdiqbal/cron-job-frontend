import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User } from '@/types/models';
import { getErrorMessage } from '@/services/utils/error';
import {
  userService,
  type CreateUserRequest,
  type UpdateUserRequest,
} from '@/services/api/userService';

interface UserState {
  users: User[];
  selectedUser: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUsers: () => Promise<void>;
  fetchUser: (userId: string) => Promise<void>;
  createUser: (data: CreateUserRequest) => Promise<User>;
  updateUser: (userId: string, data: UpdateUserRequest) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
  setSelectedUser: (user: User | null) => void;
  clearError: () => void;
}

/**
 * User Management Store
 * Manages user state and admin operations
 */
export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => ({
      users: [],
      selectedUser: null,
      isLoading: false,
      error: null,

      /**
       * Fetch all users
       */
      fetchUsers: async () => {
        set({ isLoading: true, error: null });
        try {
          const users = await userService.getUsers();
          set({ users, isLoading: false });
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(error, 'Failed to fetch users');
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      /**
       * Fetch specific user
       */
      fetchUser: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const user = await userService.getUser(userId);
          set({ selectedUser: user, isLoading: false });
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(error, 'Failed to fetch user');
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      /**
       * Create new user
       */
      createUser: async (data: CreateUserRequest) => {
        set({ isLoading: true, error: null });
        try {
          const newUser = await userService.createUser(data);
          const currentUsers = get().users;
          set({
            users: [...currentUsers, newUser],
            isLoading: false,
          });
          return newUser;
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(error, 'Failed to create user');
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      /**
       * Update user
       */
      updateUser: async (userId: string, data: UpdateUserRequest) => {
        set({ isLoading: true, error: null });
        try {
          const updatedUser = await userService.updateUser(userId, data);
          const currentUsers = get().users;
          set({
            users: currentUsers.map((user) => (user.id === userId ? updatedUser : user)),
            selectedUser: get().selectedUser?.id === userId ? updatedUser : get().selectedUser,
            isLoading: false,
          });
          return updatedUser;
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(error, 'Failed to update user');
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      /**
       * Delete user
       */
      deleteUser: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          await userService.deleteUser(userId);
          const currentUsers = get().users;
          set({
            users: currentUsers.filter((user) => user.id !== userId),
            selectedUser: get().selectedUser?.id === userId ? null : get().selectedUser,
            isLoading: false,
          });
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(error, 'Failed to delete user');
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      /**
       * Set selected user
       */
      setSelectedUser: (user: User | null) => {
        set({ selectedUser: user });
      },

      /**
       * Clear error
       */
      clearError: () => {
        set({ error: null });
      },
    }),
    { name: 'user-store' }
  )
);
