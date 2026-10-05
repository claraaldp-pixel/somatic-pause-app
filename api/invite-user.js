import { authenticateRequest } from './_lib/auth.js';
import { getSql } from './_lib/database.js';
import { json, requirePost } from './_lib/http.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (!requirePost(req, res)) return;

  try {
    const caller = await authenticateRequest(req);
    if (!caller) return json(res, 401, { error: 'Unauthorized.' });

    const sql = getSql();
    const [admin] = await sql`
      SELECT id
      FROM neon_auth."user"
      WHERE id = ${caller.sub}::uuid
        AND role = 'admin'
        AND COALESCE(banned, false) = false
    `;
    if (!admin) return json(res, 403, { error: 'Only an admin can invite users.' });

    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      return json(res, 400, { error: 'Enter a valid email address.' });
    }

    const name = email.split('@')[0];
    await sql.transaction([
      sql`
        INSERT INTO neon_auth."user" (
          name,
          email,
          "emailVerified",
          "updatedAt",
          role,
          banned
        ) VALUES (${name}, ${email}, true, now(), 'user', false)
        ON CONFLICT (email) DO NOTHING
      `,
      sql`
        INSERT INTO public.whitelist (email)
        VALUES (${email})
        ON CONFLICT (lower(email)) DO UPDATE SET email = EXCLUDED.email
      `,
    ]);

    const appUrl = process.env.APP_URL;
    const authUrl = process.env.NEON_AUTH_URL || process.env.VITE_NEON_AUTH_URL;
    if (!appUrl || !authUrl) throw new Error('APP_URL or NEON_AUTH_URL is not configured.');

    const resetResponse = await fetch(`${authUrl.replace(/\/$/, '')}/request-password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: appUrl,
      },
      body: JSON.stringify({ email, redirectTo: appUrl }),
    });

    if (!resetResponse.ok) {
      const message = await resetResponse.text();
      console.error('Neon invitation email failed', resetResponse.status, message);
      return json(res, 502, {
        error: 'Access was granted, but the invitation email could not be sent.',
      });
    }

    return json(res, 200, { success: true });
  } catch (error) {
    console.error('Invite user error', error);
    return json(res, 500, { error: 'Unable to invite this user.' });
  }
}
