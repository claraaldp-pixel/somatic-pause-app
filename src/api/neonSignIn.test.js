import { signInWithEmail } from '@/api/neonSignIn';

describe('signInWithEmail', () => {
  it('signs in through the Neon Auth client', async () => {
    const authClient = {
      signIn: {
        email: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
    };

    await expect(signInWithEmail({
      authClient,
      email: 'test@example.com',
      password: 'password-123',
    })).resolves.toEqual({ user: { id: 'user-1' } });

    expect(authClient.signIn.email).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password-123',
    });
  });

  it('surfaces an incorrect-password response', async () => {
    const authClient = {
      signIn: {
        email: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Invalid email or password' },
        }),
      },
    };

    await expect(signInWithEmail({
      authClient,
      email: 'test@example.com',
      password: 'wrong-password',
    })).rejects.toThrow('Invalid email or password');
  });

  it('times out instead of leaving the form loading forever', async () => {
    const authClient = {
      signIn: { email: vi.fn(() => new Promise(() => {})) },
    };

    await expect(signInWithEmail({
      authClient,
      email: 'test@example.com',
      password: 'password-123',
      timeoutMs: 1,
    })).rejects.toThrow('Sign in is taking too long');
  });
});
