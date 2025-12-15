import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Bell, Mail, CheckCircle, XCircle } from 'lucide-react';

export const NotificationSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [preferences, setPreferences] = useState({
    emailOnJobSuccess: true,
    emailOnJobFailure: true,
    emailOnJobDisabled: false,
    browserNotifications: true,
    dailyDigest: false,
    weeklyReport: true,
  });

  const handleSave = async () => {
    setIsLoading(true);
    setSuccess(null);
    
    // Simulate API call
    setTimeout(() => {
      setSuccess('Notification preferences saved successfully');
      setIsLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }, 500);
  };

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="p-3 rounded-md bg-green-50 border border-green-200">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Email Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure when you want to receive email notifications
          </CardDescription>
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
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
};
