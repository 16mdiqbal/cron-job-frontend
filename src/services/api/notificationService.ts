import client from './client';

export interface NotificationRangeParams {
  from?: string;
  to?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  related_job_id?: string | null;
  related_execution_id?: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  range?: { from: string | null; to: string | null };
}

export interface UnreadCountResponse {
  unread_count: number;
  range?: { from: string | null; to: string | null };
}

/**
 * Get notifications for the current user
 * @param page - Page number
 * @param perPage - Items per page
 * @param unreadOnly - Filter to show only unread notifications
 */
export const getNotifications = async (
  page: number = 1,
  perPage: number = 20,
  unreadOnly: boolean = false,
  range?: NotificationRangeParams
): Promise<GetNotificationsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    unread_only: unreadOnly.toString(),
  });

  if (range?.from) params.set('from', range.from);
  if (range?.to) params.set('to', range.to);

  const response = await client.get<GetNotificationsResponse>(
    `/notifications?${params.toString()}`
  );
  return response.data;
};

/**
 * Get count of unread notifications
 */
export const getUnreadCount = async (range?: NotificationRangeParams): Promise<number> => {
  const params = new URLSearchParams();
  if (range?.from) params.set('from', range.from);
  if (range?.to) params.set('to', range.to);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const response = await client.get<UnreadCountResponse>(`/notifications/unread-count${suffix}`);
  return response.data.unread_count;
};

/**
 * Mark a notification as read
 * @param notificationId - The notification ID
 */
export const markAsRead = async (notificationId: string): Promise<Notification> => {
  const response = await client.put<{ notification: Notification }>(
    `/notifications/${notificationId}/read`
  );
  return response.data.notification;
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<void> => {
  await client.put('/notifications/read-all');
};

/**
 * Delete a notification
 * @param notificationId - The notification ID
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  await client.delete(`/notifications/${notificationId}`);
};

/**
 * Delete all read notifications for the current user (optionally within date range).
 */
export const deleteReadNotifications = async (range?: NotificationRangeParams): Promise<number> => {
  const params = new URLSearchParams();
  if (range?.from) params.set('from', range.from);
  if (range?.to) params.set('to', range.to);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const response = await client.delete<{ deleted_count: number }>(`/notifications/delete-read${suffix}`);
  return response.data.deleted_count;
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
};
