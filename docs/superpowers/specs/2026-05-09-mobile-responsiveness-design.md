# Mobile Responsiveness — Design Spec

**Date:** 2026-05-09  
**Scope:** Full audit; targeted fixes only in the three broken spots.  
**Approach:** B — surgical Tailwind breakpoint edits at the problem sites; no rewrite of working styles.

---

## Context

The app is used primarily on mobile. Most pages already stack correctly. Three specific problems were identified via screenshot review:

1. Progress page header overflows on mobile (button cut off).
2. Stat card grid is always 4-in-a-row — ~70px per card on a 375px screen.
3. PatternInsights uses stale state labels ("Dorsal", "Blended") that don't match the rest of the app.

---

## Changes

### 1. `src/pages/Home.jsx` — main padding

**Problem:** `<main>` has `padding: "40px 32px 80px"` as an inline style. 32px each side leaves only 311px of content width on a 375px screen, which compounds with card padding.

**Fix:** Remove the horizontal padding from the inline style and add a Tailwind class `px-4 sm:px-8` to the `<main>` element. Top and bottom padding remain in the inline style.

- Mobile: 16px horizontal padding
- sm+ (≥640px): 32px horizontal padding

---

### 2. `src/components/somatic/CheckInHistory.jsx` — header row

**Problem:** The header is a single `flex justify-between` row containing the title block and a controls group (filter pills + "New session" button). On narrow screens the controls group overflows the right edge.

**Fix:** Add Tailwind classes to the outer header div: `flex flex-col sm:flex-row sm:justify-between`. Add `gap` via Tailwind (`gap-4`) so title and controls have breathing room when stacked. The controls group itself (`display: flex, gap: 10`) stays unchanged.

- Mobile: title on top, controls on second line, both left-aligned.
- sm+: side by side as before.

---

### 3. `src/components/somatic/CheckInHistory.jsx` — stat card grid

**Problem:** `gridTemplateColumns: "repeat(4, 1fr)"` is hardcoded as an inline style, giving ~70px per card on mobile.

**Fix:** Remove the inline `gridTemplateColumns` and replace with Tailwind `grid grid-cols-2 md:grid-cols-4`. Keep `gap: 10` and `marginBottom: 24` in the inline style (or convert gap to `gap-[10px]` Tailwind).

- Mobile: 2×2 grid.
- md+ (≥768px): 4-in-a-row as before.

---

### 4. `src/components/somatic/PatternInsights.jsx` — state label bug

**Problem:** `STATE_INFO` in PatternInsights still has:
- `freeze: { label: "Dorsal", … }`
- `fawn: { label: "Blended", … }`

These don't match the app-wide terminology (Freeze / Shutdown), which was updated in the symptom model migration.

**Fix:** Update the two labels in `STATE_INFO`:
- `freeze.label` → `"Freeze"`
- `fawn.label` → `"Shutdown"`

No layout changes needed.

---

## Files changed

| File | Change |
|------|--------|
| `src/pages/Home.jsx` | Tailwind `px-4 sm:px-8` on `<main>`, remove inline horizontal padding |
| `src/components/somatic/CheckInHistory.jsx` | Header: `flex-col sm:flex-row sm:justify-between gap-4`; Stat grid: `grid grid-cols-2 md:grid-cols-4` |
| `src/components/somatic/PatternInsights.jsx` | Fix `freeze.label` and `fawn.label` |

## Files not changed

- `AppSidebar.jsx` — mobile drawer already works.
- `WelcomeBanner.jsx` — 2×2 grid is appropriate for mobile.
- `StateSelector.jsx` — single-column list, fine on mobile.
- `ExerciseFlow.jsx` — already uses `md:grid-cols-2`, stacks correctly.
- `PatternInsights.jsx` layout — single-column, fine on mobile.
