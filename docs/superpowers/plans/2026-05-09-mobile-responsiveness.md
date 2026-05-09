# Mobile Responsiveness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three mobile layout breakages and one stale label bug across the Somatic Pause App.

**Architecture:** Targeted Tailwind responsive class additions at four specific spots. No structural changes — existing inline styles are preserved where they already work. The app uses a mix of Tailwind classes and inline styles; this plan follows that convention.

**Tech Stack:** React, Vite, Tailwind CSS (v3), deployed on Vercel. No test suite — verification is visual via dev server at `localhost:5173`.

---

## File Map

| File | What changes |
|------|-------------|
| `src/pages/Home.jsx` | `<main>` — remove inline horizontal padding, add `px-4 sm:px-8` |
| `src/components/somatic/CheckInHistory.jsx` | Header div — add `flex-col sm:flex-row sm:items-start sm:justify-between gap-4`; stat grid div — replace inline `gridTemplateColumns` with `grid grid-cols-2 md:grid-cols-4` |
| `src/components/somatic/PatternInsights.jsx` | `STATE_INFO.freeze.label` → `"Freeze"`, `STATE_INFO.fawn.label` → `"Shutdown"` |

---

## Task 1: Fix main content padding — `Home.jsx`

**Files:**
- Modify: `src/pages/Home.jsx:85`

- [ ] **Step 1: Start the dev server**

```bash
cd "/Users/clara/Desktop/Somatic Pause App" && npm run dev
```

Open `http://localhost:5173` in a narrow browser window (~375px wide, e.g. Chrome DevTools mobile emulation iPhone SE). Confirm current state: content has 32px padding each side.

- [ ] **Step 2: Apply the fix**

In `src/pages/Home.jsx`, find line 85:

```jsx
<main style={{ maxWidth: 680, margin: "0 auto", padding: "40px 32px 80px" }}>
```

Replace with:

```jsx
<main className="px-4 sm:px-8" style={{ maxWidth: 680, margin: "0 auto", paddingTop: 40, paddingBottom: 80 }}>
```

- [ ] **Step 3: Verify**

