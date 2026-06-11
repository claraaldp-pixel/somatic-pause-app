# Phase 1 Handoff — Public Signup + Stripe Paywall + DB Lockdown

Status as of 2026-06-11. Full plan: see the approved plan doc
(`i-would-like-to-buzzing-whisper.md`) for original scope/rationale.

## Done (code complete + DB live)

**Database (already applied to production via `supabase db push`)**
- RLS enabled on `profiles`, `check_ins`, `exercise_videos`, `whitelist`, and new `subscriptions` table.
- `has_access(check_user_id, check_email)` RPC — grants access if whitelisted OR subscription `status IN ('active','trialing')` and not expired. EXECUTE locked to `authenticated` only.
- `handle_new_user()` trigger auto-creates a `profiles` row on signup.
- Migrations live in `supabase/migrations/` (now tracked in git).

**Frontend**
- `src/lib/AuthContext.jsx` — uses `has_access` RPC; sets `authError = { type: 'no_subscription' }` when access is denied.
- `src/pages/Login.jsx` — new public signup step (`supabase.auth.signUp` + email confirmation flow).
- `src/components/Paywall.jsx` — new component, "Start free trial" → Stripe Checkout. Wired into `App.jsx` and `ProtectedRoute.jsx`.
- `src/components/somatic/Settings.jsx` — new "Subscription" card (trial/renewal date + Manage subscription button, or "complimentary access" message for grandfathered users).
- `src/components/somatic/AdminInvite.jsx` — copy updated to clarify invites grant permanent free access.

**Edge Functions (written, not yet deployed)**
- `supabase/functions/create-checkout-session/`
- `supabase/functions/stripe-webhook/` (config.toml sets `verify_jwt = false` for this one)
- `supabase/functions/create-portal-session/`

**Other**
- `.github/workflows/supabase-keepalive.yml` — ping target changed from `whitelist` table to `/rest/v1/` (works under new RLS).
- `.env.example` — documents client-side env vars.

## Remaining — manual steps for Clara

Everything below is in **`docs/stripe-setup.md`**, step by step:

1. Create a Stripe product + price (test mode) → get `price_id`.
2. Get test secret key.
3. `supabase functions deploy` the three new functions.
4. Set Supabase secrets: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_TRIAL_DAYS`.
5. Create the Stripe webhook endpoint, get signing secret, set `STRIPE_WEBHOOK_SECRET`.
6. Run the end-to-end test: signup → Paywall → Checkout (test card `4242 4242 4242 4242`) → app unlocks → Settings shows trial/portal → cancel via portal → access updates.
7. Repeat product/price/webhook setup in **live mode** before announcing publicly.

## Verification checklist (from the plan, not yet run)

- [ ] Existing whitelisted user: full app flow unaffected.
- [ ] Admin: login + ManageVideos read/write unaffected.
- [ ] New user: signup → confirm email → Paywall → Checkout (trial) → full access → Settings subscription card + portal works → cancel updates access.
- [ ] RLS spot-checks: anon/authenticated cannot read `whitelist` or other users' rows.
- [ ] Keepalive workflow succeeds (`workflow_dispatch`).

## Uncommitted changes

All of the above is implemented but **not yet committed**. Run `git status` to
review, then commit when ready (suggest a couple of logical commits: DB
migrations, edge functions + config, frontend signup/paywall/settings).

## Phase 2 (deferred)

Sentry, PostHog, CI/Vitest pipeline — separate plan once Phase 1 is live and stable.
