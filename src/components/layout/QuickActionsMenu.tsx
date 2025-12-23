import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Zap, Play, XCircle, X } from 'lucide-react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Job } from '@/types';
import { jobService } from '@/services/api/jobService';
import { RunJobModal } from '@/components/jobs/RunJobModal';

export function QuickActionsMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [runJob, setRunJob] = useState<Job | null>(null);
  const [runOpen, setRunOpen] = useState(false);

  const activeJobs = useMemo(() => jobs.filter((j) => j.is_active), [jobs]);
  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeJobs;
    return activeJobs.filter((j) => (j.name || '').toLowerCase().includes(q));
  }, [activeJobs, search]);

  useEffect(() => {
    if (!pickerOpen) return;
    if (jobsLoading) return;
    if (jobs.length > 0) return;

    setJobsError(null);
    setJobsLoading(true);
    Promise.resolve(jobService.getAllJobs())
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch((e) => setJobsError(e?.message || 'Failed to load jobs'))
      .finally(() => setJobsLoading(false));
  }, [pickerOpen, jobsLoading, jobs.length]);

  useEffect(() => {
    if (!pickerOpen) return;
    if (selectedJobId) return;
    if (filteredJobs.length === 0) return;
    setSelectedJobId(filteredJobs[0].id);
  }, [pickerOpen, filteredJobs, selectedJobId]);

  const openRunPicker = () => {
    setSearch('');
    setSelectedJobId('');
    setJobs([]);
    setPickerOpen(true);
  };

  const openRunModal = () => {
    const job =
      activeJobs.find((j) => j.id === selectedJobId) ||
      filteredJobs[0] ||
      null;
    if (!job) return;
    setRunJob(job);
    setRunOpen(true);
    setPickerOpen(false);
  };

  const selectJob = (job: Job) => {
    setSelectedJobId(job.id);
    setSearch(job.name || '');
  };

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <Tooltip content="Quick actions" position="bottom">
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Quick actions"
              className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 dark:hover:from-gray-700 dark:hover:to-gray-600 rounded-lg transition-all"
            >
              <Zap className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild>
            <Link to="/jobs/new">
              <Plus className="h-4 w-4" />
              Create job
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setMenuOpen(false);
              // Wait for Radix menu close animations/focus handling to complete.
              window.setTimeout(() => openRunPicker(), 0);
            }}
          >
            <Play className="h-4 w-4" />
            Run job
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link to="/executions?status=failed">
              <XCircle className="h-4 w-4" />
              View failures
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {pickerOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[60]">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
              onClick={() => setPickerOpen(false)}
            />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-all animate-in fade-in zoom-in-95">
                <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-200 dark:border-gray-700">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">Run job</h2>
                    <div className="text-sm text-muted-foreground">Choose an active job to run now.</div>
                  </div>
                  <Tooltip content="Close" position="left">
                    <Button variant="ghost" size="sm" onClick={() => setPickerOpen(false)}>
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </Button>
                  </Tooltip>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex gap-2">
                    <div className="w-full space-y-2">
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search jobs…"
                        aria-label="Search jobs"
                        autoComplete="off"
                      />

                      {search.trim() && (
                        <div className="rounded-lg border bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
                          <div className="max-h-56 overflow-auto py-1">
                            {filteredJobs.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-muted-foreground">No matching active jobs</div>
                            ) : (
                              filteredJobs.slice(0, 12).map((j) => (
                                <button
                                  key={j.id}
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent focus:bg-accent outline-none"
                                  onClick={() => selectJob(j)}
                                >
                                  {j.name}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <Button type="button" variant="outline" onClick={() => setSearch('')} disabled={!search.trim()}>
                      Clear
                    </Button>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Job</div>
                    <Select
                      value={selectedJobId || ''}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      disabled={jobsLoading || filteredJobs.length === 0}
                    >
                      {jobsLoading && <option value="">Loading…</option>}
                      {!jobsLoading && filteredJobs.length === 0 && <option value="">No active jobs</option>}
                      {filteredJobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.name}
                        </option>
                      ))}
                    </Select>
                    {jobsError && <div className="mt-2 text-sm text-red-600">{jobsError}</div>}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setPickerOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={openRunModal} disabled={!selectedJobId || jobsLoading}>
                      Continue
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {runJob && (
        <RunJobModal
          job={runJob}
          open={runOpen}
          onClose={() => setRunOpen(false)}
          onRun={(payload) => jobService.executeJob(runJob.id, payload)}
        />
      )}
    </>
  );
}

export default QuickActionsMenu;
