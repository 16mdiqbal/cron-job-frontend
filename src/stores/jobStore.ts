import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Job, PaginatedResponse } from '@/types';
import {
  jobService,
  type BulkUploadJobsResult,
  type CreateJobRequest,
  type ExecuteJobOverrides,
  type JobFilters,
} from '@/services/api/jobService';

interface JobState {
  jobs: Job[];
  currentJob: Job | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  filters: JobFilters;

  // Actions
  loadJobs: (params?: JobFilters) => Promise<void>;
  loadJob: (id: string) => Promise<void>;
  createJob: (job: CreateJobRequest) => Promise<Job>;
  updateJob: (id: string, job: Partial<CreateJobRequest>) => Promise<Job>;
  deleteJob: (id: string) => Promise<void>;
  toggleJobStatus: (id: string, is_active: boolean) => Promise<void>;
  executeJob: (id: string, overrides?: ExecuteJobOverrides) => Promise<void>;
  bulkUploadJobsCsv: (formData: FormData) => Promise<BulkUploadJobsResult>;
  setFilters: (filters: Partial<JobFilters>) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  clearError: () => void;
  clearCurrentJob: () => void;
}

/**
 * Job Store
 * Manages job state and actions
 */
export const useJobStore = create<JobState>()(
  devtools(
    (set, get) => ({
      jobs: [],
      currentJob: null,
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      isLoading: false,
      error: null,
      filters: {
        page: 1,
        limit: 10,
      },

      /**
       * Load jobs with pagination and filters
       */
      loadJobs: async (params?: JobFilters) => {
        set({ isLoading: true, error: null });
        try {
          const filters = { ...get().filters, ...params };
          const response: PaginatedResponse<Job> = await jobService.getJobs(filters);

          set({
            jobs: response.data,
            total: response.total,
            page: response.page,
            limit: response.limit,
            totalPages: response.totalPages,
            filters,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMessage =
            error?.response?.data?.message || error?.message || 'Failed to load jobs';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      /**
       * Load a single job by ID
       */
      loadJob: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const job = await jobService.getJob(id);
          set({
            currentJob: job,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMessage =
            error?.response?.data?.message || error?.message || 'Failed to load job';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      /**
       * Create a new job
       */
      createJob: async (job: CreateJobRequest) => {
        set({ isLoading: true, error: null });
        try {
          const newJob = await jobService.createJob(job);

          // Reload jobs to get updated list
          await get().loadJobs(get().filters);

          set({ isLoading: false });
          return newJob;
        } catch (error: any) {
          const errorMessage =
            error?.response?.data?.message || error?.message || 'Failed to create job';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      /**
       * Update an existing job
       */
      updateJob: async (id: string, job: Partial<CreateJobRequest>) => {
        set({ isLoading: true, error: null });
        try {
          const updatedJob = await jobService.updateJob(id, job);

          // Update job in list
          set((state) => ({
            jobs: state.jobs.map((j) => (j.id === id ? updatedJob : j)),
            currentJob: state.currentJob?.id === id ? updatedJob : state.currentJob,
            isLoading: false,
          }));

          return updatedJob;
        } catch (error: any) {
          const errorMessage =
            error?.response?.data?.message || error?.message || 'Failed to update job';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      /**
       * Delete a job
       */
      deleteJob: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await jobService.deleteJob(id);

          // Remove job from list
          set((state) => ({
            jobs: state.jobs.filter((j) => j.id !== id),
            currentJob: state.currentJob?.id === id ? null : state.currentJob,
            total: state.total - 1,
            isLoading: false,
          }));
        } catch (error: any) {
          const errorMessage =
            error?.response?.data?.message || error?.message || 'Failed to delete job';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      /**
       * Toggle job active status
       */
      toggleJobStatus: async (id: string, is_active: boolean) => {
        set({ isLoading: true, error: null });
        try {
          const updatedJob = await jobService.toggleJobStatus(id, is_active);

          // Update job in list
          set((state) => ({
            jobs: state.jobs.map((j) => (j.id === id ? updatedJob : j)),
            currentJob: state.currentJob?.id === id ? updatedJob : state.currentJob,
            isLoading: false,
          }));
        } catch (error: any) {
          const errorMessage =
            error?.response?.data?.message || error?.message || 'Failed to toggle job status';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      /**
       * Execute a job immediately
       */
      executeJob: async (id: string, overrides?: ExecuteJobOverrides) => {
        set({ isLoading: true, error: null });
        try {
          await jobService.executeJob(id, overrides);
          set({ isLoading: false });
        } catch (error: any) {
          const errorMessage =
            error?.response?.data?.message || error?.message || 'Failed to execute job';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      /**
       * Bulk upload jobs from a normalized CSV (multipart/form-data).
       */
      bulkUploadJobsCsv: async (formData: FormData) => {
        set({ isLoading: true, error: null });
        try {
          const result = await jobService.bulkUploadJobsCsv(formData);
          await get().loadJobs({ ...get().filters, page: 1 });
          set({ isLoading: false });
          return result;
        } catch (error: any) {
          const errorMessage =
            error?.response?.data?.message || error?.message || 'Failed to bulk upload jobs';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      /**
       * Set filters
       */
      setFilters: (filters: Partial<JobFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      /**
       * Set current page
       */
      setPage: (page: number) => {
        set({ page });
        get().loadJobs({ ...get().filters, page });
      },

      /**
       * Set items per page
       */
      setLimit: (limit: number) => {
        set({ limit, page: 1 });
        get().loadJobs({ ...get().filters, limit, page: 1 });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Clear current job
       */
      clearCurrentJob: () => {
        set({ currentJob: null });
      },
    }),
    { name: 'JobStore' }
  )
);

export default useJobStore;
