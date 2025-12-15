import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const NotificationsPage = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Notifications</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Configure email notification settings</p>
      </div>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Notification Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-blue-100 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Notification configuration will be implemented in Phase 5
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;
