import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { useExecutionStore } from '@/stores/executionStore';
import { jobService } from '@/services/api/jobService';
import type { Job, JobExecution } from '@/types';
import { ExecutionList } from '@/components/executions/ExecutionList';
import { ExecutionDetailsModal } from '@/components/executions/ExecutionDetailsModal';

export const ExecutionsPage = () => {
  const { executions, isLoading, error, page, totalPages, loadExecutions, setPage, setFilters, filters } =
    useExecutionStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<JobExecution | null>(null);

  useEffect(() => {
    loadExecutions({ page: 1, limit: filters.limit ?? 20 }).catch((e) =>
      console.error('Failed to load executions:', e)
    );
    jobService
      .getAllJobs()
      .then(setJobs)
      .catch((e) => console.error('Failed to load jobs for executions filter:', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadExecutions]);

  const jobOptions = useMemo(() => jobs, [jobs]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
          Executions
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">View job execution history</p>
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Execution History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
            </div>

            {isLoading && executions.length === 0 && (
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
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExecutionsPage;
