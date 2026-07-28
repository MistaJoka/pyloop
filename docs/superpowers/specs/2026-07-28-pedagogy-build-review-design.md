# PyLoop Phase 1: Build & Review — Design

**Status:** Approved by Andrae 2026-07-28, pending written-spec review.
**Context:** First of a three-phase roadmap to close real gaps between PyLoop and
boot.dev-class tools, for solo use (no accounts, no business, no leaderboard —
those are boot.dev's business model, not its pedagogy). Phase 1 = pedagogy.
Phase 2 = projects that compose rungs into something built. Phase 3 = AI-track
ladder extension (numpy, vectorization, a hand-rolled gradient loop). Each
phase ships standalone; only Phase 1 is specified here.

## Problem

Audited against the current code (`content/types.ts`, `progress/store.ts`,
`ui/Fix.tsx`, `ui/LoopShell.tsx`) on 2026-07-28. Two real gaps, both size-1
compared to the rest of the list:

1. **Every rung is repair, never composition.** All 65 lessons' final stage is
   `Fix`: broken code is provided, the task is to make it pass. There is no
   stage anywhere that hands you a blank editor and a task. Repair and
   composition are different skills, and composition is the one that
   transfers to writing real code.
2. **Nothing is scheduled to come back.** `progress/store.ts` timestamps
   `lastSeen` in local time and its own comment says this exists so
   "anything that later schedules review" can use it — but nothing does.
   Clear a rung once and it is gone forever. For retention specifically, this
   was judged the most expensive gap on the list.

## Decisions made during brainstorming

- **Build replaces Fix at levels 4–5 (Advanced, Master) only.** Levels 1–3
  keep the existing repair-based Fix. This keeps the ~7-minute loop
  unchanged (rejected: Build as a 6th stage on every rung, which would push
  every rung to 10–12 minutes — the exact constraint the app is built
  around). It also fixes the difficulty curve: repair is too easy a task to
  be what "Master" tests.
- **Review is a separate subsystem, not a loop stage.** It runs off the
  TopicMap, not inside LoopShell, because it revisits *past* rungs rather
  than progressing the current one.
- **A review item is one Predict question, not the whole rung.** Full
  re-teaching on every scheduled review would be too heavy to actually get
  done; a single "what does this print" is retrieval practice — the cheapest
  thing that still proves the material is retained.
- **Build has no hints and no solution reveal.** By level 4–5 you've had the
  whole rung (concept, watch, predict) to learn the idea; Build is asking
  you to synthesize it, not recover from a broken state. Fix's hint ladder
  and solution reveal are the right shape for repair; they're the wrong
  shape for "prove you can write this from nothing."

## Architecture

No new engine. `Check` (in `engine/types.ts`) already describes what a
correct submission looks like (`asserts` or `stdout`), and it's evaluated the
same way regardless of whether the code in the editor started broken or
started empty. The tracer doesn't care how code arrived either. Everything
here is: one new loop stage, one new content field, and one new subsystem
layered on the existing progress store.

```
Current loop (5 stages):  Idea → Watch → Predict → Fix  → Done
Levels 1–3 (unchanged):   Idea → Watch → Predict → Fix  → Done
Levels 4–5 (new):         Idea → Watch → Predict → Build → Done

New subsystem, off-loop:  Review deck (reachable from TopicMap)
                          → calendar of scheduled dates
                          → tapping a date lists due items
                          → each item = one stripped-down Predict
```

### Build stage

New component `ui/Build.tsx`, sibling to `ui/Fix.tsx`, swapped in by
`LoopShell` based on `level.level >= 4`.

- Renders `level.build.task` (markdown, same as `Fix.task` today).
- Blank editor (same textarea treatment as `Fix.tsx`: Tab-to-indent,
  Cmd/Ctrl+Enter to run, no autocapitalize/autocorrect/autocomplete). Starts
  empty, not with `brokenCode` — there is no broken code for Build.
  Optionally seeded with a function signature stub as part of the task
  markdown (e.g. `` `def total(nums):` ``) authored inline, not a code field.
- "Run it" calls `checkSubmission(runtime, code, level.build.check,
  level.build.stdin ?? '')` — identical call shape to Fix, different
  `Check`.
- On fail: show the same error/stdout panel Fix shows today. No hints
  button, no solution button.
- On pass: `Done →`, calling `onDone(false)` — same `(assisted: boolean) =>
  void` signature `LoopShell` already wires to `Fix`, but Build has no
  assisted path (no hints, no solution reveal), so it always passes `false`.

### `Level.build` content field

Added to `content/types.ts`, alongside the existing `fix` field:

```typescript
build?: {
  /** What to write, as markdown. May reference a suggested signature inline
   *  (e.g. `` `def total(nums):` ``) — there is no starting-code field,
   *  because Build's whole point is starting from nothing. */
  task: string
  /** Fed to input() if the written code reads input. */
  stdin?: string
  check: Check
  /** Optional deeper cut, same contract as the existing Level.stretch. */
  stretch?: { title: string; body: string; code?: string }
}
```

`fix` stays required on `Level`; `build` is optional and used only at levels
4–5. `LoopShell` picks the stage by level number, not by field presence — a
level 4–5 lesson is required to carry `build`, and `verify-content` gates on
that (see Testing).

### Review subsystem

New route/section reachable from `TopicMap`, not a new page in the router
sense — `App.tsx` gains one more `Open`-like mode (`{ mode: 'review' }`
alongside the existing `{ topicId, level }`).

- **Scheduling data** lives in `progress/store.ts`, extending `LevelProgress`
  with a `nextReviewDue: string | null` (a `localDay()` string, consistent
  with the existing `lastSeen`). Set whenever a level is completed via
  `completeLevel`, and updated again whenever a review item is answered.
- **Schedule.** Standard spacing: first review 1 day after a level is first
  completed, then 3, then 7, then 30, resetting to 1 on a wrong answer.
  Encoded as a pure function `nextInterval(current: number | null, correct:
  boolean): number` in `progress/store.ts`, unit-testable without touching
  the UI.
- **`ui/ReviewCalendar.tsx`** — month/week view (reuses the visual language
  of `TopicMap`'s pips: dots, not a full calendar widget library). Each day
  with `nextReviewDue` items shows a count. Tapping a day with due items
  opens the review list for that day; tapping a future day is inert.
- **`ui/ReviewItem.tsx`** — one review = one `Predict` (reuses the existing
  `Predict` component, given the stored `level.predict` unchanged) with no
  surrounding loop chrome. Correct → `nextReviewDue` advances per the
  schedule, don't show again today. Wrong → show the full rung's `Watch`
  stage (read-only replay, not a re-teach) then re-ask the same `Predict`.
- **Entry point on `TopicMap`.** A small "N to review today" line under the
  title, next to the existing tagline, linking into review mode. Skippable
  (there is no gate elsewhere in the app, and Review keeps that norm) but
  visible on every visit so it isn't forgettable.

### Data flow

```
completeLevel(progress, topicId, level, outcome)
  → stamps lastSeen (existing)
  → NEW: sets nextReviewDue = today + 1 day, if not already scheduled

ReviewItem answered
  → recordReview(progress, topicId, level, correct)
  → NEW: nextReviewDue = today + nextInterval(currentIntervalDays, correct)
```

No new persistence mechanism — same `localStorage` key
(`pyloop.progress.v1`), same `version: 2` shape, extended with one nullable
field per level. `load()`'s existing migration path (`parsed.version === 2`
passthrough) already tolerates additive fields; no version bump needed since
old saves simply get `nextReviewDue: undefined` on levels touched before this
ships, treated as "not yet scheduled."

## Content changes

`build` is added to the 26 lessons at levels 4–5 across all 13 existing
topics (13 topics × 2 levels). For each: author one task description
(1–2 sentences) and reuse the `Check` already pinned on that level's existing
`fix.check` (the correctness bar doesn't change — only whether you're handed
broken code or nothing). Levels 1–3 are untouched.

This is content-only work once the schema and UI exist — no engine changes
per lesson, verified the same way all existing content is.

## Testing & verification

- **Engine:** unchanged; `tracer.test.ts` and existing suite stay green with
  no modification expected.
- **`nextInterval`:** new unit tests in `progress/store.test.ts` — covers the
  1/3/7/30 progression and the reset-to-1 on a wrong answer.
- **Content:** `scripts/verify-content.mjs` gains a Build check, mirroring
  the existing Fix checks:
  - a level 4 or 5 lesson without a `build` field fails verification (Build
    is mandatory at those levels, not optional-per-lesson — an honest
    ladder needs every Advanced/Master rung to test composition, matching
    the project's existing "don't pad with filler" stance applied in
    reverse: don't skip the harder task either).
  - the shipped `build.check` must be satisfiable — verified by running the
    solution snippet used to author the task through `checkSubmission`
    (the same one the existing `fix.solution` uses today, since the
    check is unchanged) and asserting it passes, so a broken check can't
    ship silently.
- **UI:** manual verification via the dev server for both new components
  (`Build.tsx`, `ReviewCalendar.tsx`, `ReviewItem.tsx`) — type of check the
  existing `Fix.tsx`/`Predict.tsx` never had automated coverage for either,
  consistent with current project practice.

## Out of scope for Phase 1

- Projects that compose multiple rungs (Phase 2).
- AI-track content — numpy, vectorization, gradient loops (Phase 3).
- Any account, sync, or multi-device story — progress stays
  `localStorage`-only, as it is today.
- Any change to the existing Fix stage's UX at levels 1–3.
