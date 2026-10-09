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
- **Invite-only access** — there is no public registration or purchase flow. An admin adds each person by email and sends a Neon Auth password-setup link (`AdminInvite`, backed by a Vercel function).
- **Account settings** — users can change their display name, email, and password. The saved display name is used on the home screen.
- **Admin tools** — admins can invite people and manage the exercise video library (`ManageVideos`).

## How it works

- **Frontend** — React 18 + Vite uses Neon Auth and the Neon Data API for check-ins, exercises, and profile data.
- **Access control** — both the server-side access check and the `has_access()` Postgres function require the signed-in user's email to be on the `whitelist`. Row-level security protects user-owned records.
- **Monitoring** — Sentry (error tracking) and PostHog (product analytics: session started/completed events) are wired in at the app root and are optional locally (no-op if their env vars aren't set).

## Tech stack

- **Frontend**: React 18, Vite, Tailwind CSS, Radix UI, Framer Motion
- **Backend**: Neon (Postgres + RLS, managed Auth, Data API) and Vercel functions
- **Monitoring**: Sentry, PostHog
- **Testing**: Vitest + Testing Library

## Local development

```bash
npm install
cp .env.example .env   # fill in your Neon values, see below
npm run dev
```

### Environment variables

Documented in [`.env.example`](.env.example):

| Variable | Description |
|---|---|
| `NEON_DATABASE_URL` | Server-only Neon Postgres connection string |
| `NEON_AUTH_URL` | Server-side Neon Auth base URL |
| `VITE_NEON_AUTH_URL` | Browser-safe Neon Auth base URL |
| `VITE_NEON_DATA_API_URL` | Browser-safe Neon Data API URL |
| `VITE_ADMIN_EMAIL` | Email address granted admin access (video management, invites) |
| `APP_URL` | Canonical app URL used for invitation and password-reset links |

Used in the code but **not yet listed** in `.env.example` — both optional for local dev, the app runs fine without them:

| Variable | Description |
|---|---|
| `VITE_SENTRY_DSN` | Sentry DSN for error tracking |
| `VITE_POSTHOG_KEY` | PostHog project key for analytics |

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
  api/                   # Neon client (temporary legacy filename)
api/                     # Vercel functions (access checks and invites)
neon/
  migrations/            # database schema + RLS policies
supabase/                 # legacy source retained during migration
docs/                    # setup and handoff notes
```

Content that drives check-ins and practices lives in Neon tables (`symptom_categories`, `symptoms`, `exercises`, `exercise_videos`), not in `src/entities/` — those JSON files are left over from the app's original no-code scaffold and don't reflect the current schema.
