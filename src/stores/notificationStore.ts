import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  type NotificationRangeParams,
  type Notification 
} from '@/services/api/notificationService';

type NotificationRangePreset = 'all' | '7d' | '30d' | 'custom';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  loading: boolean;
  error: string | null;

  rangePreset: NotificationRangePreset;
  fromDate: string;
  toDate: string;
  
  // Actions
  fetchNotifications: (page?: number, perPage?: number, unreadOnly?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  removeNotification: (notificationId: string) => Promise<void>;
  deleteReadNotifications: () => Promise<number>;
  setRangePreset: (preset: NotificationRangePreset) => void;
  setFromDate: (from: string) => void;
  setToDate: (to: string) => void;
  clearError: () => void;
}

const STORAGE_KEY = 'notification_date_range_v1';

const buildRangeParams = (preset: NotificationRangePreset, fromDate: string, toDate: string): NotificationRangeParams => {
  if (preset === 'all') return {};
  if (preset === 'custom') {
    return { from: fromDate || undefined, to: toDate || undefined };
  }

  const now = new Date();
  const days = preset === '30d' ? 30 : 7;
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const to = now.toISOString().slice(0, 10);
  return { from, to };
};

const loadInitialRangeState = (): { rangePreset: NotificationRangePreset; fromDate: string; toDate: string } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { rangePreset: '7d', fromDate: '', toDate: '' };
    const parsed = JSON.parse(raw);
    const preset = parsed?.rangePreset;
    if (preset !== 'all' && preset !== '7d' && preset !== '30d' && preset !== 'custom') {
      return { rangePreset: '7d', fromDate: '', toDate: '' };
    }
    return {
      rangePreset: preset,
      fromDate: typeof parsed?.fromDate === 'string' ? parsed.fromDate : '',
      toDate: typeof parsed?.toDate === 'string' ? parsed.toDate : '',
    };
  } catch {
    return { rangePreset: '7d', fromDate: '', toDate: '' };
  }
};

const persistRangeState = (rangePreset: NotificationRangePreset, fromDate: string, toDate: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ rangePreset, fromDate, toDate }));
  } catch {
    // ignore
  }
};

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
      loading: false,
      error: null,
      ...loadInitialRangeState(),

      fetchNotifications: async (page = 1, perPage = 20, unreadOnly = false) => {
        set({ loading: true, error: null });
        try {
          const { rangePreset, fromDate, toDate } = get();
          const rangeParams = buildRangeParams(rangePreset, fromDate, toDate);
          const data = await getNotifications(page, perPage, unreadOnly, rangeParams);
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
          const { rangePreset, fromDate, toDate } = get();
          const rangeParams = buildRangeParams(rangePreset, fromDate, toDate);
          const count = await getUnreadCount(rangeParams);
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

      deleteReadNotifications: async () => {
        try {
          const { rangePreset, fromDate, toDate } = get();
          const rangeParams = buildRangeParams(rangePreset, fromDate, toDate);
          const deletedCount = await deleteReadNotifications(rangeParams);

          set((state) => ({
            notifications: state.notifications.filter((n) => !n.is_read),
          }));

          return deletedCount;
        } catch (error: any) {
          set({ error: error.response?.data?.error || 'Failed to delete read notifications' });
          return 0;
        }
      },

      setRangePreset: (preset) => {
        const current = get();

        if (preset === 'all') {
          set({ rangePreset: preset, fromDate: '', toDate: '' });
          persistRangeState(preset, '', '');
          return;
        }

        if (preset === '7d' || preset === '30d') {
          const now = new Date();
          const days = preset === '30d' ? 30 : 7;
          const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
          const to = now.toISOString().slice(0, 10);
          set({ rangePreset: preset, fromDate: from, toDate: to });
          persistRangeState(preset, from, to);
          return;
        }

        set({ rangePreset: preset });
        persistRangeState(preset, current.fromDate, current.toDate);
      },

      setFromDate: (from) => {
        const current = get();
        set({ fromDate: from });
        persistRangeState(current.rangePreset, from, current.toDate);
      },

      setToDate: (to) => {
        const current = get();
        set({ toDate: to });
        persistRangeState(current.rangePreset, current.fromDate, to);
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'notification-store' }
  )
);
