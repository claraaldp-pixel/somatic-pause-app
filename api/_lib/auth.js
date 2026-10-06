import { createRemoteJWKSet, jwtVerify } from 'jose';

let verifierConfig;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getVerifierConfig() {
  if (verifierConfig) return verifierConfig;

  const authUrl = process.env.NEON_AUTH_URL || process.env.VITE_NEON_AUTH_URL;
  if (!authUrl) throw new Error('NEON_AUTH_URL is not configured.');

  const issuer = authUrl.replace(/\/$/, '');
  const baseUrl = `${issuer}/`;
  verifierConfig = {
    issuer,
    jwks: createRemoteJWKSet(new URL('.well-known/jwks.json', baseUrl)),
  };
  return verifierConfig;
}

export async function authenticateRequest(req) {
  const authorization = req.headers.authorization;
  if (!authorization?.toLowerCase().startsWith('bearer ')) return null;

  try {
    const { issuer, jwks } = getVerifierConfig();
    const { payload } = await jwtVerify(authorization.slice(7), jwks, { issuer });
    if (!payload.sub || !UUID_PATTERN.test(payload.sub)) return null;
    return payload;
  } catch {
    return null;
  }
}
