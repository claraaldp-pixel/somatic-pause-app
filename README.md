# Somatic Pause App

**A guided nervous-system regulation app — check in with your body, find your survival state, and practice your way back to regulated.**

🔗 **Live:** https://somatic-pause-app.vercel.app/

Instead of guessing what you need, users select the physical/emotional symptoms they're noticing right now. The app maps those to a survival state — fight, flight, freeze, shutdown (fawn), or ventral/safe — and walks them through a short sequence of somatic practices (breathwork, movement, grounding) matched to that state, then logs how it went.

## What it does

- **Symptom-based check-in** — pick from categorized symptoms rather than naming a state outright; the app scores selections against fight/flight/freeze/fawn and surfaces a primary (and, if close, secondary) state. Framed explicitly as *"not a diagnosis — just a compassionate map of where you are right now."*
- **A guided practice sequence** — exercises for the identified state are grouped into ordered steps (e.g. breathwork → movement → grounding); each step unlocks after completing at least one exercise from the step before it. Practices render as a breathing timer with phase-by-phase guidance, a video, an audio player, an image, or a written step list, depending on the exercise.
- **Before/after regulation score** — a 1–10 slider before starting and again at the end, plus an optional reflection note, saved as a check-in.
- **Quick start** — jump straight into a state's exercises from the welcome screen, skipping the check-in.
- **History & pattern insights** — past check-ins and trends over time (`CheckInHistory`, `PatternInsights`).
- **Favourites** — like individual exercises to relaunch them directly later (`Favourites`).
- **Subscription management** — trial/renewal info and a "Manage subscription" link to the Stripe Customer Portal, or a complimentary-access message for whitelisted users (`Settings`).
- **Admin invites** — an admin (set via `VITE_ADMIN_EMAIL`) can invite people by email; this whitelists them and sends a Supabase auth invite (`AdminInvite`, backed by the `invite-user` Edge Function). Admins also manage the exercise video library (`ManageVideos`).

## How it works

- **Frontend** — React 18 + Vite talks directly to Supabase (Postgres, Auth, RLS) for check-ins, exercises, and profile data.
- **Access control** — a `has_access()` Postgres RPC grants access if a user is whitelisted (complimentary access) or has an active/trialing subscription. Row-level security is enabled on `profiles`, `check_ins`, `exercise_videos`, `whitelist`, and `subscriptions`. See [`docs/phase1-handoff.md`](docs/phase1-handoff.md) for the implementation notes.
- **Payments** — Stripe Checkout (trial signup) and the Stripe Customer Portal, via three Supabase Edge Functions: `create-checkout-session`, `stripe-webhook`, `create-portal-session`.
- **Monitoring** — Sentry (error tracking) and PostHog (product analytics: session started/completed, paywall/checkout events) are wired in at the app root and are optional locally (no-op if their env vars aren't set).

## Tech stack

- **Frontend**: React 18, Vite, Tailwind CSS, Radix UI, Framer Motion
- **Backend**: Supabase (Postgres + RLS, Auth, Edge Functions)
- **Payments**: Stripe Checkout + Customer Portal, via Supabase Edge Functions
- **Monitoring**: Sentry, PostHog
- **Testing**: Vitest + Testing Library

## Local development

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL/key, see below
npm run dev
```

### Environment variables

Documented in [`.env.example`](.env.example):

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `VITE_ADMIN_EMAIL` | Email address granted admin access (video management, invites) |
| `VITE_STRIPE_TRIAL_DAYS` | Free trial length shown on the paywall (should match the `STRIPE_TRIAL_DAYS` Edge Function secret) |

Used in the code but **not yet listed** in `.env.example` — both optional for local dev, the app runs fine without them:

| Variable | Description |
|---|---|
| `VITE_SENTRY_DSN` | Sentry DSN for error tracking |
| `VITE_POSTHOG_KEY` | PostHog project key for analytics |

### Stripe setup

Subscriptions run through Stripe Checkout + the Customer Portal via Supabase Edge Functions. Full step-by-step setup (product/price creation, Edge Function deploy, webhook config) is in [`docs/stripe-setup.md`](docs/stripe-setup.md).

## Available scripts

```bash
npm run dev         # start local dev server
npm run build        # production build
npm run lint          # eslint
npm run lint:fix    # eslint --fix
npm run typecheck   # tsc type checking (jsconfig)
npm run test           # run vitest
npm run preview       # preview production build locally
```

## Project structure

```
src/
  pages/                # Home, Login, ManageVideos
  components/somatic/   # StateSelector, ExerciseFlow, CheckInHistory,
                         # PatternInsights, Favourites, Settings, AdminInvite, ...
  components/ui/        # shared UI primitives (Radix-based)
  entities/              # legacy schema reference (CheckIn, ExerciseVideo) —
                          # not the live source of truth, see supabase/migrations
  lib/                   # AuthContext, analytics, other shared logic
  api/                   # Supabase client
supabase/
  migrations/            # database schema + RLS policies
  functions/             # Edge Functions (Stripe checkout/webhook/portal, invite-user)
docs/                    # setup and handoff notes
```

Content that drives check-ins and practices lives in Supabase tables (`symptom_categories`, `symptoms`, `exercises`, `exercise_videos`), not in `src/entities/` — those JSON files are left over from the app's original no-code scaffold and don't reflect the current schema.
