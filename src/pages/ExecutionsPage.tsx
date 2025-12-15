import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ExecutionsPage = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Executions</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">View job execution history</p>
      </div>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Execution History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-amber-100 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Execution tracking will be implemented in Phase 3
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExecutionsPage;
