# Design: CI/Vitest Pipeline

**Date:** 2026-06-16
**Goal:** Add automated testing + a GitHub Actions CI pipeline that blocks merges to `main` on lint, typecheck, or test failure.
**Scope:** Auth + access logic tests only. Vitest + React Testing Library. Supabase mocked via `vi.mock`.

---

## 1. Test Infrastructure

### New dev dependencies

- `vitest`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- `jsdom`

### `vite.config.js` — add `test` block

```js
test: {
  environment: 'jsdom',
  setupFiles: ['src/test/setup.js'],
  globals: true,
}
```

### `src/test/setup.js`

Imports `@testing-library/jest-dom` to register custom matchers (`toBeInTheDocument`, etc.) for all test files.

### `src/test/mocks/supabase.js`

Shared mock factory for the Supabase client. Exports a mock object with `vi.fn()` stubs for:

- `auth.getSession` — returns a configurable session or null
- `auth.onAuthStateChange` — calls the callback synchronously with a configurable event/session, returns an unsubscribe stub
- `rpc('has_access', ...)` — returns a configurable `{ data, error }` response

All test files that need Supabase import from this file. `vi.mock('@supabase/supabase-js')` is called once per test file.

### `package.json` — add test script

```json
"test": "vitest run"
```

---

## 2. Test Scenarios

### `src/lib/AuthContext.test.jsx`

Each test renders a minimal component wrapped in `AuthContext`, then asserts the context values exposed to consumers.

| # | Scenario | Mock setup | Assertion |
|---|---|---|---|
| 1 | No session | `getSession` returns `{ session: null }` | `user` is null, `hasAccess` is false |
| 2 | Session + access granted | `getSession` returns a session; `rpc('has_access')` returns `{ data: true }` | `hasAccess` is true, `authError` is null |
| 3 | Session + access denied | `getSession` returns a session; `rpc('has_access')` returns `{ data: false }` | `hasAccess` is false, `authError.type` is `'no_subscription'` |

### `src/components/ProtectedRoute.test.jsx`

Each test renders `<ProtectedRoute>` inside a `MemoryRouter`, with `AuthContext` values provided via a test wrapper (not the real provider — values are passed directly to avoid re-testing auth logic here).

| # | Scenario | Context values | Assertion |
|---|---|---|---|
| 4 | No user | `user: null, hasAccess: false` | Redirects to `/login` |
| 5 | User, no access | `user: {...}, hasAccess: false, authError: { type: 'no_subscription' }` | Renders `<Paywall />`, not children |
| 6 | User, has access | `user: {...}, hasAccess: true` | Renders children |

---

## 3. CI Pipeline

### `.github/workflows/ci.yml`

- **Triggers:** `push` to `main`; `pull_request` targeting `main`
- **Runner:** `ubuntu-latest`
- **Node version:** 20 (LTS)
- **Dependency caching:** `actions/setup-node` with `cache: 'npm'`
- **Steps (sequential, single job):**
  1. Checkout
  2. Set up Node 20 with npm cache
  3. `npm ci`
  4. `npm run lint`
  5. `npm run typecheck`
  6. `npm run test`

Single job (not parallel jobs) to avoid 3× `npm ci` overhead. Total runtime ~60–90s on cold cache, ~30–45s warm.

### Branch protection (manual, one-time)

After the workflow is merged to `main`, configure in GitHub → Settings → Branches → Branch protection rules → `main`:

- [x] Require status checks to pass before merging
- Required check: `CI` (the job name from `ci.yml`)
- [x] Require branches to be up to date before merging

---

## 4. File Summary

```
src/
  test/
    setup.js                        ← jest-dom registration
    mocks/
      supabase.js                   ← shared Supabase mock factory
  lib/
    AuthContext.test.jsx            ← 3 auth state tests
  components/
    ProtectedRoute.test.jsx         ← 3 route guard tests
.github/
  workflows/
    ci.yml                          ← lint + typecheck + test pipeline
```

No changes to `src/lib/AuthContext.jsx` or `src/components/ProtectedRoute.jsx` — the existing code is testable as-is with mocking.

---

## Out of scope

- Component tests for `Paywall.jsx`, `Login.jsx`, or any other component
- Integration tests against a real Supabase instance
- PostHog and Sentry (separate Phase 2 sub-projects)
- Code coverage reporting or coverage thresholds
