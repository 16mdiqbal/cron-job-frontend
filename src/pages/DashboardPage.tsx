import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, XCircle, Activity, AlertCircle, PauseCircle } from 'lucide-react';
import { jobService } from '@/services/api/jobService';
import { executionService, type ExecutionStatistics } from '@/services/api/executionService';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/page-transition';

const FAILED_EXECUTIONS_LAST_24H_FROM_ISO = new Date(
  Date.now() - 24 * 60 * 60 * 1000
).toISOString();

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const [jobCounts, setJobCounts] = useState({ total: 0, active: 0, inactive: 0 });
  const [executionStats, setExecutionStats] = useState<ExecutionStatistics | null>(null);
  const [failedLast24h, setFailedLast24h] = useState(0);
  const [jobsNoNextRun, setJobsNoNextRun] = useState(0);
  const [jobsEndingSoon, setJobsEndingSoon] = useState(0);
  const [rangePreset, setRangePreset] = useState<'7d' | '30d' | 'custom'>(() => '7d');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const buildStatsParams = useCallback(() => {
    if (rangePreset === 'custom') {
      const params: { from?: string; to?: string } = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      return params;
    }

    const now = new Date();
    const days = rangePreset === '30d' ? 30 : 7;
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    // Send date-only strings; backend interprets `to` as inclusive day for UX.
    return { from: from.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
  }, [fromDate, rangePreset, toDate]);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const now = new Date();
        const last24hFromIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        const statsParams = buildStatsParams();
        const [allJobs, stats] = await Promise.all([
          jobService.getAllJobs(),
          executionService.getStatistics(statsParams),
        ]);

        if (cancelled) return;

        const active = allJobs.filter((j) => j.is_active).length;
        const total = allJobs.length;
        setJobCounts({ total, active, inactive: total - active });
        setExecutionStats(stats);

        setJobsNoNextRun(allJobs.filter((j) => j.is_active && !j.next_execution_at).length);

        const todayJst = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' });
        const todayStartMs = new Date(`${todayJst}T00:00:00+09:00`).getTime();
        const cutoffMs = todayStartMs + 30 * 24 * 60 * 60 * 1000;
        setJobsEndingSoon(
          allJobs.filter((j) => {
            if (!j.is_active) return false;
            if (!j.end_date) return false;
            const endMs = new Date(`${j.end_date}T00:00:00+09:00`).getTime();
            return !Number.isNaN(endMs) && endMs >= todayStartMs && endMs <= cutoffMs;
          }).length
        );

        try {
          const last24hStats = await executionService.getStatistics({
            from: last24hFromIso,
            to: now.toISOString(),
          });
          if (!cancelled) setFailedLast24h(last24hStats.failed_executions ?? 0);
        } catch (e) {
          console.error('Failed to load last-24h stats:', e);
          if (!cancelled) setFailedLast24h(0);
        }
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
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [buildStatsParams]);

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
    <PageTransition>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Welcome back,{' '}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {user?.username || user?.email}
                </span>
                !
              </p>
            </div>

            <div className="w-full sm:w-auto">
              <div className="rounded-2xl border border-indigo-100 dark:border-gray-700 bg-white/70 dark:bg-gray-900/30 backdrop-blur-sm shadow-sm p-4">
                <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
                  Stats date range
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Select
                    value={rangePreset}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (next === '7d' || next === '30d' || next === 'custom') {
                        setRangePreset(next);
                      }
                    }}
                    className="bg-white dark:bg-gray-800 border-indigo-200 dark:border-gray-700 focus-visible:ring-indigo-500"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="custom">Custom</option>
                  </Select>
                  {rangePreset === 'custom' && (
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        aria-label="From date"
                        className="bg-white dark:bg-gray-800 border-indigo-200 dark:border-gray-700 focus-visible:ring-indigo-500"
                      />
                      <Input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        aria-label="To date"
                        className="bg-white dark:bg-gray-800 border-indigo-200 dark:border-gray-700 focus-visible:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  Applies to Success/Failed/Running counts.
                </div>
              </div>
            </div>
          </div>
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
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stat.title}
                  </CardTitle>
                  <div className="p-2 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-lg">
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Needs attention
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Quick shortcuts to issues that typically require action.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <Link
                to={`/executions?status=failed&from=${encodeURIComponent(
                  FAILED_EXECUTIONS_LAST_24H_FROM_ISO
                )}`}
                className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Failed executions in the last 24 hours"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        Failed (last 24h)
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">See recent failed runs</div>
                  </div>
                  <Badge variant={failedLast24h > 0 ? 'destructive' : 'secondary'}>
                    {failedLast24h}
                  </Badge>
                </div>
                <div className="mt-3 text-sm text-indigo-700 dark:text-indigo-300 group-hover:underline underline-offset-4">
                  View
                </div>
              </Link>

              <Link
                to="/jobs?status=active&needs=no-next-run"
                className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Jobs with no next run scheduled"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-amber-600" />
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        No next run
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Active jobs missing schedule
                    </div>
                  </div>
                  <Badge variant={jobsNoNextRun > 0 ? 'warning' : 'secondary'}>
                    {jobsNoNextRun}
                  </Badge>
                </div>
                <div className="mt-3 text-sm text-indigo-700 dark:text-indigo-300 group-hover:underline underline-offset-4">
                  View
                </div>
              </Link>

              <Link
                to="/jobs?status=active&needs=ending-soon"
                className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Jobs ending soon"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-amber-600" />
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        Ending soon
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      End date within 30 days (JST)
                    </div>
                  </div>
                  <Badge variant={jobsEndingSoon > 0 ? 'warning' : 'secondary'}>
                    {jobsEndingSoon}
                  </Badge>
                </div>
                <div className="mt-3 text-sm text-indigo-700 dark:text-indigo-300 group-hover:underline underline-offset-4">
                  View
                </div>
              </Link>

              <Link
                to="/jobs?status=inactive"
                className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Disabled jobs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <PauseCircle className="h-5 w-5 text-slate-600" />
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        Disabled jobs
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Jobs currently paused</div>
                  </div>
                  <Badge variant="secondary">{jobCounts.inactive}</Badge>
                </div>
                <div className="mt-3 text-sm text-indigo-700 dark:text-indigo-300 group-hover:underline underline-offset-4">
                  View
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Welcome Card */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-full blur-3xl -z-10"></div>
          <CardHeader className="relative">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Getting Started
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 text-base">
              Welcome to Cron Job Manager. Start by{' '}
              <Link
                to="/jobs/new"
                className="font-medium text-indigo-700 dark:text-indigo-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
              >
                creating your first scheduled job
              </Link>
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              This dashboard displays live statistics about your scheduled jobs. Use the navigation
              menu to:
            </p>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/jobs"
                  className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-label="Go to Jobs to create and manage cron jobs"
                >
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mr-3">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Create and manage cron jobs
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/executions"
                  className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-label="Go to Executions to monitor execution history"
                >
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg mr-3">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Monitor execution history
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/notifications"
                  className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-label="Notification inbox"
                >
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg mr-3">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notification inbox
                  </span>
                </Link>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default DashboardPage;
