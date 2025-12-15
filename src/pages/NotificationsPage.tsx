import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const NotificationsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">Configure email notification settings</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Notification configuration will be implemented in Phase 5
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;
