import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { mockNoSession, mockSessionWithAccess, mockSessionNoAccess } from '@/test/mocks/supabase';

vi.mock('@/api/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    rpc: vi.fn(),
  },
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
