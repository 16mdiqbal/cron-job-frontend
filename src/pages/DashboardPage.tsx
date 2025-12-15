import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, XCircle, Activity } from 'lucide-react';
import { jobService } from '@/services/api/jobService';
import { executionService, type ExecutionStatistics } from '@/services/api/executionService';

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const [jobCounts, setJobCounts] = useState({ total: 0, active: 0, inactive: 0 });
  const [executionStats, setExecutionStats] = useState<ExecutionStatistics | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const [allJobs, stats] = await Promise.all([
          jobService.getAllJobs(),
          executionService.getStatistics(),
        ]);

        if (cancelled) return;

        const active = allJobs.filter((j) => j.is_active).length;
        const total = allJobs.length;
        setJobCounts({ total, active, inactive: total - active });
        setExecutionStats(stats);
      } catch (err) {
        console.error('Failed to refresh dashboard stats:', err);
      }
    };

    const onFocus = () => void refresh();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    refresh();
    const interval = window.setInterval(refresh, 15000);

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        title: 'Total Jobs',
        value: String(jobCounts.total),
        icon: Clock,
        iconColor: 'text-blue-500',
        description: `${jobCounts.active} active, ${jobCounts.inactive} inactive`,
      },
      {
        title: 'Successful',
        value: String(executionStats?.successful_executions ?? 0),
        icon: CheckCircle,
        iconColor: 'text-green-500',
        description: `Success rate: ${executionStats ? Math.round(executionStats.success_rate) : 0}%`,
      },
      {
        title: 'Failed',
        value: String(executionStats?.failed_executions ?? 0),
        icon: XCircle,
        iconColor: 'text-red-500',
        description: 'Failed executions',
      },
      {
        title: 'Running',
        value: String(executionStats?.running_executions ?? 0),
        icon: Activity,
        iconColor: 'text-amber-500',
        description: 'Currently running',
      },
    ],
    [jobCounts, executionStats]
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Welcome back,{' '}
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{user?.username || user?.email}</span>!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.title}</CardTitle>
                <div className="p-2 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-lg">
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Welcome Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-full blur-3xl -z-10"></div>
        <CardHeader className="relative">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Getting Started</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 text-base">
            Welcome to Cron Job Manager. Start by creating your first scheduled job.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            This dashboard displays live statistics about your scheduled jobs. Use the navigation menu to:
          </p>
          <ul className="space-y-3">
            <li className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mr-3">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Create and manage cron jobs</span>
            </li>
            <li className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg mr-3">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Monitor execution history</span>
            </li>
            <li className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg mr-3">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Configure notifications</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
