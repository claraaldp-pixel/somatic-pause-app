export const TEST_USER = { id: 'user-1', email: 'test@example.com' };

export function mockNoSession(supabase) {
  supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
  supabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
}

export function mockSessionWithAccess(supabase) {
  supabase.auth.getSession.mockResolvedValue({ data: { session: { user: TEST_USER } } });
  supabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
  supabase.rpc.mockResolvedValue({ data: true });
}

export function mockSessionNoAccess(supabase) {
  supabase.auth.getSession.mockResolvedValue({ data: { session: { user: TEST_USER } } });
  supabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
  supabase.rpc.mockResolvedValue({ data: false });
}
