import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useAuthStore: vi.fn(() => ({ isAuthenticated: true })),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: mocks.useAuthStore,
}));

describe('Login redirect', () => {
  it('redirects to stored post-login path when authenticated', async () => {
    sessionStorage.setItem('postLoginRedirect', '/jobs?status=active');
    const LoginPage = (await import('@/pages/LoginPage')).default;

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/jobs" element={<div>Jobs</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Jobs')).toBeInTheDocument();
    });
  });
});
