import { useEffect, useState } from 'react';
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
import type { CreateJobRequest } from '@/services/api/jobService';

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
}

export const JobForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { currentJob, isLoading, createJob, updateJob, loadJob, clearCurrentJob } = useJobStore();
  const { fetchUnreadCount, fetchNotifications } = useNotificationStore();
  const isEditMode = !!id;
  const [metadata, setMetadata] = useState<MetadataField[]>([{ key: '', value: '' }]);
  const [metadataError, setMetadataError] = useState<string>('');

  const {
    register,
    handleSubmit,
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
    },
  });

  const github_repo = watch('github_repo');

  useEffect(() => {
    // Only load job if we're in edit mode AND have a valid id
    if (id) {
      loadJob(id);
    }
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
    const validPairs = metadata.filter(m => m.key.trim() && m.value.trim());
    if (validPairs.length === 0) {
      setMetadataError('At least one metadata key-value pair is required');
      return false;
    }

    // Check for duplicate keys
    const keys = validPairs.map(m => m.key.trim());
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

      // Build metadata object from fields
      const metadataObj: Record<string, string> = {};
      metadata.forEach(m => {
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
        metadata: metadataObj,
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
      await new Promise(resolve => setTimeout(resolve, 300));
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
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={() => navigate('/jobs')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>
        <h1 className="text-3xl font-bold">{isEditMode ? 'Edit Job' : 'Create New Job'}</h1>
        <p className="text-muted-foreground">
          {isEditMode ? 'Update your scheduled job' : 'Create a new scheduled cron job'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>Configure your cron job settings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Job Configuration</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Job Name *</Label>
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
                <Label htmlFor="cron_expression">Cron Expression *</Label>
                <Input
                  id="cron_expression"
                  placeholder="*/5 * * * *"
                  error={errors.cron_expression?.message}
                  {...register('cron_expression', {
                    required: 'Cron expression is required',
                    validate: (value) => {
                      // Basic validation - just check it has 5 parts separated by spaces
                      const parts = value.trim().split(/\s+/);
                      if (parts.length !== 5) {
                        return 'Cron expression must have exactly 5 fields';
                      }
                      return true;
                    },
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  Format: minute hour day month day-of-week (e.g., */5 * * * * = every 5 minutes)
                </p>
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
                <Label htmlFor="github_owner">GitHub Owner *</Label>
                <Input
                  id="github_owner"
                  placeholder="e.g., myorganization"
                  error={errors.github_owner?.message}
                  {...register('github_owner', {
                    required: 'GitHub owner is required',
                    minLength: { value: 1, message: 'GitHub owner cannot be empty' },
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  GitHub organization or username
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="github_repo">Repository *</Label>
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
                <p className="text-sm text-muted-foreground">
                  Select the repository for this job
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="github_workflow_name">Workflow Name *</Label>
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
                <h3 className="text-lg font-medium">Metadata *</h3>
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

              {metadataError && (
                <p className="text-sm text-destructive">{metadataError}</p>
              )}

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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>{isEditMode ? 'Update Job' : 'Create Job'}</>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/jobs')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobForm;
