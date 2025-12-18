import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useJobStore } from '@/stores/jobStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { JobFilters } from './JobFilters';
import { Pagination } from './Pagination';
import { AlertCircle, CheckCircle2, Download, Play, Pencil, Trash2, Plus, Power, PowerOff, Upload, X, ChevronUp, ChevronDown } from 'lucide-react';
import type { Job } from '@/types';
import { BulkUploadJobsCard } from './BulkUploadJobsCard';
import { RunJobModal } from './RunJobModal';
import { jobService } from '@/services/api/jobService';
import { stringifyCsv } from '@/services/utils/csv';
import { jobCategoryService, type JobCategory } from '@/services/api/jobCategoryService';

const applyClientSideFilters = (
  jobs: Job[],
  filters: {
    search?: string;
    is_active?: boolean;
    github_repo?: 'api' | 'mobile' | 'web';
    category?: string;
  }
) => {
  let filtered = jobs;

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter((job) =>
      job.name.toLowerCase().includes(searchLower) ||
      job.target_url?.toLowerCase().includes(searchLower)
    );
  }

  if (filters.is_active !== undefined) {
    filtered = filtered.filter((job) => job.is_active === filters.is_active);
  }

  if (filters.github_repo) {
    const getRepoType = (githubRepo?: string): 'api' | 'mobile' | 'web' | null => {
      const repo = githubRepo?.toLowerCase();
      if (!repo) return null;
      if (repo === 'api' || repo === 'web' || repo === 'mobile') return repo;
      if (repo.includes('api')) return 'api';
      if (repo.includes('web')) return 'web';
      if (repo.includes('mobile')) return 'mobile';
      return null;
    };
    filtered = filtered.filter((job) => getRepoType(job.github_repo) === filters.github_repo);
  }

  if (filters.category) {
    filtered = filtered.filter((job) => job.category === filters.category);
  }

  return filtered;
};

