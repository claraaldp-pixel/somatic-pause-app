import { vi } from 'vitest';

export const TEST_USER = { id: 'user-1', email: 'test@example.com' };
export const TEST_SESSION = { user: TEST_USER, access_token: 'test-access-token' };

export function mockNoSession(supabase) {
  supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
  supabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
}

export function mockSessionWithAccess(supabase) {
  supabase.auth.getSession.mockResolvedValue({ data: { session: TEST_SESSION } });
  supabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
  globalThis.fetch.mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({ hasAccess: true }),
  });
}

export function mockSessionNoAccess(supabase) {
  supabase.auth.getSession.mockResolvedValue({ data: { session: TEST_SESSION } });
  supabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
  globalThis.fetch.mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({ hasAccess: false }),
  });
}
