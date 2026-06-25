# PostHog Product Analytics — Design Spec

**Date:** 2026-06-23
**Status:** Approved

---

## Goal

Add PostHog product analytics to the Somatic Pause App to answer two questions:

1. **Funnel:** Where do users drop off between signing up and becoming active?
2. **Engagement:** Which exercises get used, how often do users complete sessions, how much do scores improve?

---

## Architecture

**Package:** `posthog-js` (vanilla JS SDK — no React provider; we use a module pattern)

**New file:** `src/lib/analytics.js` — thin wrapper (~30 lines) exporting named event functions. Components never import `posthog-js` directly.

**Init:** `src/main.jsx`, alongside existing Sentry init. Guarded by `VITE_POSTHOG_KEY` so PostHog is a no-op in development unless the key is explicitly set. Analytics calls are safe to make regardless — if PostHog is not initialized, calls are silently dropped (checked via `posthog.__loaded`).

```js
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: 'https://us.i.posthog.com',
    autocapture: false,
    capture_pageview: false,
    disable_session_recording: true,
  });
}
```

**User identity:** `posthog.identify(userId)` in `AuthContext.jsx` alongside the existing `Sentry.setUser({ id })` call in `checkAccess`. `posthog.reset()` in the `SIGNED_OUT` handler alongside `Sentry.setUser(null)`. This links all events to the Supabase user ID — no email, no PII.

---

## Privacy

- `autocapture: false` — nothing is captured automatically
- `capture_pageview: false` — page views fired manually only
- `disable_session_recording: true` — session replay disabled entirely
- User identified by Supabase UUID only — no email, no name stored in PostHog

---

## Events Catalog

### Funnel events (`src/components/Paywall.jsx`)

| Event | Trigger | Properties |
|---|---|---|
| `paywall_viewed` | Component mounts | — |
| `checkout_started` | "Start free trial" clicked | — |
| `checkout_completed` | `?checkout=success` detected on mount | — |

### Engagement events (`src/pages/Home.jsx`)

| Event | Trigger | Properties |
|---|---|---|
| `session_started` | State selected → exercise flow begins | `{ survival_state, trigger }` |
| `session_completed` | `handleSessionComplete` called | `{ survival_state, pre_score, post_score, score_delta, exercises_count }` |
| `page_viewed` | `handleSetPhase` called | `{ page }` |

**Property notes:**
- `trigger` values: `'state_selector'` (normal flow), `'favourite'` (started from Favourites), `'quick_start'`
- `score_delta` is `post_score - pre_score`, pre-computed in the analytics module so PostHog dashboards can filter/aggregate it directly
- `page_viewed` uses PostHog's reserved `$pageview` event name so it surfaces correctly in Paths and Session analysis
- `page` values: `'welcome'`, `'exercises'`, `'history'`, `'favourites'`, `'settings'`

---

## analytics.js Interface

```js
// src/lib/analytics.js
import posthog from 'posthog-js';

const enabled = () => posthog.__loaded;

export const analytics = {
  paywallViewed:      () => enabled() && posthog.capture('paywall_viewed'),
  checkoutStarted:    () => enabled() && posthog.capture('checkout_started'),
  checkoutCompleted:  () => enabled() && posthog.capture('checkout_completed'),
  sessionStarted:     (survivalState, trigger) =>
    enabled() && posthog.capture('session_started', { survival_state: survivalState, trigger }),
  sessionCompleted:   (survivalState, preScore, postScore, exercisesCount) =>
    enabled() && posthog.capture('session_completed', {
      survival_state: survivalState,
      pre_score: preScore,
      post_score: postScore,
      score_delta: postScore - preScore,
      exercises_count: exercisesCount,
    }),
  pageViewed:         (page) => enabled() && posthog.capture('$pageview', { page }),
};
```

---

## File Map

| File | Change |
|---|---|
| `src/lib/analytics.js` | New — PostHog wrapper with named event functions |
| `src/main.jsx` | Add PostHog init (alongside Sentry) |
| `src/lib/AuthContext.jsx` | Add `posthog.identify(userId)` + `posthog.reset()` |
| `src/lib/AuthContext.test.jsx` | Add 2 tests (identify on auth, reset on sign-out) |
| `src/components/Paywall.jsx` | Add 3 event calls |
| `src/pages/Home.jsx` | Add 3 event calls |

No other files touched.

---

## Testing

**TDD for AuthContext integration** — same pattern as Sentry tests:

```js
vi.mock('posthog-js', () => ({ default: { identify: vi.fn(), reset: vi.fn(), __loaded: true } }))
```

Two new tests in `src/lib/AuthContext.test.jsx`:
1. `posthog.identify` called with `userId` when access resolves (access granted or denied)
2. `posthog.reset` called on `SIGNED_OUT`

**analytics.js is not unit tested** — it's a thin pass-through; correctness verified by the AuthContext tests and manual smoke testing.

**Verification steps:**
- Full test suite green (currently 11 tests; will become 13)
- Dev server loads without PostHog-related console errors
- Set `VITE_POSTHOG_KEY` locally → trigger a session → confirm event appears in PostHog Live Events

---

## Vercel Environment Variables

| Variable | Environment | Secret |
|---|---|---|
| `VITE_POSTHOG_KEY` | Production | No |

Only one variable needed. `api_host` is hardcoded to `https://us.i.posthog.com` (US cloud).
