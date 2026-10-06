import { resolveBrowserAuthUrl } from '@/api/neonConfig';

describe('resolveBrowserAuthUrl', () => {
  it('uses an absolute same-origin auth URL in production', () => {
    expect(resolveBrowserAuthUrl({
      isProduction: true,
      origin: 'https://somatic-pause-app.vercel.app',
      configuredUrl: 'https://auth.example.test',
    })).toBe('https://somatic-pause-app.vercel.app/api/auth');
  });

  it('uses the configured Neon URL during local development', () => {
    expect(resolveBrowserAuthUrl({
      isProduction: false,
      origin: 'http://localhost:5173',
      configuredUrl: 'https://auth.example.test',
    })).toBe('https://auth.example.test');
  });
});