In the browser at ~375px width: content should now have 16px horizontal padding. At ≥640px it should return to 32px. No visual change expected at desktop widths.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Home.jsx
git commit -m "fix: reduce main content padding to 16px on mobile"
```

---

## Task 2: Fix Progress page header overflow — `CheckInHistory.jsx`

**Files:**
- Modify: `src/components/somatic/CheckInHistory.jsx:90`

- [ ] **Step 1: Observe the broken state**

Navigate to the Progress page in the browser at ~375px width. Confirm the "New session" button is cut off on the right edge — the title + filter pills + button are all in one flex row that overflows.

- [ ] **Step 2: Apply the fix**

In `src/components/somatic/CheckInHistory.jsx`, find the header div at line 90:

```jsx
<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
```

Replace with:

```jsx
<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4" style={{ marginBottom: 24 }}>
```

The `display: "flex"`, `alignItems`, and `justifyContent` inline styles are removed — Tailwind classes take over. `marginBottom` stays inline.

- [ ] **Step 3: Verify**

At ~375px: the title ("Your Progress" + date) should appear on top, and the controls row (filter pills + New session button) should appear below it, both left-aligned. At ≥640px: side by side as before, right-aligned. The "New session" button should no longer be cut off.

- [ ] **Step 4: Commit**

```bash
git add src/components/somatic/CheckInHistory.jsx
git commit -m "fix: stack progress header vertically on mobile"
```

---

## Task 3: Fix stat card grid — `CheckInHistory.jsx`

**Files:**
- Modify: `src/components/somatic/CheckInHistory.jsx:132`

- [ ] **Step 1: Observe the broken state**

On the Progress page at ~375px width, confirm the four stat cards are in a single row of four — each card is ~70px wide and barely readable.

- [ ] **Step 2: Apply the fix**

In `src/components/somatic/CheckInHistory.jsx`, find the stat cards div at line 132:

```jsx
<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
```

Replace with:

```jsx
<div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 10, marginBottom: 24 }}>
```

`display: "grid"` and `gridTemplateColumns` are removed — Tailwind handles the grid. Gap and margin stay inline.

- [ ] **Step 3: Verify**

At ~375px: four stat cards in a 2×2 grid. Cards should be ~170px wide — enough room for the label, value, and sub-text. At ≥768px: four cards in a row as before.

- [ ] **Step 4: Commit**

```bash
git add src/components/somatic/CheckInHistory.jsx
git commit -m "fix: show stat cards as 2x2 grid on mobile"
```

---

## Task 4: Fix stale state labels — `PatternInsights.jsx`

**Files:**
- Modify: `src/components/somatic/PatternInsights.jsx:18-19`

- [ ] **Step 1: Observe the bug**

Navigate to the Progress page. In the "Recurring States" section, if freeze or fawn sessions exist, they show "Dorsal" and "Blended" respectively — inconsistent with "Freeze" and "Shutdown" used everywhere else.

- [ ] **Step 2: Apply the fix**

In `src/components/somatic/PatternInsights.jsx`, find `STATE_INFO` around line 15:

```js
const STATE_INFO = {
  fight:  { label: "Fight",   emoji: "🔥", bar: "#e8a090", tag: { bg: "#fde8e4", color: "#c97a85" } },
  flight: { label: "Flight",  emoji: "💨", bar: "#f0ca88", tag: { bg: "#fdf0e0", color: "#d4874a" } },
  freeze: { label: "Dorsal",  emoji: "🧊", bar: "#a8c8e8", tag: { bg: "#e0eaf5", color: "#5a85c4" } },
  fawn:   { label: "Blended", emoji: "🫶", bar: "#c8a8e8", tag: { bg: "#ede8f8", color: "#9b8ec4" } },
  safe:   { label: "Safe",    emoji: "🌿", bar: "#a8d4a8", tag: { bg: "#e0ecdc", color: "#5a8a54" } },
};
```

Replace the two stale labels:

```js
const STATE_INFO = {
  fight:  { label: "Fight",    emoji: "🔥", bar: "#e8a090", tag: { bg: "#fde8e4", color: "#c97a85" } },
  flight: { label: "Flight",   emoji: "💨", bar: "#f0ca88", tag: { bg: "#fdf0e0", color: "#d4874a" } },
  freeze: { label: "Freeze",   emoji: "🧊", bar: "#a8c8e8", tag: { bg: "#e0eaf5", color: "#5a85c4" } },
  fawn:   { label: "Shutdown", emoji: "🫶", bar: "#c8a8e8", tag: { bg: "#ede8f8", color: "#9b8ec4" } },
  safe:   { label: "Safe",     emoji: "🌿", bar: "#a8d4a8", tag: { bg: "#e0ecdc", color: "#5a8a54" } },
};
```

- [ ] **Step 3: Verify**

On the Progress page with sessions logged under freeze or fawn: the bars should now read "Freeze" and "Shutdown". The symptom tags below ("How it most often shows up") also use `stateInfo.label` so those will update automatically.

- [ ] **Step 4: Commit**

```bash
git add src/components/somatic/PatternInsights.jsx
git commit -m "fix: correct state labels in PatternInsights (Freeze, Shutdown)"
```

---

## Final check

- [ ] **Step 1: Full mobile walkthrough**

With the dev server running, set browser to ~375px width (iPhone SE). Walk through all pages:

1. **Home/Welcome** — mascot + 2×2 state cards + Begin check-in button. All should fit without overflow.
2. **Check-in flow** — category list, symptom list, result card, score slider. All single-column, should be fine.
3. **Exercise flow** — exercise cards stack in a column; breathwork orb stacks above phase list. All should fit.
4. **Progress page** — title + controls stacked; 2×2 stat cards; recurring states bars; symptom list. All should fit.

- [ ] **Step 2: Confirm desktop unchanged**

Widen to 1024px. Verify:
- Main content has 32px horizontal padding.
- Progress header is side-by-side again.
- Stat cards are 4-in-a-row.
- Exercise breathwork/guide shows 2-column layout.
