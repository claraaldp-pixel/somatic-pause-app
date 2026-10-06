import { authenticateRequest } from './_lib/auth.js';
import { getSql } from './_lib/database.js';
import { json, requirePost } from './_lib/http.js';

export default async function handler(req, res) {
  if (!requirePost(req, res)) return;

  try {
    const tokenUser = await authenticateRequest(req);
    if (!tokenUser) return json(res, 401, { error: 'Unauthorized.' });

    const sql = getSql();
    const [account] = await sql`
      SELECT
        COALESCE(app_user.banned, false) = false
        AND (
          EXISTS (
            SELECT 1
            FROM public.whitelist AS allowed
            WHERE lower(allowed.email) = lower(app_user.email)
          )
          OR EXISTS (
            SELECT 1
            FROM public.subscriptions AS subscription
            WHERE subscription.user_id = app_user.id
              AND subscription.status IN ('active', 'trialing')
              AND (
                subscription.current_period_end IS NULL
                OR subscription.current_period_end > now()
              )
          )
        ) AS has_access
      FROM neon_auth."user" AS app_user
      WHERE app_user.id = ${tokenUser.sub}::uuid
    `;

    if (!account) return json(res, 401, { error: 'Unauthorized.' });
    return json(res, 200, { hasAccess: account.has_access });
  } catch (error) {
    console.error('Access check error', error);
    return json(res, 500, { error: 'Unable to verify account access.' });
  }
}
