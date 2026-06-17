# Design: Sentry Error Monitoring

**Date:** 2026-06-16  
**Goal:** Add production error monitoring with Sentry — catch unhandled JS exceptions and React render errors, tag them with user ID, and upload sourcemaps for readable stack traces.  
**Scope:** Errors only (no performance monitoring). Privacy-first configuration to protect user-generated content (practice notes, check-in data).

---

## 1. Packages

**New dependency:**
- `@sentry/react`

**New devDependency:**
- `@sentry/vite-plugin`

---

## 2. Environment Variables

All vars live in Vercel only. No local `.env` changes — when `VITE_SENTRY_DSN` is undefined, Sentry initialises as a no-op.

| Variable | Where | Secret? | Purpose |
|---|---|---|---|
| `VITE_SENTRY_DSN` | Vercel | No | DSN from Sentry project settings |
| `SENTRY_AUTH_TOKEN` | Vercel | Yes | Sourcemap upload auth |
| `SENTRY_ORG` | Vercel | No | Org slug from Sentry settings |
| `SENTRY_PROJECT` | Vercel | No | Project slug from Sentry settings |

No secrets needed in GitHub Actions — CI runs lint + test only, never `vite build`, so the sourcemap plugin never executes there.

---

## 3. Initialization + Error Boundary (`src/main.jsx`)

`Sentry.init()` runs before React mounts so it is active for the full lifetime of the app.

**Init options:**
- `dsn`: `import.meta.env.VITE_SENTRY_DSN`
- `environment`: `import.meta.env.MODE` — `"production"` on Vercel, `"development"` locally; allows filtering by environment in the Sentry dashboard
- `sendDefaultPii: false` — explicit opt-out; prevents IP addresses, cookies, and auth headers from being attached to events
- `integrations: [breadcrumbsIntegration({ console: false })]` — disables console breadcrumbs to block user-generated content (practice notes, check-in text) from travelling with error reports via `console.log` calls; navigation and UI click breadcrumbs remain active
- `beforeSend(event)` — strips `event.extra` before the event leaves the browser; last-resort safety net against any SDK integration attaching arbitrary context that could contain user data

**Error Boundary:**

`<App>` is wrapped in `<Sentry.ErrorBoundary>` in `main.jsx`. When a React component tree throws during render, Sentry captures the error (which the global handler would miss) and shows a minimal fallback UI instead of a blank screen.

```
Sentry.init({ ... })

ReactDOM.createRoot(...).render(
  <Sentry.ErrorBoundary fallback={<p>Something went wrong. Please refresh the page.</p>}>
    <App />
  </Sentry.ErrorBoundary>
)
```

---

## 4. User Context (`src/lib/AuthContext.jsx`)

Errors are tagged with `{ id: supabaseUser.id }` — user ID only, no email.

- **Set**: inside `checkAccess()`, after the `has_access` RPC resolves — regardless of whether access is granted or denied. The user is authenticated in both cases and their ID is useful context for errors on the Paywall as well as inside the app.
- **Clear**: in the `SIGNED_OUT` handler via `Sentry.setUser(null)`.

No changes to the `getSession` initial load path — `setUser` is called inside `checkAccess`, which is already invoked from there.

---

## 5. Sourcemap Upload (`vite.config.js`)

Two additions:

1. **`build: { sourcemap: true }`** — tells Vite to generate `.map` files during `vite build`.

2. **`@sentry/vite-plugin`** — conditioned on `SENTRY_AUTH_TOKEN` being set, so `vitest run` and local dev are unaffected:

```js
...(process.env.SENTRY_AUTH_TOKEN ? [
  sentryVitePlugin({
    sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] }
  })
] : [])
```

The plugin reads `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` from env vars automatically. `filesToDeleteAfterUpload` removes `.map` files from the Vercel dist after upload — stack traces are readable in Sentry but sourcemaps are not publicly served.

---

## 6. Privacy Summary

| Risk | Mitigation |
|---|---|
| Email in Sentry | Excluded from `setUser`; dashboard scrubbing catches accidental leakage in error messages |
| IP address | `sendDefaultPii: false` (default, made explicit) |
| Practice notes via console logs | Console breadcrumbs disabled |
| Practice notes via component state | Not captured — ErrorBoundary captures component *names* only, not state values |
| Request/response bodies | Blocked by `sendDefaultPii: false` |
| Arbitrary SDK context | `beforeSend` strips `event.extra` |

**One-time Sentry dashboard setup (manual, after deploy):**  
Settings → Security & Privacy → Data Scrubbing → enable "Use Default Scrubbers" and add `notes` to Additional Sensitive Fields. This scrubs email patterns and the `notes` field from all events server-side before storage.

---

## 7. File Summary

```
src/
  main.jsx                  ← Sentry.init() + <Sentry.ErrorBoundary> wrapper
  lib/
    AuthContext.jsx         ← Sentry.setUser({ id }) on sign-in, Sentry.setUser(null) on sign-out
vite.config.js              ← @sentry/vite-plugin (conditioned on SENTRY_AUTH_TOKEN) + build.sourcemap: true
```

No new files. No changes to CI.

---

## Out of Scope

- Performance monitoring (traces, Web Vitals)
- `Sentry.captureException()` at manual call sites
- Custom Error Boundary UI beyond a plain refresh message
- Alerting rules or Sentry notification config
- PostHog (separate Phase 2 sub-project)
