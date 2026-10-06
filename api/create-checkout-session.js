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
    const stripe = getStripe();
    const [account] = await sql`
      SELECT email
      FROM neon_auth."user"
      WHERE id = ${user.sub}::uuid
        AND COALESCE(banned, false) = false
    `;
    if (!account) return json(res, 401, { error: 'Unauthorized.' });

    const [existingSubscription] = await sql`
      SELECT stripe_customer_id
      FROM public.subscriptions
      WHERE user_id = ${user.sub}::uuid
    `;

    let customerId = existingSubscription?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: account.email,
        metadata: { user_id: user.sub },
      });
      customerId = customer.id;

      await sql`
        INSERT INTO public.subscriptions (user_id, stripe_customer_id)
        VALUES (${user.sub}::uuid, ${customerId})
        ON CONFLICT (user_id) DO UPDATE
        SET stripe_customer_id = EXCLUDED.stripe_customer_id,
            updated_at = now()
      `;
    }

    const appUrl = process.env.APP_URL;
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!appUrl || !priceId) {
      throw new Error('APP_URL or STRIPE_PRICE_ID is not configured.');
    }

    const trialDays = Number(process.env.STRIPE_TRIAL_DAYS || '7');
    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.sub,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: trialDays,
        metadata: { user_id: user.sub },
      },
      success_url: `${appUrl}/?checkout=success`,
      cancel_url: `${appUrl}/?checkout=cancel`,
    });

    return json(res, 200, { url: checkout.url });
  } catch (error) {
    console.error('Checkout session error', error);
    return json(res, 500, { error: 'Unable to start checkout.' });
  }
}
