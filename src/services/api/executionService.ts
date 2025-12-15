import { client } from './client';
import type { JobExecution, PaginatedResponse, PaginationParams } from '@/types';

export interface ExecutionFilters extends PaginationParams {
  job_id?: string;
  status?: 'success' | 'failed' | 'running';
  trigger_type?: 'scheduled' | 'manual';
  execution_type?: 'github_actions' | 'webhook';
}

export interface ExecutionStatistics {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  running_executions: number;
  success_rate: number;
  average_duration_seconds: number;
}

/**
 * Execution Service
 * Handles all execution-related API calls
 */
export const executionService = {
  /**
   * Get all executions with pagination and filters
   */
  async getExecutions(params?: ExecutionFilters): Promise<PaginatedResponse<JobExecution>> {
    const { data } = await client.get('/executions', { params });
    
    return {
      data: data.executions || [],
      total: data.total || 0,
      page: data.page || 1,
      limit: data.limit || 20,
      totalPages: data.total_pages || 0,
    };
  },

  /**
   * Get a single execution by ID
   */
  async getExecution(id: string): Promise<JobExecution> {
    const { data } = await client.get(`/executions/${id}`);
    return data.execution || data;
  },

  /**
   * Get execution history for a specific job
   */
  async getJobExecutions(jobId: string, params?: { status?: string; limit?: number }): Promise<JobExecution[]> {
    const { data } = await client.get(`/jobs/${jobId}/executions`, { params });
    return data.executions || [];
  },

  /**
   * Get execution statistics
   */
  async getStatistics(jobId?: string): Promise<ExecutionStatistics> {
    const params = jobId ? { job_id: jobId } : undefined;
    const { data } = await client.get('/executions/statistics', { params });
    return data;
  },
};

export default executionService;
