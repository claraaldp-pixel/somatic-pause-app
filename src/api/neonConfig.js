const configuredAuthUrl = import.meta.env.VITE_NEON_AUTH_URL;
const appOrigin = typeof window === 'undefined' ? '' : window.location.origin;

export function resolveBrowserAuthUrl({ isProduction, origin, configuredUrl }) {
  if (!isProduction || !origin) return configuredUrl;
  return `${origin.replace(/\/$/, '')}/api/auth`;
}

// In production, send auth requests through Vercel so Neon Auth's HTTP-only
// session cookie is first-party to the app and survives a page reload.
export const browserAuthUrl = resolveBrowserAuthUrl({
  isProduction: import.meta.env.PROD,
  origin: appOrigin,
  configuredUrl: configuredAuthUrl,
});

export { configuredAuthUrl };
