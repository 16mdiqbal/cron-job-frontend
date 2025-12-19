import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import { QuickActionsMenu } from './QuickActionsMenu';

const mocks = vi.hoisted(() => ({
  getAllJobs: vi.fn(),
  executeJob: vi.fn(),
}));

vi.mock('@/services/api/jobService', () => ({
  jobService: {
    getAllJobs: mocks.getAllJobs,
    executeJob: mocks.executeJob,
  },
}));

describe('QuickActionsMenu', () => {
  beforeEach(() => {
    mocks.getAllJobs.mockReset();
    mocks.executeJob.mockReset();
  });

  it('renders quick action links for create job and view failures', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="*" element={<QuickActionsMenu />} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByLabelText(/quick actions/i));
    const create = screen.getByRole('menuitem', { name: /create job/i });
    const failures = screen.getByRole('menuitem', { name: /view failures/i });

    expect(create).toHaveAttribute('href', '/jobs/new');
    expect(failures).toHaveAttribute('href', '/executions?status=failed');
  });

  it('opens run job flow via picker', async () => {
    mocks.getAllJobs.mockResolvedValue([
      {
        id: '1',
        name: 'Active Job',
        is_active: true,
        cron_expression: '* * * * *',
        created_at: new Date(0).toISOString(),
        updated_at: new Date(0).toISOString(),
        next_execution_at: new Date(Date.now() + 60_000).toISOString(),
      },
    ]);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="*" element={<QuickActionsMenu />} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByLabelText(/quick actions/i));
    await user.click(screen.getByRole('menuitem', { name: /^run job$/i }));

    expect(screen.getByRole('heading', { name: /^run job$/i })).toBeInTheDocument();

    await waitFor(() => expect(mocks.getAllJobs).toHaveBeenCalled());
    await user.type(screen.getByRole('textbox', { name: /search jobs/i }), 'active');
    await user.click(screen.getByRole('button', { name: 'Active Job' }));
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveValue('1'));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(await screen.findByText(/run job now/i)).toBeInTheDocument();
  });
});
