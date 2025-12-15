import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ExecutionsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Executions</h1>
        <p className="text-muted-foreground">View job execution history</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Execution tracking will be implemented in Phase 3
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExecutionsPage;
