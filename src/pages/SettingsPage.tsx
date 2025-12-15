import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Settings page will be implemented in later phases
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
