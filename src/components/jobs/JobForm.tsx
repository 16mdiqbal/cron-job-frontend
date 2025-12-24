import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useJobStore } from '@/stores/jobStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { getErrorMessage } from '@/services/utils/error';
import { jobCategoryService, type JobCategory } from '@/services/api/jobCategoryService';
import { picTeamService, type PicTeam } from '@/services/api/picTeamService';
import { jobService, type CreateJobRequest, type TestRunResponse } from '@/services/api/jobService';
import { Badge } from '@/components/ui/badge';

interface MetadataField {
  key: string;
  value: string;
}

interface JobFormData {
  name: string;
  cron_expression: string;
  target_url?: string;
  github_owner: string;
  github_repo: string;
  github_workflow_name: string;
  category?: string;
  end_date: string;
  pic_team: string;
}

export const JobForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { currentJob, isLoading, createJob, updateJob, loadJob, clearCurrentJob } = useJobStore();
  const { fetchUnreadCount, fetchNotifications } = useNotificationStore();
  const isEditMode = !!id;
  const [saving, setSaving] = useState(false);
  const [metadata, setMetadata] = useState<MetadataField[]>([{ key: '', value: '' }]);
  const [metadataError, setMetadataError] = useState<string>('');
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [picTeams, setPicTeams] = useState<PicTeam[]>([]);
  const [cronValidation, setCronValidation] = useState<{ valid: boolean; message?: string } | null>(
    null
  );
  const [cronNextRun, setCronNextRun] = useState<{ timezone: string; nextRunIso: string } | null>(
    null
  );
  const [cronPreview, setCronPreview] = useState<{ timezone: string; nextRuns: string[] } | null>(
    null
  );
  const [cronPreviewLoading, setCronPreviewLoading] = useState(false);
  const [cronPreviewError, setCronPreviewError] = useState<string>('');
  const [showCronPreview, setShowCronPreview] = useState(false);
  const [testRun, setTestRun] = useState<{ running: boolean; message?: string; ok?: boolean }>(
    () => ({
      running: false,
    })
  );

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<JobFormData>({
    defaultValues: {
      name: '',
      cron_expression: '*/5 * * * *',
      target_url: '',
      github_owner: '',
      github_repo: 'api',
      github_workflow_name: '',
      category: 'general',
      end_date: '',
      pic_team: '',
    },
  });

  const cronExpression = watch('cron_expression');
  const github_repo = watch('github_repo');
  const targetUrl = watch('target_url');
  const githubOwner = watch('github_owner');
  const githubWorkflow = watch('github_workflow_name');

  const metadataObj = useMemo(() => {
    const out: Record<string, string> = {};
    metadata.forEach((m) => {
      if (m.key.trim() && m.value.trim()) out[m.key.trim()] = m.value.trim();
    });
    return out;
  }, [metadata]);

  const formatJst = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { timeZone: 'Asia/Tokyo' });

  useEffect(() => {
    // Only load job if we're in edit mode AND have a valid id
    if (id) {
      loadJob(id);
    }
    jobCategoryService
      .list(false)
      .then(setCategories)
      .catch((e) => console.error('Failed to load job categories:', e));
    picTeamService
      .list(false)
      .then(setPicTeams)
      .catch((e) => console.error('Failed to load PIC teams:', e));
    return () => {
      clearCurrentJob();
    };
  }, [id, loadJob, clearCurrentJob]);

  useEffect(() => {
    if (currentJob) {
      // Use reset() to update all form values at once
      reset({
        name: currentJob.name,
        cron_expression: currentJob.cron_expression,
        target_url: currentJob.target_url || '',
        github_owner: currentJob.github_owner || '',
        github_repo: currentJob.github_repo || 'api',
        github_workflow_name: currentJob.github_workflow_name || '',
        category: currentJob.category || 'general',
        end_date: currentJob.end_date || '',
        pic_team: currentJob.pic_team || '',
      });

      // Load metadata
      if (currentJob.metadata && typeof currentJob.metadata === 'object') {
        const metadataFields = Object.entries(currentJob.metadata).map(([key, value]) => ({
          key,
          value: String(value),
        }));
        setMetadata(metadataFields.length > 0 ? metadataFields : [{ key: '', value: '' }]);
      }
    }
  }, [currentJob, reset]);

  useEffect(() => {
    let cancelled = false;
    const expr = (cronExpression || '').trim();
    if (!expr) {
      setCronValidation(null);
      setCronNextRun(null);
      setCronPreview(null);
      setCronPreviewError('');
      return;
    }

    setCronPreviewError('');
    setCronPreviewLoading(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const validation = await jobService.validateCronExpression(expr);
        if (cancelled) return;
        setCronValidation({
          valid: Boolean(validation?.valid),
          message: validation?.message || validation?.error,
        });

        if (!validation?.valid) {
          setCronNextRun(null);
          setCronPreview(null);
          setCronPreviewLoading(false);
          return;
        }

        const nextRun = await jobService.getCronPreview(expr, 1);
        if (cancelled) return;
        const tz = nextRun.timezone || 'Asia/Tokyo';
        const nextIso = nextRun.next_runs?.[0];
        setCronNextRun(nextIso ? { timezone: tz, nextRunIso: nextIso } : null);

        if (showCronPreview) {
          const preview = await jobService.getCronPreview(expr, 5);
          if (cancelled) return;
          setCronPreview({ timezone: tz, nextRuns: preview.next_runs || [] });
        } else {
          setCronPreview(null);
        }
      } catch (e: unknown) {
        if (cancelled) return;
        setCronPreview(null);
        setCronNextRun(null);
        setCronValidation(null);
        setCronPreviewError(getErrorMessage(e, 'Failed to preview cron.'));
      } finally {
        if (!cancelled) setCronPreviewLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [cronExpression, showCronPreview]);

  const handleAddMetadata = () => {
    if (metadata.length < 10) {
      setMetadata([...metadata, { key: '', value: '' }]);
      setMetadataError('');
    } else {
      setMetadataError('Maximum 10 metadata fields allowed');
    }
  };

  const handleRemoveMetadata = (index: number) => {
    if (metadata.length > 1) {
      setMetadata(metadata.filter((_, i) => i !== index));
      setMetadataError('');
    }
  };

  const handleMetadataChange = (index: number, field: 'key' | 'value', value: string) => {
    const newMetadata = [...metadata];
    newMetadata[index][field] = value;
    setMetadata(newMetadata);
    setMetadataError('');
  };

  const validateMetadata = (): boolean => {
    // Check if at least one valid metadata pair exists
    const validPairs = metadata.filter((m) => m.key.trim() && m.value.trim());
    if (validPairs.length === 0) {
      setMetadataError('At least one metadata key-value pair is required');
      return false;
    }

    // Check for duplicate keys
    const keys = validPairs.map((m) => m.key.trim());
    const uniqueKeys = new Set(keys);
    if (keys.length !== uniqueKeys.size) {
      setMetadataError('Duplicate metadata keys are not allowed');
      return false;
    }

    setMetadataError('');
    return true;
  };

  const onSubmit = async (data: JobFormData) => {
    try {
      // Validate metadata
      if (!validateMetadata()) {
        return;
      }

      // Validate cron expression with backend rules so the user gets the "why" message.
      const cronCheck = await jobService.validateCronExpression(
        (data.cron_expression || '').trim()
      );
      if (!cronCheck?.valid) {
        const message = cronCheck?.message || 'Invalid cron expression.';
        setError('cron_expression', { type: 'validate', message });
        return;
      }

      setSaving(true);

      // Build metadata object from fields
      const metadataObj: Record<string, string> = {};
      metadata.forEach((m) => {
        if (m.key.trim() && m.value.trim()) {
          metadataObj[m.key.trim()] = m.value.trim();
        }
      });

      const jobData: CreateJobRequest = {
        name: data.name,
        cron_expression: data.cron_expression,
        github_owner: data.github_owner.trim(),
        github_repo: data.github_repo,
        github_workflow_name: data.github_workflow_name.trim(),
        end_date: data.end_date,
        pic_team: data.pic_team,
        metadata: metadataObj,
        category: data.category || 'general',
      };

      // Add target_url if provided
      if (data.target_url && data.target_url.trim()) {
        jobData.target_url = data.target_url.trim();
      }

      console.log('Submitting job data:', jobData); // Debug log

      if (isEditMode && id) {
        await updateJob(id, jobData);
      } else {
        await createJob(jobData);
      }

      // Small delay to ensure backend has created the notification
      await new Promise((resolve) => setTimeout(resolve, 300));
      // Refresh notifications after creating/updating job
      await fetchUnreadCount();
      await fetchNotifications(1, 10, true);

      navigate('/jobs');
    } catch (error) {
      console.error('Failed to save job:', error);
      // Show error to user
      if (error instanceof Error) {
        alert(`Failed to ${isEditMode ? 'update' : 'create'} job: ${error.message}`);
      }
      setSaving(false);
    }
  };

  const handleTestRun = async () => {
    setTestRun({ running: true, message: undefined, ok: undefined });
    try {
      if (!validateMetadata()) {
        setTestRun({ running: false, message: 'Fix metadata validation first.', ok: false });
        return;
      }

      const validation = await jobService.validateCronExpression((cronExpression || '').trim());
      if (!validation?.valid) {
        setTestRun({
          running: false,
          message: validation?.message || 'Cron expression is invalid.',
          ok: false,
        });
        return;
      }

      const payload = {
        target_url: targetUrl?.trim() ? targetUrl.trim() : undefined,
        github_owner: githubOwner?.trim() ? githubOwner.trim() : undefined,
        github_repo: github_repo,
        github_workflow_name: githubWorkflow?.trim() ? githubWorkflow.trim() : undefined,
        metadata: metadataObj,
      };

      const result: TestRunResponse = await jobService.testRun(payload);
      setTestRun({
        running: false,
        ok: result.ok,
        message: result.message || (result.ok ? 'Test run succeeded.' : 'Test run failed.'),
      });
    } catch (e: unknown) {
      setTestRun({
        running: false,
        ok: false,
        message: getErrorMessage(e, 'Test run failed.'),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700">
        <Button
          variant="ghost"
          onClick={() => navigate('/jobs')}
          className="mb-4 hover:bg-white dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
          {isEditMode ? 'Edit Job' : 'Create New Job'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isEditMode ? 'Update your scheduled job' : 'Create a new scheduled cron job'}
        </p>
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Job Details
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Configure your cron job settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Job Configuration</h3>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Job Name <span className="text-rose-600 dark:text-rose-400">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Daily Report Generation"
                  error={errors.name?.message}
                  {...register('name', {
                    required: 'Job name is required',
                    minLength: { value: 3, message: 'Job name must be at least 3 characters' },
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cron_expression">
                  Cron Expression <span className="text-rose-600 dark:text-rose-400">*</span>
                </Label>
                <div className="rounded-xl border border-indigo-200 dark:border-gray-700 bg-indigo-50/60 dark:bg-indigo-950/20 p-3">
                  <div className="text-sm text-indigo-900 dark:text-indigo-100">
                    <span className="font-semibold">Format:</span>{' '}
                    <span className="font-mono">minute hour day month day-of-week</span>{' '}
                    <span className="text-indigo-700/80 dark:text-indigo-200/80">
                      (e.g.,{' '}
                      <span className="font-mono bg-white/70 dark:bg-gray-900/40 px-1 py-0.5 rounded">
                        */5 * * * *
                      </span>{' '}
                      = every 5 minutes)
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-indigo-700/80 dark:text-indigo-200/80">
                    Cron is interpreted in <span className="font-semibold">JST</span> by default.
                  </div>
                </div>
                <Input
                  id="cron_expression"
                  placeholder="*/5 * * * *"
                  error={errors.cron_expression?.message}
                  {...register('cron_expression', {
                    required: 'Cron expression is required',
                    validate: (value) => {
                      // Fast local validation (backend validation runs in background and on submit)
                      const parts = value.trim().split(/\s+/);
                      if (parts.length !== 5) {
                        return 'Cron expression must have exactly 5 fields';
                      }
                      return true;
                    },
                  })}
                />
                {cronValidation && !cronValidation.valid && (
                  <p className="text-sm text-destructive">
                    {cronValidation.message || 'Invalid cron expression.'}
                  </p>
                )}
                {cronValidation?.valid && (
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Cron{' '}
                    <span className="font-mono rounded bg-green-50 dark:bg-green-950/30 px-1 py-0.5">
                      {(cronExpression || '').trim()}
                    </span>{' '}
                    is valid
                    {cronNextRun?.nextRunIso ? (
                      <>
                        {' '}
                        and will run next at{' '}
                        <span className="font-semibold">
                          {formatJst(cronNextRun.nextRunIso)}
                        </span>{' '}
                        JST.
                      </>
                    ) : cronPreviewLoading ? (
                      <> (loading next runs…)</>
                    ) : (
                      '.'
                    )}
                  </p>
                )}
                {cronPreviewError && <p className="text-sm text-destructive">{cronPreviewError}</p>}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/30 p-3 flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    {cronValidation?.valid
                      ? 'Preview upcoming runs for this schedule.'
                      : 'Enter a valid cron expression to preview runs.'}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!cronValidation?.valid || cronPreviewLoading}
                    onClick={() => setShowCronPreview((v) => !v)}
                    className="shrink-0 border-indigo-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 text-indigo-700 dark:text-indigo-300 hover:shadow-md transition-all"
                  >
                    {showCronPreview ? 'Hide preview' : 'Preview next runs'}
                  </Button>
                </div>

                {showCronPreview && (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/30 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        Next 5 runs
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {cronPreview?.timezone || cronNextRun?.timezone || 'Asia/Tokyo'}
                        </Badge>
                        {cronPreviewLoading && (
                          <span className="text-xs text-muted-foreground">Loading…</span>
                        )}
                      </div>
                    </div>
                    {cronPreview?.nextRuns?.length ? (
                      <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        {cronPreview.nextRuns.map((iso) => (
                          <li key={iso} className="flex items-center justify-between gap-3">
                            <span className="truncate">
                              {new Date(iso).toLocaleString(undefined, { timeZone: 'Asia/Tokyo' })}
                            </span>
                            <span className="text-xs text-muted-foreground">JST</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {cronPreviewLoading ? 'Loading preview…' : 'No upcoming runs found.'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category (Optional)</Label>
                <Select id="category" {...register('category')}>
                  <option value="general">General</option>
                  {categories
                    .filter((c) => c.is_active && c.slug !== 'general')
                    .map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                </Select>
                <p className="text-sm text-muted-foreground">
                  Categories are managed by admins in Settings → Job Categories.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="end_date">
                    End Date (JST) <span className="text-rose-600 dark:text-rose-400">*</span>
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    error={errors.end_date?.message}
                    {...register('end_date', { required: 'End date is required' })}
                  />
                  <p className="text-sm text-muted-foreground">
                    After this date, the job will be auto-paused to avoid unnecessary executions.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pic_team">
                    PIC Team <span className="text-rose-600 dark:text-rose-400">*</span>
                  </Label>
                  <Select
                    id="pic_team"
                    error={errors.pic_team?.message}
                    {...register('pic_team', { required: 'PIC team is required' })}
                  >
                    <option value="">Select a team…</option>
                    {picTeams
                      .filter((t) => t.is_active)
                      .map((t) => (
                        <option key={t.id} value={t.slug}>
                          {t.name}
                        </option>
                      ))}
                  </Select>
                  {picTeams.filter((t) => t.is_active).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No PIC teams found. Ask an admin to add one in{' '}
                      <button
                        type="button"
                        onClick={() => navigate('/settings?tab=pic-teams')}
                        className="text-indigo-700 dark:text-indigo-300 underline underline-offset-4"
                      >
                        Settings → PIC Teams
                      </button>
                      .
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Choose the team responsible for this job.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_url">Webhook URL (Optional)</Label>
                <Input
                  id="target_url"
                  type="url"
                  placeholder="https://example.com/webhook"
                  error={errors.target_url?.message}
                  {...register('target_url', {
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message: 'Please enter a valid URL',
                    },
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  Optional webhook URL for custom integrations
                </p>
              </div>
            </div>

            {/* GitHub Actions Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">GitHub Actions Configuration</h3>

              <div className="space-y-2">
                <Label htmlFor="github_owner">
                  GitHub Owner <span className="text-rose-600 dark:text-rose-400">*</span>
                </Label>
                <Input
                  id="github_owner"
                  placeholder="e.g., myorganization"
                  error={errors.github_owner?.message}
                  {...register('github_owner', {
                    required: 'GitHub owner is required',
                    minLength: { value: 1, message: 'GitHub owner cannot be empty' },
                  })}
                />
                <p className="text-sm text-muted-foreground">GitHub organization or username</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="github_repo">
                  Repository <span className="text-rose-600 dark:text-rose-400">*</span>
                </Label>
                <Select
                  id="github_repo"
                  value={github_repo}
                  onChange={(e) => setValue('github_repo', e.target.value)}
                  error={errors.github_repo?.message}
                >
                  <option value="api">API</option>
                  <option value="mobile">Mobile</option>
                  <option value="web">Web</option>
                </Select>
                <p className="text-sm text-muted-foreground">Select the repository for this job</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="github_workflow_name">
                  Workflow Name <span className="text-rose-600 dark:text-rose-400">*</span>
                </Label>
                <Input
                  id="github_workflow_name"
                  placeholder="e.g., deploy.yml"
                  error={errors.github_workflow_name?.message}
                  {...register('github_workflow_name', {
                    required: 'Workflow name is required',
                    minLength: { value: 1, message: 'Workflow name cannot be empty' },
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  GitHub Actions workflow filename (e.g., deploy.yml)
                </p>
              </div>
            </div>

            {/* Metadata Configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  Metadata <span className="text-rose-600 dark:text-rose-400">*</span>
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddMetadata}
                  disabled={metadata.length >= 10}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Field
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Add metadata key-value pairs for GitHub Actions workflow dispatch (max 10)
              </p>

              {metadataError && <p className="text-sm text-destructive">{metadataError}</p>}

              <div className="space-y-3">
                {metadata.map((field, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Key (e.g., environment)"
                        value={field.key}
                        onChange={(e) => handleMetadataChange(index, 'key', e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Value (e.g., production)"
                        value={field.value}
                        onChange={(e) => handleMetadataChange(index, 'value', e.target.value)}
                      />
                    </div>
                    {metadata.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMetadata(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4">
              <Button
                type="submit"
                loading={isLoading || saving}
                loadingText={isEditMode ? 'Updating…' : 'Creating…'}
                loadingMinMs={600}
                disabled={isLoading || saving}
                className="min-w-[120px]"
              >
                {isEditMode ? 'Update Job' : 'Create Job'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleTestRun}
                disabled={isLoading || saving || testRun.running}
              >
                {testRun.running ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing…
                  </>
                ) : (
                  <>Test run</>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/jobs')}
                disabled={isLoading || saving}
              >
                Cancel
              </Button>
            </div>
            {testRun.message && (
              <div
                className={
                  testRun.ok
                    ? 'rounded-md bg-green-50 text-green-900 dark:bg-green-950/30 dark:text-green-100 p-3 text-sm border border-green-200 dark:border-green-900/60'
                    : 'rounded-md bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100 p-3 text-sm border border-amber-200 dark:border-amber-900/60'
                }
              >
                {testRun.message}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobForm;
