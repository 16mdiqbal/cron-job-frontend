import client from './client';

export interface NotificationPreferences {
  id: number;
  user_id: number;
  email_on_job_success: boolean;
  email_on_job_failure: boolean;
  email_on_job_disabled: boolean;
  browser_notifications: boolean;
  daily_digest: boolean;
  weekly_report: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferencesUpdate {
  email_on_job_success?: boolean;
  email_on_job_failure?: boolean;
  email_on_job_disabled?: boolean;
  browser_notifications?: boolean;
  daily_digest?: boolean;
  weekly_report?: boolean;
}

export interface GetPreferencesResponse {
  message: string;
  preferences: NotificationPreferences;
}

export interface UpdatePreferencesResponse {
  message: string;
  preferences: NotificationPreferences;
}

/**
 * Get user's notification preferences
 * @param userId - The user ID
 * @returns The user's notification preferences
 */
export const getNotificationPreferences = async (userId: number): Promise<NotificationPreferences> => {
  const response = await client.get<GetPreferencesResponse>(`/auth/users/${userId}/preferences`);
  return response.data.preferences;
};

/**
 * Update user's notification preferences
 * @param userId - The user ID
 * @param preferences - The preferences to update
 * @returns The updated notification preferences
 */
export const updateNotificationPreferences = async (
  userId: number,
  preferences: NotificationPreferencesUpdate
): Promise<NotificationPreferences> => {
  const response = await client.put<UpdatePreferencesResponse>(
    `/auth/users/${userId}/preferences`,
    preferences
  );
  return response.data.preferences;
};

export default {
  getNotificationPreferences,
  updateNotificationPreferences,
};
