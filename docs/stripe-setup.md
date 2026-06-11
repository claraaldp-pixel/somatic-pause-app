# Stripe Setup (Phase 1 — Subscriptions & Paywall)

Manual steps for Clara to wire up Stripe. Do this in **test mode** first, verify the
whole flow end-to-end, then repeat the relevant steps in **live mode** before going
fully public.

## 1. Create the product & price

1. Stripe Dashboard → **Product catalog** → **Add product**.
2. Name it (e.g. "Somatic Pause Subscription"), add a recurring **Price**
   (monthly or annual — your call on amount/interval).
3. Save, then copy the **Price ID** (starts with `price_...`). You'll need this
   as `STRIPE_PRICE_ID`.

## 2. Get your test secret key

Dashboard → **Developers → API keys** (make sure you're in **test mode**,
toggle top-right). Copy the **Secret key** (`sk_test_...`). You'll need this as
`STRIPE_SECRET_KEY`.

## 3. Deploy the new Edge Functions

From the project root:

```bash
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
supabase functions deploy stripe-webhook
```

`stripe-webhook` is configured in `supabase/config.toml` to skip JWT
verification (Stripe calls it directly), so the deploy should pick that up
automatically.

## 4. Set Supabase secrets

These are server-side only — never put them in `.env` or the client bundle.

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_PRICE_ID=price_...
supabase secrets set STRIPE_TRIAL_DAYS=7
```

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_URL`, and `ADMIN_EMAIL`
should already be set (used by `invite-user`) — no change needed there.

`STRIPE_WEBHOOK_SECRET` comes from step 5 below; set it once you have it.

## 5. Create the webhook endpoint

1. Dashboard → **Developers → Webhooks** → **Add endpoint**.
2. Endpoint URL:
   `https://boroyqbmziylvjdeaook.supabase.co/functions/v1/stripe-webhook`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Save, then open the endpoint and reveal the **Signing secret**
   (`whsec_...`). Set it:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

## 6. Test the flow end-to-end (test mode)

1. Sign up a fresh test account in the app → you should land on the **Paywall**.
2. Click **Start free trial** → you're redirected to Stripe Checkout.
3. Use test card `4242 4242 4242 4242`, any future expiry, any CVC.
4. After checkout, you're redirected back to the app → the webhook should fire
   → a row appears in `subscriptions` with `status = 'trialing'` → the app
   unlocks.
5. In **Settings**, the new "Subscription" card should show the trial end date
   and a **Manage subscription** button → it should open the Stripe Billing
   Portal.
6. In the Billing Portal, cancel the subscription → confirm the
   `subscriptions` row updates (`status` changes) after the
   `customer.subscription.updated`/`deleted` webhook fires, and that the app
   re-locks accordingly (you may need to refresh / re-trigger `has_access`).

You can also use the Stripe CLI to forward webhooks to a local function and
trigger test events:

```bash
stripe listen --forward-to https://boroyqbmziylvjdeaook.supabase.co/functions/v1/stripe-webhook
stripe trigger customer.subscription.created
```

## 7. Go live

Once test mode is verified end-to-end:

1. Repeat steps 1–2 in **live mode** to get a live Price ID and live secret key.
2. Repeat step 5 to create a **live mode** webhook endpoint and signing secret.
3. Update the Supabase secrets with the live values:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_PRICE_ID=price_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

4. Re-deploy the three functions if you changed any code since the test run.
