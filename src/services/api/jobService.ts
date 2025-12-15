import { client } from './client';
import type { Job, PaginatedResponse, PaginationParams } from '@/types';

const getRepoType = (githubRepo?: string): 'api' | 'mobile' | 'web' | null => {
  const repo = githubRepo?.toLowerCase();
  if (!repo) return null;
  if (repo === 'api' || repo === 'web' || repo === 'mobile') return repo;
  if (repo.includes('api')) return 'api';
  if (repo.includes('web')) return 'web';
  if (repo.includes('mobile')) return 'mobile';
  return null;
};

export interface CreateJobRequest {
  name: string;
  cron_expression: string;
  target_url?: string;
  github_owner?: string;
  github_repo?: string;
  github_workflow_name?: string;
  metadata?: Record<string, any>;
  enable_email_notifications?: boolean;
  notification_emails?: string[];
  notify_on_success?: boolean;
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {
  id: number;
}

export interface JobFilters extends PaginationParams {
  search?: string;
  is_active?: boolean;
  github_repo?: 'api' | 'mobile' | 'web';
}

export type ExecuteJobOverrides = {
  metadata?: Record<string, any>;
  target_url?: string;
  github_owner?: string;
  github_repo?: string;
  github_workflow_name?: string;
  github_token?: string;
  dispatch_url?: string;
};

export type BulkUploadJobsResult = {
  message: string;
  dry_run: boolean;
  stats: {
    original_column_count: number;
    original_row_count: number;
    removed_column_count: number;
    removed_empty_row_count: number;
  };
  created_count: number;
  error_count: number;
  errors: Array<{ row?: number; job_name?: string; error: string; message?: string }>;
  jobs: Array<{ id?: string; name: string; is_active?: boolean; cron_expression?: string }>;
};

/**
 * Job Service
 * Handles all job-related API calls
 */
export const jobService = {
  /**
   * Get all jobs with pagination and filters
   */
  async getJobs(params?: JobFilters): Promise<PaginatedResponse<Job>> {
    const { data } = await client.get('/jobs');
    
    // Backend returns { count, jobs }, transform to PaginatedResponse
    const jobs = data.jobs || [];
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    
    // Apply client-side filtering if needed
    let filteredJobs = jobs;
    
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filteredJobs = filteredJobs.filter((job: Job) => 
        job.name.toLowerCase().includes(searchLower) ||
        job.target_url?.toLowerCase().includes(searchLower)
      );
    }
    
    if (params?.is_active !== undefined) {
      filteredJobs = filteredJobs.filter((job: Job) => job.is_active === params.is_active);
    }
    
    if (params?.github_repo) {
      filteredJobs = filteredJobs.filter((job: Job) => getRepoType(job.github_repo) === params.github_repo);
    }
    
    // Apply client-side pagination
    const total = filteredJobs.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedJobs = filteredJobs.slice(startIndex, endIndex);
    
    return {
      data: paginatedJobs,
      total,
      page,
      limit,
      totalPages,
    };
  },

  /**
   * Get a single job by ID
   */
  async getJob(id: string): Promise<Job> {
    const { data } = await client.get(`/jobs/${id}`);
    // Backend returns { job: {...} }, extract the job
    return data.job || data;
  },

  /**
   * Get all jobs (no pagination) for exporting.
   */
  async getAllJobs(): Promise<Job[]> {
    const { data } = await client.get('/jobs');
    return data.jobs || [];
  },

  /**
   * Create a new job
   */
  async createJob(job: CreateJobRequest): Promise<Job> {
    const { data } = await client.post('/jobs', job);
    return data;
  },

  /**
   * Update an existing job
   */
  async updateJob(id: string, job: Partial<CreateJobRequest>): Promise<Job> {
    const { data } = await client.put(`/jobs/${id}`, job);
    // Backend returns { message, job }
    return data.job || data;
  },

  /**
   * Delete a job
   */
  async deleteJob(id: string): Promise<void> {
    await client.delete(`/jobs/${id}`);
  },

  /**
   * Toggle job active status
   */
  async toggleJobStatus(id: string, is_active: boolean): Promise<Job> {
    const { data } = await client.put(`/jobs/${id}`, { is_active });
    // Backend returns { message, job }
    return data.job || data;
  },

  /**
   * Execute a job immediately
   */
  async executeJob(id: string, overrides?: ExecuteJobOverrides): Promise<void> {
    await client.post(`/jobs/${id}/execute`, overrides || {});
  },

  /**
   * Validate cron expression
   */
  async validateCronExpression(
    expression: string
  ): Promise<{ valid: boolean; description?: string; error?: string }> {
    const { data } = await client.post('/jobs/validate-cron', { expression });
    return data;
  },

  /**
   * Get cron expression description
   */
  async getCronDescription(expression: string): Promise<string> {
    const { data } = await client.post('/jobs/cron-description', { expression });
    return data.description || '';
  },

  /**
   * Bulk upload jobs via CSV (multipart/form-data)
   */
  async bulkUploadJobsCsv(formData: FormData): Promise<BulkUploadJobsResult> {
    const { data } = await client.post('/jobs/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

export default jobService;
