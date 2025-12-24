import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Bell, Mail, CheckCircle, XCircle, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/services/api/preferencesService';
import { getErrorMessage } from '@/services/utils/error';

export const NotificationSettings = () => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState({
    emailOnJobSuccess: true,
    emailOnJobFailure: true,
    emailOnJobDisabled: false,
    browserNotifications: false,
    dailyDigest: false,
    weeklyReport: false,
  });

  const loadPreferences = useCallback(async () => {
    if (!user) return;

    try {
      setIsFetching(true);
      const data = await getNotificationPreferences(user.id);
      setPreferences({
        emailOnJobSuccess: data.email_on_job_success,
        emailOnJobFailure: data.email_on_job_failure,
        emailOnJobDisabled: data.email_on_job_disabled,
        browserNotifications: data.browser_notifications,
        dailyDigest: data.daily_digest,
        weeklyReport: data.weekly_report,
      });
    } catch (err: unknown) {
      console.error('Failed to load preferences:', err);
      setError(getErrorMessage(err, 'Failed to load notification preferences'));
    } finally {
      setIsFetching(false);
    }
  }, [user]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    setSuccess(null);
    setError(null);

    try {
      await updateNotificationPreferences(user.id, {
        email_on_job_success: preferences.emailOnJobSuccess,
        email_on_job_failure: preferences.emailOnJobFailure,
        email_on_job_disabled: preferences.emailOnJobDisabled,
        browser_notifications: preferences.browserNotifications,
        daily_digest: preferences.dailyDigest,
        weekly_report: preferences.weeklyReport,
      });

      setSuccess('Notification preferences saved successfully');
    } catch (err: unknown) {
      console.error('Failed to save preferences:', err);
      setError(getErrorMessage(err, 'Failed to save notification preferences'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(success || error) && (
        <div className="fixed top-4 right-4 z-50 w-[min(520px,calc(100vw-2rem))] space-y-2">
          {success && (
            <div className="p-3 rounded-md bg-green-50 border border-green-200 flex items-start justify-between gap-3 shadow-sm">
              <p className="text-sm text-green-700">{success}</p>
              <button
                onClick={() => setSuccess(null)}
                className="text-green-700 hover:text-green-800 shrink-0"
                aria-label="Dismiss success message"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 flex items-start justify-between gap-3 shadow-sm">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-700 hover:text-red-800 shrink-0"
                aria-label="Dismiss error message"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Email Notifications</CardTitle>
          </div>
          <CardDescription>Configure when you want to receive email notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Job Success */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <Label className="font-medium">Job Success</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when a job completes successfully
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.emailOnJobSuccess}
              onChange={() => handleToggle('emailOnJobSuccess')}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </div>

          {/* Job Failure */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <Label className="font-medium">Job Failure</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when a job fails to execute
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.emailOnJobFailure}
              onChange={() => handleToggle('emailOnJobFailure')}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </div>

          {/* Job Disabled */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-amber-500" />
              <div>
                <Label className="font-medium">Job Disabled</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when a job is disabled by an admin
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.emailOnJobDisabled}
              onChange={() => handleToggle('emailOnJobDisabled')}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Browser Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Browser Notifications</CardTitle>
          </div>
          <CardDescription>Get real-time notifications in your browser</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="font-medium">Enable Browser Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications even when this tab is not active
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.browserNotifications}
              onChange={() => handleToggle('browserNotifications')}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Scheduled Reports</CardTitle>
          </div>
          <CardDescription>Receive summary reports via email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Daily Digest */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="font-medium">Daily Digest</Label>
              <p className="text-sm text-muted-foreground">
                Daily summary of all job executions (8 AM)
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.dailyDigest}
              onChange={() => handleToggle('dailyDigest')}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </div>

          {/* Weekly Report */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="font-medium">Weekly Report</Label>
              <p className="text-sm text-muted-foreground">
                Weekly summary with statistics and insights (Monday 8 AM)
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.weeklyReport}
              onChange={() => handleToggle('weeklyReport')}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          loading={isLoading}
          loadingText="Saving…"
          loadingMinMs={400}
          disabled={isLoading}
        >
          Save Preferences
        </Button>
      </div>
    </div>
  );
};
