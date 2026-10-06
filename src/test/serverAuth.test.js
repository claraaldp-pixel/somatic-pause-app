import { getAcceptedIssuers } from '../../api/_lib/auth.js';

describe('server auth issuer configuration', () => {
  it('accepts Neon user-session and endpoint issuer formats', () => {
    expect(getAcceptedIssuers(
      'https://branch.neonauth.example/neondb/auth/',
    )).toEqual([
      'https://branch.neonauth.example/neondb/auth',
      'https://branch.neonauth.example',
    ]);
  });

  it('does not duplicate the issuer when the auth URL is already an origin', () => {
    expect(getAcceptedIssuers('https://auth.example.test')).toEqual([
      'https://auth.example.test',
    ]);
  });
});
