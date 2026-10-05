import { authenticateRequest } from './_lib/auth.js';
import { getSql } from './_lib/database.js';
import { json, requirePost } from './_lib/http.js';
import { getStripe } from './_lib/stripe.js';

export default async function handler(req, res) {
  if (!requirePost(req, res)) return;

  try {
    const user = await authenticateRequest(req);
    if (!user) return json(res, 401, { error: 'Unauthorized.' });

    const sql = getSql();
    const [subscription] = await sql`
      SELECT stripe_customer_id
      FROM public.subscriptions
      WHERE user_id = ${user.sub}::uuid
    `;

    if (!subscription?.stripe_customer_id) {
      return json(res, 404, { error: 'No subscription found for this account.' });
    }

    const appUrl = process.env.APP_URL;
    if (!appUrl) throw new Error('APP_URL is not configured.');

    const portal = await getStripe().billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: appUrl,
    });

    return json(res, 200, { url: portal.url });
  } catch (error) {
    console.error('Billing portal error', error);
    return json(res, 500, { error: 'Unable to open the billing portal.' });
  }
}
