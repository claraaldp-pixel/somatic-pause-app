const REQUEST_HEADERS_TO_SKIP = new Set([
  'accept-encoding',
  'connection',
  'content-length',
  'host',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-port',
  'x-forwarded-proto',
]);

const RESPONSE_HEADERS_TO_SKIP = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'set-cookie',
  'transfer-encoding',
]);

export function rewriteSetCookie(cookie) {
  return cookie
    .split(';')
    .filter((part) => !/^\s*domain=/i.test(part))
    .join(';');
}

function getSetCookies(headers) {
  if (typeof headers.getSetCookie === 'function') return headers.getSetCookie();

  const combined = headers.get('set-cookie');
  if (!combined) return [];

  // An Expires value contains a comma, so only split where the next item looks
  // like a new cookie name.
  return combined.split(/,(?=\s*[^;,\s]+=)/);
}

function getUpstreamUrl(req) {
  const configuredUrl = process.env.NEON_AUTH_URL || process.env.VITE_NEON_AUTH_URL;
  if (!configuredUrl) throw new Error('NEON_AUTH_URL is not configured.');

  const rawPath = Array.isArray(req.query?.path)
    ? req.query.path.join('/')
    : String(req.query?.path || '');
  const safePath = rawPath
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/');
  const target = new URL(`${configuredUrl.replace(/\/$/, '')}/${safePath}`);

  for (const [key, value] of Object.entries(req.query || {})) {
    if (key === 'path' || value == null) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      target.searchParams.append(key, String(item));
    }
  }

  return target;
}

function getRequestBody(req, headers) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.body == null) return undefined;
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) return req.body;

  if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  return JSON.stringify(req.body);
}

export default async function handler(req, res) {
  try {
    const target = getUpstreamUrl(req);
    const headers = new Headers();

    for (const [name, value] of Object.entries(req.headers || {})) {
      if (REQUEST_HEADERS_TO_SKIP.has(name.toLowerCase()) || value == null) continue;
      headers.set(name, Array.isArray(value) ? value.join(', ') : String(value));
    }

    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: getRequestBody(req, headers),
      redirect: 'manual',
    });

    res.status(upstream.status);
    for (const [name, value] of upstream.headers.entries()) {
      if (!RESPONSE_HEADERS_TO_SKIP.has(name.toLowerCase())) res.setHeader(name, value);
    }

    const cookies = getSetCookies(upstream.headers).map(rewriteSetCookie);
    if (cookies.length) res.setHeader('Set-Cookie', cookies);

    const body = Buffer.from(await upstream.arrayBuffer());
    return res.send(body);
  } catch (error) {
    console.error('Neon Auth proxy error', error);
    return res.status(502).json({ error: 'Authentication service unavailable.' });
  }
}
