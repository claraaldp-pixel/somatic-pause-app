const configuredAuthUrl = import.meta.env.VITE_NEON_AUTH_URL;

// In production, send auth requests through Vercel so Neon Auth's HTTP-only
// session cookie is first-party to the app and survives a page reload.
export const browserAuthUrl = import.meta.env.PROD
  ? '/api/auth'
  : configuredAuthUrl;

export { configuredAuthUrl };
