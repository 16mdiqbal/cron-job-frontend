import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useExecutionStore } from '@/stores/executionStore';
import { jobService } from '@/services/api/jobService';
import type { Job, JobExecution } from '@/types';
import { ExecutionList } from '@/components/executions/ExecutionList';
import { ExecutionDetailsModal } from '@/components/executions/ExecutionDetailsModal';
import { RunJobModal } from '@/components/jobs/RunJobModal';
import { PageTransition } from '@/components/ui/page-transition';

export const ExecutionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { executions, isLoading, error, page, limit, totalPages, loadExecutions, setPage, setFilters, filters } =
    useExecutionStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<JobExecution | null>(null);
  const [rangePreset, setRangePreset] = useState<'all' | '24h' | '7d' | '30d' | 'custom'>(() => '24h');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [retryJob, setRetryJob] = useState<Job | null>(null);
  const [retryInitial, setRetryInitial] = useState<{ target_url?: string; dispatch_url?: string } | undefined>(undefined);
  const appliedUrlFiltersRef = useRef(false);
  const isLoadingRef = useRef(false);
  const filtersRef = useRef(filters);
  const pageRef = useRef(page);
  const limitRef = useRef(limit);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    limitRef.current = limit;
  }, [limit]);

  const queryKey = useMemo(() => {
    const query = {
      page,
      limit: filters.limit ?? limit,
      job_id: filters.job_id ?? null,
      status: filters.status ?? null,
      trigger_type: filters.trigger_type ?? null,
      execution_type: filters.execution_type ?? null,
      from: filters.from ?? null,
      to: filters.to ?? null,
    };
    return JSON.stringify(query);
  }, [
    page,
    limit,
    filters.limit,
    filters.job_id,
    filters.status,
    filters.trigger_type,
    filters.execution_type,
    filters.from,
    filters.to,
  ]);

  useEffect(() => {
    const status = searchParams.get('status');
    const jobId = searchParams.get('job_id');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const nextFilters: any = { page: 1, limit: filters.limit ?? 20 };

    if (!appliedUrlFiltersRef.current) {
      if (status === 'success' || status === 'failed' || status === 'running' || status === 'failed,running')
        nextFilters.status = status;
      if (jobId) nextFilters.job_id = jobId;
      if (from) nextFilters.from = from;
      if (to) nextFilters.to = to;

      if (!status && !jobId && !from && !to) {
        // No URL filters: prefer preserving the current store filters (e.g., when navigating away and back).
        const current = filtersRef.current as any;
        const hasExisting =
          Boolean(current?.status) || Boolean(current?.job_id) || Boolean(current?.from) || Boolean(current?.to);

        if (hasExisting) {
          nextFilters.status = current.status;
          nextFilters.job_id = current.job_id;
          nextFilters.from = current.from;
          nextFilters.to = current.to;
        } else {
          // First visit: default to "Last 24h + Failed/Running".
          const fromIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          nextFilters.status = 'failed,running';
          nextFilters.from = fromIso;
          nextFilters.to = undefined;
          setRangePreset('24h');
          setFromDate('');
          setToDate('');
        }
      }
      appliedUrlFiltersRef.current = true;
      setFilters(nextFilters);
    }

    loadExecutions(nextFilters)
      .catch((e) => console.error('Failed to load executions:', e))
      .finally(() => setHasLoadedOnce(true));
    jobService
      .getAllJobs()
      .then(setJobs)
      .catch((e) => console.error('Failed to load jobs for executions filter:', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadExecutions, searchParams, setFilters]);

  const jobOptions = useMemo(() => jobs, [jobs]);

  // Auto-refresh so scheduled (cron) executions appear without manual reload
  useEffect(() => {
    // Avoid double-fetch on mount/filter changes: initial load is handled by the URL/store filter effect.
    if (!hasLoadedOnce) return;

    const shouldAutoRefresh = (() => {
      const to = filtersRef.current.to as string | undefined;
      if (!to) return true; // no upper bound: assume "live" view

      // If to is date-only and it's before today, this is a historical view -> don't auto-refresh.
      if (to.length === 10) {
        const today = new Date().toISOString().slice(0, 10);
        return to >= today;
      }

      // If datetime, refresh only when it reaches today or later.
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const toDate = new Date(to);
      return !Number.isNaN(toDate.getTime()) && toDate >= todayStart;
    })();

    const refresh = () => {
      // Prevent flicker/overlap: don't start a new request while one is in-flight.
      if (isLoadingRef.current) return;

      const currentFilters = filtersRef.current;
      const currentPage = pageRef.current;
      const currentLimit = currentFilters.limit ?? limitRef.current;

      return loadExecutions({ ...currentFilters, page: currentPage, limit: currentLimit }).catch(() => undefined);
    };

    if (!shouldAutoRefresh) return;

    const onFocus = () => refresh();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    const interval = window.setInterval(refresh, 15000);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [loadExecutions, queryKey]);

  const applyDateRange = (nextPreset: 'all' | '24h' | '7d' | '30d' | 'custom', nextFrom?: string, nextTo?: string) => {
    const nextFilters: any = {
      ...filters,
      from: nextPreset === 'all' ? undefined : nextFrom || undefined,
      to: nextPreset === 'all' ? undefined : nextTo || undefined,
      page: 1,
    };
    setFilters(nextFilters);
    loadExecutions(nextFilters);
  };

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
          Executions
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">View job execution history</p>
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Job</div>
                <Select
                  value={filters.job_id || 'all'}
                  onChange={(e) => {
                    const jobId = e.target.value;
                    const nextFilters: any = { ...filters, job_id: jobId === 'all' ? undefined : jobId, page: 1 };
                    setFilters(nextFilters);
                    loadExecutions(nextFilters);
                  }}
                >
                  <option value="all">All Jobs</option>
                  {jobOptions.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <Select
                  value={filters.status || 'all'}
                  onChange={(e) => {
                    const status = e.target.value;
                    const nextFilters: any = {
                      ...filters,
                      status: status === 'all' ? undefined : status,
                      page: 1,
                    };
                    setFilters(nextFilters);
                    loadExecutions(nextFilters);
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="failed,running">Failed + Running</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="running">Running</option>
                </Select>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">Trigger</div>
                <Select
                  value={(filters as any).trigger_type || 'all'}
                  onChange={(e) => {
                    const triggerType = e.target.value;
                    const nextFilters: any = {
                      ...filters,
                      trigger_type: triggerType === 'all' ? undefined : triggerType,
                      page: 1,
                    };
                    setFilters(nextFilters);
                    loadExecutions(nextFilters);
                  }}
                >
                  <option value="all">All</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="manual">Manual</option>
                </Select>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">Date range</div>
                <Select
                  value={rangePreset}
                  onChange={(e) => {
                    const preset = e.target.value as any;
                    setRangePreset(preset);

                    if (preset === 'all') {
                      setFromDate('');
                      setToDate('');
                      applyDateRange('all');
                      return;
                    }

                    if (preset === '24h') {
                      setFromDate('');
                      setToDate('');
                      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                      applyDateRange('24h', from, undefined);
                      return;
                    }

                    if (preset === '7d' || preset === '30d') {
                      const now = new Date();
                      const days = preset === '30d' ? 30 : 7;
                      const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                      const to = now.toISOString().slice(0, 10);
                      setFromDate(from);
                      setToDate(to);
                      applyDateRange(preset, from, to);
                      return;
                    }

                    // Custom: keep current values, but apply if already set.
                    applyDateRange('custom', fromDate || undefined, toDate || undefined);
                  }}
                >
                  <option value="all">All time</option>
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="custom">Custom</option>
                </Select>

                {rangePreset === 'custom' && (
                  <div className="mt-2 flex gap-2">
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFromDate(v);
                        applyDateRange('custom', v || undefined, toDate || undefined);
                      }}
                      aria-label="From date"
                    />
                    <Input
                      type="date"
                      value={toDate}
                      onChange={(e) => {
                        const v = e.target.value;
                        setToDate(v);
                        applyDateRange('custom', fromDate || undefined, v || undefined);
                      }}
                      aria-label="To date"
                    />
                  </div>
                )}
              </div>
            </div>

            {isLoading && executions.length === 0 && !hasLoadedOnce && (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                Loading executions...
              </div>
            )}

            {error && (
              <div className="rounded-md bg-destructive/10 p-4 text-destructive">{error}</div>
            )}

            {!isLoading && !error && executions.length === 0 && (
              <div className="p-6 bg-muted/30 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-muted-foreground">
                No executions found for the selected filters.
              </div>
            )}

            {executions.length > 0 && (
              <ExecutionList
                executions={executions}
                onViewDetails={(execution) => setSelectedExecution(execution)}
                onDrilldownJob={(jobId) => {
                  const next = new URLSearchParams(searchParams);
                  next.set('job_id', jobId);
                  setSearchParams(next, { replace: true });

                  const nextFilters: any = { ...filters, job_id: jobId, page: 1 };
                  setFilters(nextFilters);
                  loadExecutions(nextFilters);
                }}
              />
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  Page <span className="font-medium text-foreground">{page}</span> of{' '}
                  <span className="font-medium text-foreground">{totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 rounded-md border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Prev
                  </button>
                  <button
                    className="px-3 py-1 rounded-md border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {selectedExecution && (
              <ExecutionDetailsModal
                open={Boolean(selectedExecution)}
                execution={selectedExecution}
                onClose={() => setSelectedExecution(null)}
                onRetry={async () => {
                  if (!selectedExecution || selectedExecution.status !== 'failed') return;
                  try {
                    const job = await jobService.getJob(selectedExecution.job_id);
                    const init: { target_url?: string; dispatch_url?: string } = {};

                    if (selectedExecution.execution_type === 'webhook' && selectedExecution.target) {
                      init.target_url = selectedExecution.target;
                    }

                    if (selectedExecution.execution_type === 'github_actions' && selectedExecution.target) {
                      const parts = selectedExecution.target.split('/').filter(Boolean);
                      if (parts.length >= 3) {
                        const owner = parts[0];
                        const repo = parts[1];
                        const workflow = parts.slice(2).join('/');
                        init.dispatch_url = `https://github.com/${owner}/${repo}/actions/workflows/${workflow}`;
                      }
                    }

                    setRetryInitial(Object.keys(init).length > 0 ? init : undefined);
                    setRetryJob(job);
                  } catch (e: any) {
                    alert(e?.message || 'Failed to load job for retry.');
                  }
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {retryJob && (
        <RunJobModal
          job={retryJob}
          open={Boolean(retryJob)}
          initial={retryInitial}
          onClose={() => {
            setRetryJob(null);
            setRetryInitial(undefined);
          }}
          onRun={async (payload) => {
            await jobService.executeJob(retryJob.id, payload);
            alert('Job triggered successfully!');
          }}
        />
      )}
    </div>
    </PageTransition>
  );
};

export default ExecutionsPage;
