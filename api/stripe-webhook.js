import { getSql } from './_lib/database.js';
import { json, requirePost } from './_lib/http.js';
import { getStripe } from './_lib/stripe.js';

export const config = {
  api: { bodyParser: false },
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (!requirePost(req, res)) return;

  const signature = req.headers['stripe-signature'];
  if (!signature) return json(res, 400, { error: 'Missing Stripe signature.' });

  let event;
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured.');
    event = getStripe().webhooks.constructEvent(
      await readRawBody(req),
      signature,
      secret,
    );
  } catch (error) {
    console.error('Stripe signature verification failed', error);
    return json(res, 400, { error: 'Invalid Stripe signature.' });
  }

  try {
    if ([
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
    ].includes(event.type)) {
      const subscription = event.data.object;
      const userId = subscription.metadata?.user_id;

      if (!userId) {
        console.error('Subscription event missing metadata.user_id', subscription.id);
        return json(res, 400, { error: 'Subscription is missing its user ID.' });
      }

      const periodEndSeconds =
        subscription.items?.data?.[0]?.current_period_end
        ?? subscription.current_period_end;

      const sql = getSql();
      await sql`
        INSERT INTO public.subscriptions (
          user_id,
          stripe_customer_id,
          stripe_subscription_id,
          status,
          current_period_end,
          price_id,
          updated_at
        ) VALUES (
          ${userId}::uuid,
          ${subscription.customer},
          ${subscription.id},
          ${subscription.status},
          ${periodEndSeconds ? new Date(periodEndSeconds * 1000) : null},
          ${subscription.items?.data?.[0]?.price?.id || null},
          now()
        )
        ON CONFLICT (user_id) DO UPDATE SET
          stripe_customer_id = EXCLUDED.stripe_customer_id,
          stripe_subscription_id = EXCLUDED.stripe_subscription_id,
          status = EXCLUDED.status,
          current_period_end = EXCLUDED.current_period_end,
          price_id = EXCLUDED.price_id,
          updated_at = now()
      `;
    }

    return json(res, 200, { received: true });
  } catch (error) {
    console.error('Stripe webhook error', error);
    return json(res, 500, { error: 'Webhook processing failed.' });
  }
}
