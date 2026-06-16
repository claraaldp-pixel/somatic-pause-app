# Exercises & Symptoms to Supabase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all exercise and symptom content from static JS files into Supabase so the repo can be made public without exposing Clara's IP.

**Architecture:** Three new Supabase tables (`exercises`, `symptom_categories`, `symptoms`) hold the content. A gitignored seed script imports from the existing JS files and upserts into Supabase. Three React components (`ExerciseFlow`, `StateSelector`, `Favourites`) switch from static imports to `supabase.from()` fetches. The JS files are deleted last, after the app is verified working.

**Tech Stack:** React 18 + Vite, Supabase JS v2, Node 20+ (for `--env-file` flag)

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| Create | `supabase/migrations/20260616000000_exercises_and_symptoms.sql` | Schema + RLS for 3 new tables |
| Create | `scripts/seed-content.js` | Gitignored seed script; imports existing JS files and upserts to Supabase |
| Create | `scripts/.env` | Gitignored; holds service role key — never commit |
| Modify | `.gitignore` | Add `scripts/` |
| Modify | `src/components/somatic/ExerciseFlow.jsx` | Replace EXERCISES import with Supabase fetch |
| Modify | `src/components/somatic/StateSelector.jsx` | Replace CATEGORIES import with Supabase fetch |
| Modify | `src/components/somatic/Favourites.jsx` | Replace ALL_EXERCISES import with Supabase fetch |
| Delete | `src/components/somatic/exercises.js` | IP removed from repo |
| Delete | `src/components/somatic/symptomData.js` | IP removed from repo |

---

## Task 1: Migration — create the three tables

**Files:**
- Create: `supabase/migrations/20260616000000_exercises_and_symptoms.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- exercises: stores all somatic practice content
create table public.exercises (
  id               text primary key,
  survival_state   text    not null,
  category         text    not null,
  category_emoji   text,
  category_order   int     not null,
  exercise_order   int     not null,
  title            text    not null,
  duration         text,
  type             text,
  emoji            text,
  description      text,
  steps            jsonb   not null default '[]',
  phases           jsonb,
  rounds           int
);

alter table public.exercises enable row level security;

create policy "Authenticated users can view exercises"
  on public.exercises for select
  to authenticated
  using (true);

create policy "Admin can manage exercises"
  on public.exercises for all
  to authenticated
  using  ((auth.jwt() ->> 'email') = 'clara.a.ldp@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'clara.a.ldp@gmail.com');

-- symptom_categories: physical / emotional / thoughts / behavioural
create table public.symptom_categories (
  id            text primary key,
  label         text not null,
  emoji         text,
  description   text,
  display_order int  not null
);

alter table public.symptom_categories enable row level security;

create policy "Authenticated users can view symptom categories"
  on public.symptom_categories for select
  to authenticated
  using (true);

create policy "Admin can manage symptom categories"
  on public.symptom_categories for all
  to authenticated
  using  ((auth.jwt() ->> 'email') = 'clara.a.ldp@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'clara.a.ldp@gmail.com');

-- symptoms: the symptom sentences + scoring weights (core IP)
create table public.symptoms (
  id            serial primary key,
  category_id   text references public.symptom_categories(id) on delete cascade,
  text          text not null,
  fight_score   int  not null default 0,
  flight_score  int  not null default 0,
  freeze_score  int  not null default 0,
  fawn_score    int  not null default 0,
  display_order int  not null
);

alter table public.symptoms enable row level security;

create policy "Authenticated users can view symptoms"
  on public.symptoms for select
  to authenticated
  using (true);

create policy "Admin can manage symptoms"
  on public.symptoms for all
  to authenticated
  using  ((auth.jwt() ->> 'email') = 'clara.a.ldp@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'clara.a.ldp@gmail.com');
```

- [ ] **Step 2: Push migration to production**

```bash
cd "/Users/clara/Desktop/Somatic Pause App"
supabase db push
```

Expected output: migration applied with no errors.

- [ ] **Step 3: Verify tables exist**

