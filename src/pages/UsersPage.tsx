import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const UsersPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">Manage users and permissions (Admin only)</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            User management will be implemented in Phase 6
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersPage;
