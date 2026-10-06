import { resetPasswordWithToken } from '@/api/neonPasswordReset';

describe('resetPasswordWithToken', () => {
  it('posts the new password and token to Neon Auth', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ status: true }),
    });

    await expect(resetPasswordWithToken({
      newPassword: 'new-password',
      token: 'reset-token',
      authUrl: 'https://auth.example.test/path/',
      fetchImpl,
    })).resolves.toEqual({ status: true });

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://auth.example.test/path/reset-password',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ newPassword: 'new-password', token: 'reset-token' }),
      }),
    );
  });

  it('surfaces an invalid or expired token response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ message: 'Invalid token' }),
    });

    await expect(resetPasswordWithToken({
      newPassword: 'new-password',
      token: 'expired-token',
      authUrl: 'https://auth.example.test',
      fetchImpl,
    })).rejects.toThrow('Invalid token');
  });
});
