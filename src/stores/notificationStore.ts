import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead,
  deleteNotification,
  type Notification 
} from '@/services/api/notificationService';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: (page?: number, perPage?: number, unreadOnly?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  removeNotification: (notificationId: string) => Promise<void>;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    (set) => ({
      notifications: [],
      unreadCount: 0,
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
      loading: false,
      error: null,

      fetchNotifications: async (page = 1, perPage = 20, unreadOnly = false) => {
        set({ loading: true, error: null });
        try {
          const data = await getNotifications(page, perPage, unreadOnly);
          set({
            notifications: data.notifications,
            total: data.total,
            page: data.page,
            perPage: data.per_page,
            totalPages: data.total_pages,
            loading: false,
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.error || 'Failed to fetch notifications',
            loading: false 
          });
        }
      },

      fetchUnreadCount: async () => {
        try {
          const count = await getUnreadCount();
          set({ unreadCount: count });
        } catch (error: any) {
          console.error('Failed to fetch unread count:', error);
        }
      },

      markNotificationAsRead: async (notificationId: string) => {
        try {
          await markAsRead(notificationId);
          
          // Update local state
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === notificationId ? { ...n, is_read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1)
          }));
        } catch (error: any) {
          set({ error: error.response?.data?.error || 'Failed to mark notification as read' });
        }
      },

      markAllNotificationsAsRead: async () => {
        try {
          await markAllAsRead();
          
          // Update local state
          set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
            unreadCount: 0
          }));
        } catch (error: any) {
          set({ error: error.response?.data?.error || 'Failed to mark all notifications as read' });
        }
      },

      removeNotification: async (notificationId: string) => {
        try {
          await deleteNotification(notificationId);
          
          // Update local state
          set((state) => {
            const notification = state.notifications.find(n => n.id === notificationId);
            const wasUnread = notification && !notification.is_read;
            
            return {
              notifications: state.notifications.filter((n) => n.id !== notificationId),
              unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
            };
          });
        } catch (error: any) {
          set({ error: error.response?.data?.error || 'Failed to delete notification' });
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'notification-store' }
  )
);