Open Supabase dashboard → Table Editor. Confirm `exercises`, `symptom_categories`, and `symptoms` appear (all empty).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260616000000_exercises_and_symptoms.sql
git commit -m "feat: add exercises, symptom_categories, and symptoms tables with RLS"
```

---

## Task 2: Gitignore + seed script

**Files:**
- Modify: `.gitignore`
- Create: `scripts/seed-content.js` (gitignored — never committed)
- Create: `scripts/.env` (gitignored — never committed)

- [ ] **Step 1: Update .gitignore**

Open `.gitignore` and add at the bottom:

```
# Seed scripts contain IP — never commit
scripts/
```

- [ ] **Step 2: Commit the .gitignore change**

```bash
git add .gitignore
git commit -m "chore: gitignore scripts/ directory (contains seed data)"
```

- [ ] **Step 3: Create `scripts/.env`**

Create the file at `scripts/.env` (this is gitignored). Get the values from Supabase Dashboard → Project Settings → API:

```
SUPABASE_URL=https://boroyqbmziylvjdeaook.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your service role key from Supabase dashboard>
```

- [ ] **Step 4: Create `scripts/seed-content.js`**

```js
import { createClient } from '@supabase/supabase-js';
import { EXERCISES } from '../src/components/somatic/exercises.js';
import { CATEGORIES } from '../src/components/somatic/symptomData.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function seed() {
  // --- exercises ---
  const exerciseRows = [];
  for (const [state, categories] of Object.entries(EXERCISES)) {
    categories.forEach((cat, catIdx) => {
      cat.exercises.forEach((ex, exIdx) => {
        exerciseRows.push({
          id:             ex.id,
          survival_state: state,
          category:       cat.category,
          category_emoji: cat.categoryEmoji,
          category_order: catIdx,
          exercise_order: exIdx,
          title:          ex.title,
          duration:       ex.duration  ?? null,
          type:           ex.type      ?? null,
          emoji:          ex.emoji     ?? null,
          description:    ex.description ?? null,
          steps:          ex.steps  ?? [],
          phases:         ex.phases ?? null,
          rounds:         ex.rounds ?? null,
        });
      });
    });
  }

  const { error: exErr } = await supabase
    .from('exercises')
    .upsert(exerciseRows, { onConflict: 'id' });
  if (exErr) throw exErr;
  console.log(`✓ ${exerciseRows.length} exercises seeded`);

  // --- symptom_categories ---
  const catRows = CATEGORIES.map((cat, idx) => ({
    id:            cat.id,
    label:         cat.label,
    emoji:         cat.emoji,
    description:   cat.description,
    display_order: idx,
  }));

  const { error: catErr } = await supabase
    .from('symptom_categories')
    .upsert(catRows, { onConflict: 'id' });
  if (catErr) throw catErr;
  console.log(`✓ ${catRows.length} symptom categories seeded`);

  // --- symptoms (delete-all + re-insert: serial PK, safe to wipe) ---
  const { error: delErr } = await supabase
    .from('symptoms')
    .delete()
    .gte('id', 0);
  if (delErr) throw delErr;

  const symptomRows = [];
  let order = 0;
  for (const cat of CATEGORIES) {
    for (const s of cat.symptoms) {
      symptomRows.push({
        category_id:  cat.id,
        text:         s.text,
        fight_score:  s.scores.fight,
        flight_score: s.scores.flight,
        freeze_score: s.scores.freeze,
        fawn_score:   s.scores.fawn,
        display_order: order++,
      });
    }
  }

  const { error: sErr } = await supabase.from('symptoms').insert(symptomRows);
  if (sErr) throw sErr;
  console.log(`✓ ${symptomRows.length} symptoms seeded`);
}

seed().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 5: Run the seed script**

```bash
node --env-file=scripts/.env scripts/seed-content.js
```

Expected output:
```
✓ 27 exercises seeded
✓ 4 symptom categories seeded
✓ 40 symptoms seeded
```

- [ ] **Step 6: Verify data in Supabase dashboard**

Open Table Editor → `exercises`. Confirm rows exist for each survival state. Open `symptoms` — confirm all 4 categories are populated with scoring weights.

---

## Task 3: Update ExerciseFlow.jsx

**Files:**
- Modify: `src/components/somatic/ExerciseFlow.jsx`

- [ ] **Step 1: Add `groupIntoCategories` helper above the component**

Add this function directly above the `export default function ExerciseFlow` line:

```js
function groupIntoCategories(rows) {
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.category_order)) {
      map.set(row.category_order, {
        category:      row.category,
        categoryEmoji: row.category_emoji,
        exercises:     [],
      });
    }
    map.get(row.category_order).exercises.push({
      id:          row.id,
      title:       row.title,
      duration:    row.duration,
      type:        row.type,
      emoji:       row.emoji,
      description: row.description,
      steps:       row.steps || [],
      ...(row.phases && { phases: row.phases }),
      ...(row.rounds && { rounds: row.rounds }),
    });
  }
  return Array.from(map.values());
}
```

- [ ] **Step 2: Remove the static import and replace with state**

Remove this line at the top of the file:
```js
import { EXERCISES } from "./exercises";
```

