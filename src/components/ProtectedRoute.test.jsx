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
  it('loading: does not render protected content', () => {
    renderRoute({ isLoadingAuth: true });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('no user: renders unauthenticatedElement', () => {
    renderRoute({ authError: null });
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('user not registered: renders UserNotRegisteredError', () => {
    renderRoute({ authError: { type: 'user_not_registered' } });
    expect(screen.getByText('UserNotRegisteredError')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('user with no subscription: renders Paywall', () => {
    renderRoute({
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
