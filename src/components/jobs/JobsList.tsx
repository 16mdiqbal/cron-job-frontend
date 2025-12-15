import { useEffect, useState } from 'react';
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
import { JobFilters } from './JobFilters';
import { Pagination } from './Pagination';
import { Play, Pencil, Trash2, Plus, Power, PowerOff } from 'lucide-react';
import type { Job } from '@/types';

export const JobsList = () => {
  const navigate = useNavigate();
  const {
    jobs,
    isLoading,
    error,
    page,
    totalPages,
    loadJobs,
    deleteJob,
    toggleJobStatus,
    executeJob,
    setPage,
    setFilters,
  } = useJobStore();
  const { fetchUnreadCount, fetchNotifications } = useNotificationStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleFilterChange = (filters: any) => {
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
    setPage(newPage);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Cron Jobs</h2>
        <Button onClick={() => navigate('/jobs/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Job
        </Button>
      </div>

      <JobFilters onFilterChange={handleFilterChange} />

      {jobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No jobs found. Create your first job to get started.
          </p>
          <Button onClick={() => navigate('/jobs/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
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
