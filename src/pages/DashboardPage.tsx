import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useJobStore } from '@/stores/jobStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, XCircle, Activity } from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const { jobs, loadJobs } = useJobStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadJobs()
      .catch((err) => console.error('Failed to load jobs:', err))
      .finally(() => setIsLoading(false));
  }, [loadJobs]);

  // Calculate statistics from jobs
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((job) => job.is_active).length;

  // Note: Execution statistics would come from job executions data
  // For now, we'll show 0 until execution tracking is implemented
  const stats = [
    {
      title: 'Total Jobs',
      value: totalJobs.toString(),
      icon: Clock,
      iconColor: 'text-blue-500',
      description: `${activeJobs} active, ${totalJobs - activeJobs} inactive`,
    },
    {
      title: 'Successful',
      value: '0',
      icon: CheckCircle,
      iconColor: 'text-green-500',
      description: 'Successful executions',
    },
    {
      title: 'Failed',
      value: '0',
      icon: XCircle,
      iconColor: 'text-red-500',
      description: 'Failed executions',
    },
    {
      title: 'Running',
      value: '0',
      icon: Activity,
      iconColor: 'text-amber-500',
      description: 'Currently running',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name || user?.email}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Welcome to Cron Job Manager. Start by creating your first scheduled job.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This dashboard will display real-time statistics and information about your scheduled
            jobs once you create them. Use the navigation menu to:
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Create and manage cron jobs
            </li>
            <li className="flex items-center">
              <Activity className="mr-2 h-4 w-4" />
              Monitor execution history
            </li>
            <li className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4" />
              Configure notifications
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
