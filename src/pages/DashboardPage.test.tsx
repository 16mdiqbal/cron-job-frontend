import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useAuthStore: vi.fn(() => ({ user: { username: 'Test User', email: 'test@example.com' } })),
  getAllJobs: vi.fn().mockResolvedValue([
    {
      id: '1',
      name: 'Active with next run',
      is_active: true,
      cron_expression: '* * * * *',
      next_execution_at: '2025-01-01T01:00:00.000Z',
    },
    {
      id: '2',
      name: 'Active no next run',
      is_active: true,
      cron_expression: '* * * * *',
      next_execution_at: null,
    },
    {
      id: '3',
      name: 'Inactive',
      is_active: false,
      cron_expression: '* * * * *',
      next_execution_at: null,
    },
  ]),
  getStatistics: vi.fn().mockResolvedValue({
    total_executions: 0,
    successful_executions: 0,
    failed_executions: 0,
    running_executions: 0,
    success_rate: 0,
    average_duration_seconds: 0,
  }),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: mocks.useAuthStore,
}));

vi.mock('@/services/api/jobService', () => ({
  jobService: {
    getAllJobs: mocks.getAllJobs,
  },
}));

vi.mock('@/services/api/executionService', () => ({
  executionService: {
    getStatistics: mocks.getStatistics,
  },
}));

describe('DashboardPage', () => {
  it('renders getting started links to core pages', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2025-01-01T00:00:00.000Z').getTime());
    const DashboardPage = (await import('@/pages/DashboardPage')).default;
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mocks.getAllJobs).toHaveBeenCalled();
      expect(mocks.getStatistics).toHaveBeenCalled();
    });

    expect(screen.getByRole('link', { name: /creating your first scheduled job/i })).toHaveAttribute(
      'href',
      '/jobs/new'
    );

    expect(screen.getByRole('link', { name: /go to jobs/i })).toHaveAttribute('href', '/jobs');
    expect(screen.getByRole('link', { name: /go to executions/i })).toHaveAttribute('href', '/executions');
    expect(screen.getByRole('link', { name: /notification inbox/i })).toHaveAttribute('href', '/notifications');

    expect(screen.getByRole('link', { name: /failed executions in the last 24 hours/i })).toHaveAttribute(
      'href',
      expect.stringContaining('/executions?status=failed&from=')
    );
    expect(screen.getByRole('link', { name: /jobs with no next run scheduled/i })).toHaveAttribute(
      'href',
      '/jobs?status=active&needs=no-next-run'
    );
    expect(screen.getByRole('link', { name: /disabled jobs/i })).toHaveAttribute('href', '/jobs?status=inactive');
    vi.restoreAllMocks();
  });
});