Inside `ExerciseFlow`, replace:
```js
const categories = EXERCISES[survivalState] || [];
```
with:
```js
const [categories, setCategories] = useState([]);
const [loadingExercises, setLoadingExercises] = useState(true);
```

- [ ] **Step 3: Extend the existing useEffect to fetch exercises**

The existing `useEffect` fetches `exercise_videos` and `liked_exercises`. Extend it to also fetch exercises. Replace the entire `useEffect` block with:

```js
useEffect(() => {
  setLoadingExercises(true);
  supabase
    .from('exercises')
    .select('*')
    .eq('survival_state', survivalState)
    .order('category_order')
    .order('exercise_order')
    .then(({ data }) => {
      setCategories(groupIntoCategories(data || []));
      setLoadingExercises(false);
    });

  supabase.from('exercise_videos').select('*').eq('survival_state', survivalState)
    .then(({ data }) => setVideos(data || []));

  if (user) {
    supabase.from('profiles').select('liked_exercises').eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (data?.liked_exercises) setLikedExercises(new Set(data.liked_exercises)); });
  }
}, [survivalState, user]);
```

- [ ] **Step 4: Add loading state at the top of the return**

At the very start of the component's return (before any other JSX is returned), add this guard. Find the line:

```js
if (activeExercise) {
```

And add this block directly above it:

```js
if (loadingExercises) {
  return (
    <div style={{ paddingTop: 40, textAlign: 'center' }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#ede8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>
        🦔
      </div>
      <p style={{ fontSize: 14, color: '#9d97ac' }}>Loading your practices…</p>
    </div>
  );
}
```

- [ ] **Step 5: Verify locally**

```bash
npm run dev
```

Navigate to a check-in session, complete it, and confirm the exercise list loads correctly for each survival state (fight, flight, freeze, fawn, safe). The hedgehog loading card should flash briefly, then exercises appear.

- [ ] **Step 6: Commit**

```bash
git add src/components/somatic/ExerciseFlow.jsx
git commit -m "feat: fetch exercises from Supabase instead of static import"
```

---

## Task 4: Update StateSelector.jsx

**Files:**
- Modify: `src/components/somatic/StateSelector.jsx`

- [ ] **Step 1: Add `buildCategories` helper above the component**

Add this function directly above `export default function StateSelector`:

```js
function buildCategories(catRows, symptomRows) {
  return catRows.map((cat) => ({
    id:          cat.id,
    label:       cat.label,
    emoji:       cat.emoji,
    description: cat.description,
    symptoms:    symptomRows
      .filter((s) => s.category_id === cat.id)
      .map((s) => ({
        text:   s.text,
        scores: {
          fight:  s.fight_score,
          flight: s.flight_score,
          freeze: s.freeze_score,
          fawn:   s.fawn_score,
        },
      })),
  }));
}
```

- [ ] **Step 2: Remove the static import**

Remove this line:
```js
import { CATEGORIES } from "./symptomData";
```

- [ ] **Step 3: Add missing imports**

`StateSelector` currently only imports `useState` from React and has no Supabase import. Add both:

Replace:
```js
import { useState } from "react";
```
with:
```js
import { useState, useEffect } from "react";
```

Also add below the existing imports:
```js
import { supabase } from "@/api/supabaseClient";
```

- [ ] **Step 4: Replace with state + fetch**

Inside the `StateSelector` component, add these two state declarations near the top (alongside the existing `useState` calls):

```js
const [categories, setCategories] = useState([]);
const [loadingCategories, setLoadingCategories] = useState(true);
```

Then add this `useEffect` as the first hook inside the component (before the existing state declarations is fine):

```js
useEffect(() => {
  Promise.all([
    supabase.from('symptom_categories').select('*').order('display_order'),
    supabase.from('symptoms').select('*').order('display_order'),
  ]).then(([{ data: cats }, { data: syms }]) => {
    setCategories(buildCategories(cats || [], syms || []));
    setLoadingCategories(false);
  });
}, []);
```

- [ ] **Step 5: Replace all references to `CATEGORIES` with `categories`**

There are three places. Replace each:

1. In `handleSeeResult`:
   ```js
   // before
   CATEGORIES.forEach((cat) => {
   // after
   categories.forEach((cat) => {
   ```

2. In `getSelectedSymptoms`:
   ```js
   // before
   CATEGORIES.forEach((cat) => {
   // after
   categories.forEach((cat) => {
   ```

3. In the JSX (category picker):
   ```js
   // before
   {CATEGORIES.map((cat, i) => {
   // after
   {categories.map((cat, i) => {
   ```

- [ ] **Step 6: Add loading guard**

