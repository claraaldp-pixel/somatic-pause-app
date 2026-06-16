import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { mockNoSession, mockSessionWithAccess, mockSessionNoAccess, TEST_USER } from '@/test/mocks/supabase';
import * as Sentry from '@sentry/react';

vi.mock('@/api/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

vi.mock('@sentry/react', () => ({
  setUser: vi.fn(),
}));

function AuthConsumer() {
  const { user, isAuthenticated, authError, authChecked } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.email : 'null'}</span>
      <span data-testid="isAuthenticated">{String(isAuthenticated)}</span>
      <span data-testid="authError">{authError ? authError.type : 'null'}</span>
      <span data-testid="authChecked">{String(authChecked)}</span>
    </div>
  );
}

const renderAuth = () => render(<AuthProvider><AuthConsumer /></AuthProvider>);

afterEach(() => vi.clearAllMocks());

describe('AuthContext', () => {
  it('no session: user is null, isAuthenticated is false', async () => {
    mockNoSession(supabase);
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('authChecked')).toHaveTextContent('true'));
    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('authError')).toHaveTextContent('null');
  });

  it('session + has_access true: isAuthenticated is true, authError is null', async () => {
    mockSessionWithAccess(supabase);
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true'));
    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    expect(screen.getByTestId('authError')).toHaveTextContent('null');
  });

  it('session + has_access false: isAuthenticated is false, authError is no_subscription', async () => {
    mockSessionNoAccess(supabase);
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('authChecked')).toHaveTextContent('true'));
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('authError')).toHaveTextContent('no_subscription');
  });
});

describe('Sentry user context', () => {
  it('sets Sentry user id when access is granted', async () => {
    mockSessionWithAccess(supabase);
    renderAuth();
    await waitFor(() =>
      expect(Sentry.setUser).toHaveBeenCalledWith({ id: TEST_USER.id })
    );
  });

  it('sets Sentry user id when access is denied (no_subscription)', async () => {
    mockSessionNoAccess(supabase);
    renderAuth();
    await waitFor(() =>
      expect(Sentry.setUser).toHaveBeenCalledWith({ id: TEST_USER.id })
    );
  });

  it('clears Sentry user on sign-out', async () => {
    let authCallback;
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    supabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authCallback = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    renderAuth();
    await waitFor(() =>
      expect(screen.getByTestId('authChecked')).toHaveTextContent('true')
    );

    act(() => authCallback('SIGNED_OUT', null));
    await waitFor(() => expect(Sentry.setUser).toHaveBeenCalledWith(null));
  });
});
