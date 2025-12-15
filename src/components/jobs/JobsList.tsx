import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { CheckCircle2, Download, Play, Pencil, Trash2, Plus, Power, PowerOff, Upload, X } from 'lucide-react';
import type { Job } from '@/types';
import { BulkUploadJobsCard } from './BulkUploadJobsCard';
import { jobService } from '@/services/api/jobService';
import { stringifyCsv } from '@/services/utils/csv';

const applyClientSideFilters = (
  jobs: Job[],
  filters: { search?: string; is_active?: boolean; github_repo?: 'api' | 'mobile' | 'web' }
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
    filtered = filtered.filter((job) => job.github_repo === filters.github_repo);
  }

  return filtered;
};

export const JobsList = () => {
  const navigate = useNavigate();
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [bulkWorking, setBulkWorking] = useState(false);
  const [selectingAll, setSelectingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [selectionScope, setSelectionScope] = useState<'page' | 'allMatching'>('page');
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadJobs().catch((err) => {
      console.error('Failed to load jobs:', err);
    });
  }, [loadJobs]);

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

  const handleExecute = async (id: string) => {
    try {
      await executeJob(id);
      alert('Job executed successfully!');
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
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (job: Job) => {
    return job.is_active ? (
      <Badge variant="success">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  const handleFilterChange = (filters: any) => {
    setSelectedIds(new Set());
    setSelectionScope('page');
    setPage(1); // Reset to first page when filters change
    
    // When clearing, explicitly pass undefined for all filter fields to override store
    if (Object.keys(filters).length === 0) {
      setFilters({});
      loadJobs({ 
        page: 1, 
        limit: 10,
        search: undefined,
        is_active: undefined,
        github_repo: undefined
      });
    } else {
      setFilters(filters);
      loadJobs({ ...filters, page: 1 });
    }
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

      <JobFilters onFilterChange={handleFilterChange} />

      {showBulkUpload && <BulkUploadJobsCard onClose={() => setShowBulkUpload(false)} />}

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
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell className="text-sm">{formatDate(job.next_execution_at)}</TableCell>
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
                        <Play className="h-4 w-4 text-green-600" />
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
