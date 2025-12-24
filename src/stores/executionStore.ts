import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { JobExecution, PaginatedResponse } from '@/types';
import { getErrorMessage } from '@/services/utils/error';
import { executionService, type ExecutionFilters } from '@/services/api/executionService';

interface ExecutionState {
  executions: JobExecution[];
  currentExecution: JobExecution | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  filters: ExecutionFilters;

  // Actions
  loadExecutions: (params?: ExecutionFilters) => Promise<void>;
  loadExecution: (id: string) => Promise<void>;
  loadJobExecutions: (jobId: string) => Promise<void>;
  setFilters: (filters: Partial<ExecutionFilters>) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  clearError: () => void;
  clearCurrentExecution: () => void;
}

/**
 * Execution Store
 * Manages execution state and actions
 */
export const useExecutionStore = create<ExecutionState>()(
  devtools(
    (set, get) => ({
      executions: [],
      currentExecution: null,
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
      isLoading: false,
      error: null,
      filters: {
        page: 1,
        limit: 20,
      },

      /**
       * Load executions with pagination and filters
       */
      loadExecutions: async (params?: ExecutionFilters) => {
        set({ isLoading: true, error: null });
        try {
          const filters = { ...get().filters, ...params };
          const response: PaginatedResponse<JobExecution> =
            await executionService.getExecutions(filters);

          set({
            executions: response.data,
            total: response.total,
            page: response.page,
            limit: response.limit,
            totalPages: response.totalPages,
            filters,
            isLoading: false,
          });
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(error, 'Failed to load executions');
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      /**
       * Load a single execution by ID
       */
      loadExecution: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const execution = await executionService.getExecution(id);
          set({
            currentExecution: execution,
            isLoading: false,
          });
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(error, 'Failed to load execution');
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      /**
       * Load executions for a specific job
       */
      loadJobExecutions: async (jobId: string) => {
        set({ isLoading: true, error: null });
        try {
          const executions = await executionService.getJobExecutions(jobId);
          set({
            executions,
            total: executions.length,
            isLoading: false,
          });
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(error, 'Failed to load job executions');
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
      setFilters: (filters: Partial<ExecutionFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      /**
       * Set current page
       */
      setPage: (page: number) => {
        set({ page });
        get().loadExecutions({ ...get().filters, page });
      },

      /**
       * Set items per page
       */
      setLimit: (limit: number) => {
        set({ limit, page: 1 });
        get().loadExecutions({ ...get().filters, limit, page: 1 });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Clear current execution
       */
      clearCurrentExecution: () => {
        set({ currentExecution: null });
      },
    }),
    { name: 'ExecutionStore' }
  )
);

export default useExecutionStore;
