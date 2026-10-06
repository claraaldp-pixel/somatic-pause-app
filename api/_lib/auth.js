import { createRemoteJWKSet, jwtVerify } from 'jose';

let verifierConfig;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getAcceptedIssuers(authUrl) {
  const endpoint = authUrl.replace(/\/$/, '');
  return [...new Set([endpoint, new URL(endpoint).origin])];
}

function getVerifierConfig() {
  if (verifierConfig) return verifierConfig;

  const authUrl = process.env.NEON_AUTH_URL || process.env.VITE_NEON_AUTH_URL;
  if (!authUrl) throw new Error('NEON_AUTH_URL is not configured.');

  const endpoint = authUrl.replace(/\/$/, '');
  const baseUrl = `${endpoint}/`;
  verifierConfig = {
    // Neon currently uses the Auth endpoint for anonymous tokens and the Auth
    // host origin for signed-in user tokens. Both are verified by the same
    // branch JWKS and must remain explicitly allow-listed.
    issuer: getAcceptedIssuers(endpoint),
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
