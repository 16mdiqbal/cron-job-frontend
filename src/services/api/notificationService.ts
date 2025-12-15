import client from './client';

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
}

export interface UnreadCountResponse {
  unread_count: number;
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
  unreadOnly: boolean = false
): Promise<GetNotificationsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    unread_only: unreadOnly.toString()
  });
  
  const response = await client.get<GetNotificationsResponse>(
    `/notifications?${params.toString()}`
  );
  return response.data;
};

/**
 * Get count of unread notifications
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await client.get<UnreadCountResponse>('/notifications/unread-count');
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

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
