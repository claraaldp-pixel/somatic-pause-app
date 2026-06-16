import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/AuthContext';

vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/components/Paywall', () => ({
  default: () => <div>Paywall</div>,
}));

vi.mock('@/components/UserNotRegisteredError', () => ({
  default: () => <div>UserNotRegisteredError</div>,
}));

const baseAuth = {
  isAuthenticated: false,
  isLoadingAuth: false,
  authChecked: true,
  authError: null,
  checkUserAuth: vi.fn(),
  user: null,
  logout: vi.fn(),
};

afterEach(() => vi.clearAllMocks());

const renderRoute = (contextOverrides = {}) => {
  useAuth.mockReturnValue({ ...baseAuth, ...contextOverrides });
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<ProtectedRoute unauthenticatedElement={<div>Sign in</div>} />}>
          <Route path="/" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  it('no user: renders unauthenticatedElement', () => {
    renderRoute({ isAuthenticated: false, authError: null });
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('user with no subscription: renders Paywall', () => {
    renderRoute({
      isAuthenticated: false,
      authError: { type: 'no_subscription' },
      user: { email: 'test@example.com' },
    });
    expect(screen.getByText('Paywall')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('authenticated user: renders children via Outlet', () => {
    renderRoute({ isAuthenticated: true });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
