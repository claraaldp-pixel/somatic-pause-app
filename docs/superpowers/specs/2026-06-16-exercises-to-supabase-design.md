# Design: Move Exercise & Symptom Content to Supabase

**Date:** 2026-06-16  
**Goal:** Remove `exercises.js` and `symptomData.js` from the repository so the repo can be made public without exposing exercise content and symptom-scoring weights (Clara's IP). Replace with Supabase-fetched data.  
**Scope:** Data migration + component fetch updates only. No admin UI.

---

## 1. Database Schema

### `exercises`

| column | type | notes |
|---|---|---|
| `id` | text PK | Existing IDs preserved (e.g. `fight_activate_1`) — user favourites stay intact |
| `survival_state` | text | fight / flight / freeze / fawn / safe |
| `category` | text | e.g. "Activate" |
| `category_emoji` | text | |
| `category_order` | int | Category sequence within a state |
| `exercise_order` | int | Exercise sequence within a category |
| `title` | text | |
| `duration` | text | e.g. "2 min" |
| `type` | text | breathwork / movement / somatic / grounding |
| `emoji` | text | |
| `description` | text | |
| `steps` | jsonb | Array of step strings; `[]` for audio-only exercises |
| `phases` | jsonb | null for most; breathing timing data for BreathingGuide |
| `rounds` | int | null for most; used by BreathingGuide |

### `symptom_categories`

| column | type | notes |
|---|---|---|
| `id` | text PK | physical / emotional / thoughts / behavioural |
| `label` | text | |
| `emoji` | text | |
| `description` | text | |
| `display_order` | int | |

### `symptoms`

| column | type | notes |
|---|---|---|
| `id` | serial PK | |
| `category_id` | text FK → symptom_categories | |
| `text` | text | Symptom sentence shown to user |
| `fight_score` | int | |
| `flight_score` | int | |
| `freeze_score` | int | |
| `fawn_score` | int | |
| `display_order` | int | |

### RLS (all three tables)

- `SELECT`: any authenticated user
- `INSERT / UPDATE / DELETE`: admin email only (`auth.jwt() ->> 'email' = 'clara.a.ldp@gmail.com'`)

Identical pattern to the existing `exercise_videos` policy.

---

## 2. Seed Strategy

Content never enters the git repository.

```
scripts/seed-content.js   ← gitignored; contains all exercise + symptom data
scripts/.env              ← gitignored; holds SUPABASE_URL + SERVICE_ROLE_KEY
```

Root `.gitignore` gains: `scripts/`

The seed script uses `@supabase/supabase-js` with the service role key (bypasses RLS). It runs `upsert` so it is safe to re-run when exercises change.

The migration file committed to the repo contains only `CREATE TABLE` + RLS statements — zero content.

### Deployment order (must be followed)

1. `supabase db push` — creates tables in production
2. `node scripts/seed-content.js` — populates content
3. Build + deploy frontend — ships components that fetch from DB

Step 3 before step 2 = visible empty exercise list. The order is enforced by common sense: verify in preview before deploying.

---

## 3. Component Changes

### `ExerciseFlow.jsx`

- Remove `import { EXERCISES } from "./exercises"`
- Add `exercises` fetch to existing `useEffect` (alongside `exercise_videos`)
- Fetch: `supabase.from('exercises').select('*').eq('survival_state', survivalState).order('category_order').order('exercise_order')`
- Pass flat rows through `groupIntoCategories()` — a small pure function that reduces flat rows into `{ category, categoryEmoji, exercises: [] }` shape
- Add `loading` state; show hedgehog loading card while fetching
- All render logic below is unchanged

### `StateSelector.jsx`

- Remove `import { CATEGORIES } from "./symptomData"`
- Add `useEffect` on mount: fetch `symptom_categories` ordered by `display_order`, fetch `symptoms` ordered by `category_id, display_order`
- Transform DB rows to `CATEGORIES` shape; map `{ fight_score, flight_score, freeze_score, fawn_score }` → `{ scores: { fight, flight, freeze, fawn } }` for `computeResult` compatibility
- Add `loading` state; show brief spinner before category picker renders
- All check-in logic (`computeResult`, `toggleSymptom`, etc.) is unchanged

### `Favourites.jsx`

- Remove `import { EXERCISES } from "./exercises"`
- Fetch all exercises (no state filter): `supabase.from('exercises').select('*')`
- Assign to a flat `allExercises` array — matches how `ALL_EXERCISES` is used today
- Add `loading` state; show skeleton placeholder

---

## 4. Cleanup

- Delete `src/components/somatic/exercises.js`
- Delete `src/components/somatic/symptomData.js`

Done after all three components are verified working locally.

---

## Impact on existing users

- No user data is touched (check-ins, favourites, subscriptions all unaffected)
- Existing exercise IDs are preserved so favourites resolve correctly
- Users see a brief loading state (~200–400ms) where exercise content was previously instant — acceptable and consistent with the existing `exercise_videos` fetch pattern
- Zero downtime: additive DB migration + deploy in correct order