export const JobsList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    jobs,
    isLoading,
    error,
    page,
    total,
    totalPages,
    loadJobs,
    deleteJob,
    toggleJobStatus,
    executeJob,
    setPage,
    setFilters,
    filters,
  } = useJobStore();
  const { fetchUnreadCount, fetchNotifications } = useNotificationStore();
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [bulkWorking, setBulkWorking] = useState(false);
  const [selectingAll, setSelectingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [selectionScope, setSelectionScope] = useState<'page' | 'allMatching'>('page');
  const [runJob, setRunJob] = useState<Job | null>(null);
  const [runNowNotice, setRunNowNotice] = useState<{ jobId: string; jobName: string } | null>(
    null
  );
  const runNowNoticeTimeoutRef = useRef<number | null>(null);
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    jobCategoryService
      .list(false)
      .then(setCategories)
      .catch((e) => console.error('Failed to load job categories:', e));
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get('category');
    const sortBy = searchParams.get('sort') || null;
    const sortDir = searchParams.get('dir') || null;
    const fromStorage = localStorage.getItem('jobs-category') || null;
    const selected = (fromUrl || fromStorage || 'all').trim();

    const category = selected === 'all' ? undefined : selected;
    const nextSortBy =
      sortBy === 'name' || sortBy === 'repo' || sortBy === 'status' ? sortBy : undefined;
    const nextSortDir = sortDir === 'desc' ? 'desc' : sortDir === 'asc' ? 'asc' : undefined;

    setFilters({ category, sort_by: nextSortBy, sort_dir: nextSortDir, page: 1 });
    loadJobs({ ...filters, category, sort_by: nextSortBy, sort_dir: nextSortDir, page: 1, limit: 10 })
      .catch((err) => console.error('Failed to load jobs:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCategorySelection = (category: string | undefined) => {
    const value = category || 'all';
    localStorage.setItem('jobs-category', value);
    const next = new URLSearchParams(searchParams);
    if (!category || category === 'all') next.delete('category');
    else next.set('category', category);
    setSearchParams(next, { replace: true });
    setFilters({ category, page: 1 });
    loadJobs({ ...filters, category, page: 1, limit: 10 }).catch(() => undefined);
  };

  const setSort = (sort_by: 'name' | 'repo' | 'status') => {
    const currentBy = filters.sort_by;
    const currentDir = filters.sort_dir || 'asc';
    const nextDir: 'asc' | 'desc' =
      currentBy === sort_by ? (currentDir === 'asc' ? 'desc' : 'asc') : 'asc';

    const next = new URLSearchParams(searchParams);
    next.set('sort', sort_by);
    next.set('dir', nextDir);
    setSearchParams(next, { replace: true });

    setFilters({ sort_by, sort_dir: nextDir, page: 1 });
    loadJobs({ ...filters, sort_by, sort_dir: nextDir, page: 1, limit: 10 }).catch(() => undefined);
  };

  const sortIcon = (key: 'name' | 'repo' | 'status') => {
    if (filters.sort_by !== key) return <span className="inline-block w-4" />;
    return filters.sort_dir === 'desc' ? (
      <ChevronDown className="ml-1 h-4 w-4 text-indigo-600 dark:text-indigo-300" />
    ) : (
      <ChevronUp className="ml-1 h-4 w-4 text-indigo-600 dark:text-indigo-300" />
    );
  };

  const categoryTabs = useMemo(() => {
    const active = categories.filter((c) => c.is_active).sort((a, b) => a.name.localeCompare(b.name));
    const base: Array<{ key: string; label: string; category?: string }> = [
      { key: 'all', label: 'All', category: undefined },
      { key: 'general', label: 'General', category: 'general' },
    ];
    for (const c of active) {
      if (c.slug === 'general') continue;
      base.push({ key: c.slug, label: c.name, category: c.slug });
    }
    return base;
  }, [categories]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      setDeletingId(id);
      try {
        await deleteJob(id);
        // Small delay to ensure backend has created the notification
        await new Promise(resolve => setTimeout(resolve, 300));
        // Refresh notifications after deleting job
        await fetchUnreadCount();
        await fetchNotifications(1, 10, true);
      } catch (error) {
        console.error('Failed to delete job:', error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleJobStatus(id, !currentStatus);
      // Small delay to ensure backend has created the notification
      await new Promise(resolve => setTimeout(resolve, 300));
      // Refresh notifications after toggling job status
      await fetchUnreadCount();
      await fetchNotifications(1, 10, true);
    } catch (error) {
      console.error('Failed to toggle job status:', error);
    }
  };

  const scheduleRunNowNoticeDismiss = () => {
    if (runNowNoticeTimeoutRef.current) window.clearTimeout(runNowNoticeTimeoutRef.current);
    runNowNoticeTimeoutRef.current = window.setTimeout(() => setRunNowNotice(null), 10_000);
  };

  const handleExecute = async (id: string) => {
    try {
      const job = jobs.find((j) => j.id === id);
      if (!job) return;
      if (!job.is_active) {
        setRunNowNotice({ jobId: job.id, jobName: job.name });
        scheduleRunNowNoticeDismiss();
        return;
      }
      setRunJob(job);
    } catch (error) {
      console.error('Failed to execute job:', error);
    }
  };

  const downloadBlob = (filename: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllJobs = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      const allJobs = await jobService.getAllJobs();
      const timestamp = new Date().toISOString().slice(0, 19).replaceAll(':', '-');

      if (format === 'json') {
        const jsonText = JSON.stringify(allJobs, null, 2);
        downloadBlob(
          `jobs-${timestamp}.json`,
          new Blob([jsonText], { type: 'application/json;charset=utf-8' })
        );
        return;
      }

      const headers = [
        'id',
        'name',
        'cron_expression',
        'is_active',
        'target_url',
        'github_owner',
        'github_repo',
        'github_workflow_name',
        'created_at',
        'updated_at',
        'last_execution_at',
        'next_execution_at',
        'enable_email_notifications',
        'notification_emails',
        'notify_on_success',
        'metadata',
      ];
      const rows = allJobs.map((job) => [
        job.id ?? '',
        job.name ?? '',
        job.cron_expression ?? '',
        String(Boolean(job.is_active)),
        job.target_url ?? '',
        job.github_owner ?? '',
        job.github_repo ?? '',
        job.github_workflow_name ?? '',
        job.created_at ?? '',
        job.updated_at ?? '',
        job.last_execution_at ?? '',
        job.next_execution_at ?? '',
        String(Boolean(job.enable_email_notifications)),
        Array.isArray(job.notification_emails) ? job.notification_emails.join(',') : '',
        String(Boolean(job.notify_on_success)),
        job.metadata ? JSON.stringify(job.metadata) : '',
      ]);

      const csvText = stringifyCsv({ headers, rows });
      downloadBlob(`jobs-${timestamp}.csv`, new Blob([csvText], { type: 'text/csv;charset=utf-8' }));
    } catch (error) {
      console.error('Failed to export jobs:', error);
      alert('Failed to export jobs. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString(undefined, { timeZone: 'Asia/Tokyo' });
  };

  const getNextExecutionTextClassName = (dateString?: string) => {
    if (!dateString) return null;
    const nextMs = new Date(dateString).getTime();
    if (Number.isNaN(nextMs)) return null;
    const diffMs = nextMs - Date.now();
    if (diffMs <= 0) return null;

    const oneHourMs = 60 * 60 * 1000;
    const twelveHoursMs = 12 * oneHourMs;
    if (diffMs <= oneHourMs) return 'text-orange-600 dark:text-orange-400 font-medium';
    if (diffMs <= twelveHoursMs) return 'text-sky-600 dark:text-sky-400 font-medium';
    return null;
  };

  const getStatusBadge = (job: Job) => {
    return job.is_active ? (
      <Badge variant="success">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  const getRepoType = (job: Job): 'api' | 'web' | 'mobile' | null => {
    const repo = job.github_repo?.toLowerCase();
    if (!repo) return null;
    if (repo === 'api' || repo === 'web' || repo === 'mobile') return repo;
    if (repo.includes('api')) return 'api';
    if (repo.includes('web')) return 'web';
    if (repo.includes('mobile')) return 'mobile';
    return null;
  };

  const getRepoBadge = (job: Job) => {
    const repoType = getRepoType(job);
    if (!repoType) return null;

    const variant = repoType === 'api' ? 'info' : repoType === 'web' ? 'secondary' : 'warning';
    const label = repoType.toUpperCase();
    return (
      <Badge variant={variant} className="uppercase tracking-wide" title={`Repo type: ${label}`}>
        {label}
      </Badge>
    );
  };

  const handleFilterChange = (incoming: any) => {
    const safeIncoming = incoming ?? {};

    // IMPORTANT: the store merges filters; if a key is omitted it won't clear.
    // Always provide explicit `undefined` for "All" selections to override prior values.
    const nextFilters = {
      search: 'search' in safeIncoming ? (safeIncoming.search || undefined) : undefined,
      is_active: 'is_active' in safeIncoming ? safeIncoming.is_active : undefined,
      github_repo: 'github_repo' in safeIncoming ? safeIncoming.github_repo : undefined,
      category: filters.category,
    };

    // Prevent refetch loops if the same filters are applied repeatedly (e.g. debounced search).
    const unchanged =
      nextFilters.search === filters.search &&
      nextFilters.is_active === filters.is_active &&
      nextFilters.github_repo === filters.github_repo;
    if (unchanged && page === 1) return;

    setSelectedIds(new Set());
    setSelectionScope('page');

    setFilters(nextFilters);
    loadJobs({ ...nextFilters, page: 1, limit: 10 });
  };

  const handlePageChange = (newPage: number) => {
    if (selectionScope === 'page') {
      setSelectedIds(new Set());
    }
    setPage(newPage);
  };

  const pageJobIds = useMemo(() => jobs.map((j) => j.id), [jobs]);
  const selectedOnPageCount = useMemo(
    () => pageJobIds.filter((id) => selectedIds.has(id)).length,
    [pageJobIds, selectedIds]
  );
  const allOnPageSelected = pageJobIds.length > 0 && selectedOnPageCount === pageJobIds.length;
  const someOnPageSelected = selectedOnPageCount > 0 && !allOnPageSelected;

  useEffect(() => {
    if (!headerCheckboxRef.current) return;
    headerCheckboxRef.current.indeterminate = someOnPageSelected;
  }, [someOnPageSelected]);

  const toggleSelectAllOnPage = () => {
    setSelectionScope('page');
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        for (const id of pageJobIds) next.delete(id);
      } else {
        for (const id of pageJobIds) next.add(id);
      }
      return next;
    });
  };

  const toggleRowSelected = (id: string) => {
    setSelectionScope('page');
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const refreshNotificationsAfterBulk = async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await fetchUnreadCount();
    await fetchNotifications(1, 10, true);
  };

  const runBulkAction = async (action: 'enable' | 'disable' | 'delete') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    if (action === 'delete') {
      const includesOffPage = selectionScope === 'allMatching' || ids.length > pageJobIds.length;
      const ok = window.confirm(
        includesOffPage
          ? `Delete ${ids.length} job(s) (includes jobs not visible on this page)? This cannot be undone.`
          : `Delete ${ids.length} job(s) on this page? This cannot be undone.`
      );
      if (!ok) return;
      if (includesOffPage) {
        const ok2 = window.confirm('Are you absolutely sure?');
        if (!ok2) return;
      }
    }

    setBulkWorking(true);
    try {
      const results = await Promise.allSettled(
        ids.map(async (id) => {
          if (action === 'enable') return toggleJobStatus(id, true);
          if (action === 'disable') return toggleJobStatus(id, false);
          return deleteJob(id);
        })
      );

      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        console.error('Bulk action errors:', failed);
        alert(
          `Bulk action completed with errors. Succeeded: ${ids.length - failed.length}, Failed: ${failed.length}.`
        );
      } else {
        alert(`Bulk action succeeded for ${ids.length} job(s).`);
      }

      setSelectedIds(new Set());
      await refreshNotificationsAfterBulk();
    } finally {
      setBulkWorking(false);
    }
  };

  const selectAllMatchingFilters = async () => {
    setSelectingAll(true);
    try {
      const allJobs = await jobService.getAllJobs();
      const matching = applyClientSideFilters(allJobs, {
        search: filters.search,
        is_active: filters.is_active,
        github_repo: filters.github_repo,
        category: filters.category,
      });
      const ok = window.confirm(
        `Select all ${matching.length} job(s) matching current filters? This includes jobs not visible on this page.`
      );
      if (!ok) return;
      setSelectionScope('allMatching');
      setSelectedIds(new Set(matching.map((j) => j.id)));
    } catch (e) {
      console.error('Failed to select all jobs:', e);
      alert('Failed to select all jobs. Please try again.');
    } finally {
      setSelectingAll(false);
    }
  };

  if (isLoading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading jobs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Cron Jobs</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">Manage and monitor your scheduled tasks</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
                  disabled={exporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exporting ? 'Preparing…' : 'Download Jobs'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-gray-200 dark:border-gray-700">
                <DropdownMenuItem onClick={() => downloadAllJobs('csv')} disabled={exporting}>
                  Download as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadAllJobs('json')} disabled={exporting}>
                  Download as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={() => setShowBulkUpload((v) => !v)}
              className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
            >
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload CSV
            </Button>
            <Button onClick={() => navigate('/jobs/new')} className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Job
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categoryTabs.map((t) => {
          const active = (filters.category || undefined) === t.category;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setCategorySelection(t.category)}
              className={
                active
                  ? 'px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md'
                  : 'px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 dark:hover:from-gray-700 dark:hover:to-gray-600'
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <JobFilters onFilterChange={handleFilterChange} />

      {showBulkUpload && <BulkUploadJobsCard onClose={() => setShowBulkUpload(false)} />}
      {runJob && (
        <RunJobModal
          open={Boolean(runJob)}
          job={runJob}
          onClose={() => setRunJob(null)}
          onRun={async (payload) => {
            await executeJob(runJob.id, payload);
            alert('Job triggered successfully!');
          }}
        />
      )}

      {runNowNotice && (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100 p-3 text-sm"
          onMouseEnter={() => {
            if (runNowNoticeTimeoutRef.current) window.clearTimeout(runNowNoticeTimeoutRef.current);
          }}
          onMouseLeave={scheduleRunNowNoticeDismiss}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <div>
                <div>
                  Job <span className="font-semibold">{runNowNotice.jobName}</span> is inactive.
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200 underline underline-offset-4"
                    onClick={async () => {
                      try {
                        await toggleJobStatus(runNowNotice.jobId, true);
                        await refreshNotificationsAfterBulk();
                        setRunNowNotice(null);
                      } catch (e) {
                        console.error('Failed to enable job:', e);
                      }
                    }}
                  >
                    Enable job
                  </button>
                  <span className="text-xs text-muted-foreground">Then click Run Now again.</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRunNowNotice(null)}
              title="Dismiss"
              className="hover:bg-white dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing <span className="font-medium text-foreground">{jobs.length}</span> job(s) on this
            page{typeof total === 'number' ? (
              <>
                {' '}
                (total: <span className="font-medium text-foreground">{total}</span>)
              </>
            ) : null}
          </div>
          {totalPages > 0 && (
            <div>
              Page <span className="font-medium text-foreground">{page}</span> of{' '}
              <span className="font-medium text-foreground">{totalPages}</span>
            </div>
          )}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="rounded-2xl border border-indigo-100 dark:border-gray-700 bg-gradient-to-r from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-medium">{selectedIds.size} selected</span>
              {selectionScope === 'allMatching' && (
                <span className="text-muted-foreground">(all matching filters)</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedIds(new Set());
                  setSelectionScope('page');
                }}
                disabled={bulkWorking || selectingAll}
                className="hover:bg-white dark:hover:bg-gray-700"
              >
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                onClick={selectAllMatchingFilters}
                disabled={bulkWorking || selectingAll}
                className="border-indigo-200 dark:border-gray-700"
              >
                {selectingAll ? 'Selecting…' : 'Select all matching'}
              </Button>
              <Button onClick={() => runBulkAction('enable')} disabled={bulkWorking} className="w-full sm:w-auto">
                Enable
              </Button>
              <Button
                onClick={() => runBulkAction('disable')}
                disabled={bulkWorking}
                variant="outline"
                className="border-indigo-200 dark:border-gray-700 w-full sm:w-auto"
              >
                Disable
              </Button>
              <Button onClick={() => runBulkAction('delete')} disabled={bulkWorking} variant="destructive" className="w-full sm:w-auto">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900 dark:to-blue-900 rounded-full flex items-center justify-center mb-4">
            <Plus className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg font-medium">
            No jobs found. Create your first job to get started.
          </p>
          <Button onClick={() => navigate('/jobs/new')} className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all">
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden bg-white dark:bg-gray-800">
          <Table>
            <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
              <TableRow>
                <TableHead className="w-10">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAllOnPage}
                    aria-label="Select all jobs on this page"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => setSort('name')}
                    className="inline-flex items-center hover:text-indigo-700 dark:hover:text-indigo-300"
                  >
                    Name
                    {sortIcon('name')}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => setSort('repo')}
                    className="inline-flex items-center hover:text-indigo-700 dark:hover:text-indigo-300"
                  >
                    Repo
                    {sortIcon('repo')}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => setSort('status')}
                    className="inline-flex items-center hover:text-indigo-700 dark:hover:text-indigo-300"
                  >
                    Status
                    {sortIcon('status')}
                  </button>
                </TableHead>
                <TableHead>Cron Expression</TableHead>
                <TableHead>Target URL</TableHead>
                <TableHead>Last Execution</TableHead>
                <TableHead>Next Execution</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(job.id)}
                      onChange={() => toggleRowSelected(job.id)}
                      aria-label={`Select job ${job.name}`}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{job.name}</TableCell>
                  <TableCell>{getRepoBadge(job) || <span className="text-muted-foreground">-</span>}</TableCell>
                  <TableCell>{getStatusBadge(job)}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {job.cron_expression}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-xs">
                    {job.target_url || job.github_workflow_name || '-'}
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(job.last_execution_at)}</TableCell>
                  <TableCell className="text-sm">
                    <span className={getNextExecutionTextClassName(job.next_execution_at) || undefined}>
                      {formatDate(job.next_execution_at)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(job.id, job.is_active)}
                        title={job.is_active ? 'Disable' : 'Enable'}
                      >
                        {job.is_active ? (
                          <PowerOff className="h-4 w-4 text-red-500" />
                        ) : (
                          <Power className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExecute(job.id)}
                        title="Run Now"
                      >
                        <Play className={job.is_active ? 'h-4 w-4 text-green-600' : 'h-4 w-4 text-muted-foreground'} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/jobs/${job.id}/edit`)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4 text-amber-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(job.id)}
                        disabled={deletingId === job.id}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default JobsList;