At the very start of the component's return block, before the `<motion.div>` wrapper, add:

```js
if (loadingCategories) {
  return (
    <div style={{ paddingTop: 60, textAlign: 'center' }}>
      <p style={{ fontSize: 14, color: '#9d97ac' }}>Loading…</p>
    </div>
  );
}
```

- [ ] **Step 7: Verify locally**

```bash
npm run dev
```

Start a new check-in. Confirm the four category cards (Physical, Emotional, Thoughts, Behavioural) load, symptoms show correctly, and the result calculation still identifies the right nervous system state.

- [ ] **Step 8: Commit**

```bash
git add src/components/somatic/StateSelector.jsx
git commit -m "feat: fetch symptom categories and symptoms from Supabase"
```

---

## Task 5: Update Favourites.jsx

**Files:**
- Modify: `src/components/somatic/Favourites.jsx`

- [ ] **Step 1: Remove the static import and module-level constant**

Remove these two lines:
```js
import { EXERCISES } from "./exercises";

const ALL_EXERCISES = Object.values(EXERCISES).flatMap((cats) =>
  cats.flatMap((cat) => cat.exercises)
);
```

- [ ] **Step 2: Add state + fetch**

Inside `Favourites`, add alongside the existing `useState` calls:

```js
const [allExercises, setAllExercises] = useState([]);
const [loadingExercises, setLoadingExercises] = useState(true);
```

Add a new `useEffect` (the existing one fetches `liked_exercises` from `profiles`; add this separately):

```js
useEffect(() => {
  supabase
    .from('exercises')
    .select('*')
    .then(({ data }) => {
      setAllExercises(data || []);
      setLoadingExercises(false);
    });
}, []);
```

- [ ] **Step 3: Update the `liked` derivation**

Replace:
```js
const liked = likedIds === null
  ? []
  : ALL_EXERCISES.filter((ex) => likedIds.includes(ex.id));
```
with:
```js
const liked = likedIds === null || loadingExercises
  ? []
  : allExercises.filter((ex) => likedIds.includes(ex.id));
```

- [ ] **Step 4: Update the loading guard in the render**

Replace:
```js
{likedIds === null ? (
  <div style={{ textAlign: "center", paddingTop: 60, color: C.textLight, fontSize: 14 }}>Loading…</div>
```
with:
```js
{(likedIds === null || loadingExercises) ? (
  <div style={{ textAlign: "center", paddingTop: 60, color: C.textLight, fontSize: 14 }}>Loading…</div>
```

- [ ] **Step 5: Verify locally**

```bash
npm run dev
```

Navigate to Favourites. If you have liked exercises, confirm they still appear. Confirm the heart button on exercises still toggles correctly.

- [ ] **Step 6: Commit**

```bash
git add src/components/somatic/Favourites.jsx
git commit -m "feat: fetch all exercises from Supabase in Favourites"
```

---

## Task 6: Delete the source files

**Files:**
- Delete: `src/components/somatic/exercises.js`
- Delete: `src/components/somatic/symptomData.js`

- [ ] **Step 1: Confirm no remaining imports**

```bash
grep -r "from.*exercises" "/Users/clara/Desktop/Somatic Pause App/src"
grep -r "from.*symptomData" "/Users/clara/Desktop/Somatic Pause App/src"
```

Expected: no output. If any imports remain, fix them before proceeding.

- [ ] **Step 2: Delete the files**

```bash
rm "/Users/clara/Desktop/Somatic Pause App/src/components/somatic/exercises.js"
rm "/Users/clara/Desktop/Somatic Pause App/src/components/somatic/symptomData.js"
```

- [ ] **Step 3: Verify the app still builds**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove exercises.js and symptomData.js — content now in Supabase"
```

---

## Task 7: Deploy

> ⚠️ **Checkpoint:** Ask Clara before pushing or deploying.

- [ ] **Step 1: Final local smoke test**

```bash
npm run dev
```

Run through the full user flow:
1. Log in
2. Start a check-in → complete all 4 symptom categories → confirm state result
3. Start a practice session → confirm exercises load for the result state
4. Complete an exercise → heart a favourite
5. Open Favourites → confirm hearted exercise appears

- [ ] **Step 2: Push to GitHub and deploy**

```bash
git push origin main
```

Vercel deploys automatically on push to `main`. Monitor the Vercel dashboard for a successful build.

- [ ] **Step 3: Smoke test in production**

Open `clara-ai.info` (or wherever the app is live) and repeat the flow from Step 1.

- [ ] **Step 4: Flip the repo public**

Once production is verified:

```bash
gh repo edit claraaldp-pixel/somatic-pause-app --visibility public
```
