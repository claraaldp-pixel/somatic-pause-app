import { createRemoteJWKSet, jwtVerify } from 'jose';

let verifierConfig;

function getVerifierConfig() {
  if (verifierConfig) return verifierConfig;

  const authUrl = process.env.NEON_AUTH_URL || process.env.VITE_NEON_AUTH_URL;
  if (!authUrl) throw new Error('NEON_AUTH_URL is not configured.');

  const baseUrl = authUrl.endsWith('/') ? authUrl : `${authUrl}/`;
  verifierConfig = {
    issuer: new URL(authUrl).origin,
    jwks: createRemoteJWKSet(new URL('jwks', baseUrl)),
  };
  return verifierConfig;
}

export async function authenticateRequest(req) {
  const authorization = req.headers.authorization;
  if (!authorization?.toLowerCase().startsWith('bearer ')) return null;

  try {
    const { issuer, jwks } = getVerifierConfig();
    const { payload } = await jwtVerify(authorization.slice(7), jwks, { issuer });
    if (!payload.sub || !payload.email) return null;
    return payload;
  } catch {
    return null;
  }
}
