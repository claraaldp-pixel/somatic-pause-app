import handler, { rewriteSetCookie } from '../../api/auth-proxy.js';

describe('Neon Auth proxy', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEON_AUTH_URL: 'https://auth.example.test/neondb/auth',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('removes an upstream cookie domain while preserving security attributes', () => {
    expect(rewriteSetCookie(
      'better-auth.session_token=value; Domain=.example.test; Path=/; HttpOnly; Secure; SameSite=Lax',
    )).toBe('better-auth.session_token=value; Path=/; HttpOnly; Secure; SameSite=Lax');
  });

  it('forwards auth requests and returns a first-party cookie', async () => {
    const responseHeaders = new Headers({
      'content-type': 'application/json',
      'set-auth-jwt': 'jwt-value',
      'set-cookie': 'better-auth.session_token=signed-value; Domain=auth.example.test; Path=/; HttpOnly; Secure; SameSite=Lax',
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      status: 200,
      headers: responseHeaders,
      arrayBuffer: vi.fn().mockResolvedValue(new TextEncoder().encode('{"ok":true}').buffer),
    });

    const req = {
      method: 'POST',
      query: { path: 'sign-in/email', return: 'session' },
      headers: { 'content-type': 'application/json', host: 'somatic.example.test' },
      body: { email: 'person@example.test', password: 'secret' },
    };
    const responseHeadersSent = {};
    const res = {
      status: vi.fn().mockReturnThis(),
      setHeader: vi.fn((name, value) => { responseHeadersSent[name] = value; }),
      send: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await handler(req, res);

    const [target, options] = globalThis.fetch.mock.calls[0];
    expect(target.toString()).toBe(
      'https://auth.example.test/neondb/auth/sign-in/email?return=session',
    );
    expect(options).toEqual(expect.objectContaining({
      method: 'POST',
      redirect: 'manual',
      body: JSON.stringify(req.body),
    }));
    expect(options.headers.has('host')).toBe(false);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(responseHeadersSent['set-auth-jwt']).toBe('jwt-value');
    expect(responseHeadersSent['Set-Cookie']).toEqual([
      'better-auth.session_token=signed-value; Path=/; HttpOnly; Secure; SameSite=Lax',
    ]);
  });
});
