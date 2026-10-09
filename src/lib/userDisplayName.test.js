import { getUserDisplayName } from '@/lib/userDisplayName';

describe('getUserDisplayName', () => {
  it('uses the display name saved by Neon Auth', () => {
    expect(getUserDisplayName({
      email: 'clara@example.com',
      user_metadata: { displayName: 'Clara' },
    })).toBe('Clara');
  });

  it('falls back to the email prefix when no name is set', () => {
    expect(getUserDisplayName({ email: 'clara@example.com' })).toBe('clara');
  });
});
