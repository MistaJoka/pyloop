# PyLoop Shell & Visual Refresh — Design

**Status:** Approach approved by Andrae 2026-07-29 ("go with A"), pending
written-spec review.
**Context:** Interrupts Phase 2 (capstone) by his call: the capstone should be
built on the upgraded shell, not redone after it. Triggered by comparing
PyLoop against boot.dev's actual product UI (his screenshots, 2026-07-29).
The verdict: boot.dev's *structural* polish is worth taking — app shell,
dashboard density, visible progress, real motion. Its *game* chrome (XP bar,
streak flame, level badge, leaderboard, mascot, sound, urgency timers) is
exactly what he declined on 2026-07-15 and stays out. "Same production
value, quieter register."

## Decisions made during brainstorming

- **Approach A: restructure + polish in one pass.** One coherent project, no
  half-refreshed intermediate state. (Rejected: structure-then-motion in two
  stages; full design-token/component-library pass — ceremony at this scale.)
- **Density goes around the loop, not inside it.** The lesson loop stays
  one-thing-at-a-time — that's a deliberate attention decision, reaffirmed
  today. boot.dev's side-by-side lesson pane is explicitly NOT copied.
- **Slim persistent nav**, even at 2–3 destinations.
- **TopicMap becomes a grid of topic cards** with real progress bars, all 13
  visible at once — replacing the one-open-at-a-time accordion.
- **Identity stays.** Warm charcoal / amber / coral "film editing bench"
  palette and the existing type stack are kept; the refresh is execution —
  depth, motion, spacing, density — not re-theming.
- **UI-only.** Engine, tracer, content schema, progress store, verify-content:
  all untouched. Blast radius is `src/ui/`, `src/App.tsx`, `src/index.css`,
  `tailwind.config.js`.

## Architecture

### New: app shell

`src/ui/Shell.tsx` — a slim fixed header rendered by `App.tsx` around every
mode, replacing the current bare `<div className="mx-auto max-w-4xl">`
wrapper and the per-screen "← Map" links as the primary wayfinding.

- Left: `PYLOOP` wordmark (the existing label face, small), which is also a
  button → Map.
- Center-right: two nav items — `Map`, `Review` — with the active one in
  amber. Review carries a small count when something is due today (the
  number only, e.g. `Review · 2`, no red badge urgency).
- Far right: the Python runtime status dot that currently sits at the page
  footer (`ready` / `warming up` / `restarting`), moved here as a small
  glyph + label. It's system status; it belongs in the chrome.
- The header is `position: sticky`, `backdrop-filter: blur`, hairline bottom
  rule — content scrolls under it.
- In-loop, the header stays. The stage rail (Idea · Watch · … rendered by
  `LoopShell`) remains where it is, below the header — the header answers
  "where in the app", the rail answers "where in the seven minutes".
- `← Map` links inside screens are removed in favor of the header (the
  header's Map does the same thing from anywhere). `Review`'s internal
  `← Calendar` stays — that's within-mode navigation the header can't cover.

### Rebuilt: TopicMap as a dashboard

`src/ui/TopicMap.tsx` rebuilt (same props, new body):

- **Resume card, top, full width.** The single most likely action: the
  next unfinished rung across the whole course (first topic in course order
  with an uncleared level → its `nextLevel`). Shows topic, level name,
  blurb, and a "Continue →" affordance. Replaces nothing — this doesn't
  exist today and is the piece that makes it a dashboard rather than a list.
  Hidden only when every rung in the course is cleared.
- **13 topic cards in a responsive grid** (3-across at the app's max width,
  wrapping down naturally). Each card: order number + title, a real
  progress bar (thin, `--good` fill, animates to width on first paint),
  `n/5`, and the next rung's level name + blurb as the card's one-line
  subtext. Cleared-with-help state (today's hollow amber) appears as an
  amber segment in the bar rather than a separate glyph.
- **Click a card → level picker.** Clicking opens the card's five rungs in
  a panel that expands in place below the card's row (grid-row expansion,
  not a modal — modals are a different app's personality). The row layout
  of rungs inside is today's level rows, restyled: level name, blurb,
  status mark, `Next`/`Again`/`Worth another go` tag. One card open at a
  time, toggling like today's accordion semantics.
- **Review strip.** The "N to review today →" line becomes a slim card
  above the grid (below Resume) when N > 0 — quiet when nothing's due,
  visible without shouting when something is.

### Polished in place: everything else

No structural change, execution pass only:

- **`LoopShell`**: stages cross-fade (~180ms, one direction, no slide
  carnival) instead of hard-swapping. The stage rail gets a thin progress
  underline that moves between labels rather than color-only state.
- **`Done`**: the completion moment gets weight — the "Done"/"Top rung"
  heading fades+rises in (the app's one celebratory beat, still silent, no
  confetti), and the next-rung card gets the same hover depth as topic
  cards.
- **Cards and buttons everywhere**: a consistent two-level depth system —
  resting: hairline border, no shadow; hover/focus: border brightens to
  amber-tinted, background steps to `--panel-hi`, translateY(-1px),
  soft shadow. 120ms ease-out both ways. Applied to topic cards, rung rows,
  Done's next-rung card, Review's calendar cells, and primary buttons.
- **`ReviewCalendar`**: same grid, tightened cell spacing, due-count as a
  small `--good` dot + number, today ringed in amber; clickable cells get
  the standard hover treatment.
- **Progress bars replace pips** everywhere pips appear (`Pips` in
  TopicMap dies; the level picker keeps per-rung ✓ marks).
- **Type scale discipline**: the current mix of ad-hoc sizes (text-[10px],
  text-[11px], text-[13px], text-sm, text-lg, text-3xl, text-5xl) is
  consolidated into a named scale in `index.css` as CSS classes:
  `.t-label` 11px (absorbs today's 10px and 11px labels), `.t-mono` 13px,
  `.t-body` 1rem, `.t-lead` 1.125rem (today's text-lg), `.t-title` 1.875rem
  (today's text-3xl), `.t-display` 3rem (today's text-5xl). Components
  reference the scale, ending per-component font-size drift.

### Motion system (the "expensive" part, kept quiet)

Added to `index.css` as shared keyframes/utilities, used by the components
above:

- `fade-rise`: opacity 0→1, translateY(6px)→0, 180ms ease-out. Stage
  transitions, Done heading, panel expansion.
- `bar-fill`: width 0→target, 400ms ease-out, once, on mount. Progress bars.
- Standard hover transition: 120ms ease-out on border-color, background,
  transform, box-shadow.
- Everything already respects the existing `prefers-reduced-motion` kill
  switch in `index.css` — new animations get no exemption.
- Nothing loops, nothing bounces, nothing blocks input. Motion only ever
  accompanies a state change the user caused.

### Explicitly out

- XP, streaks, levels-as-status, leaderboard, mascot, sound effects,
  urgency timers, red notification badges — declined 2026-07-15, reaffirmed
  2026-07-29.
- Side-by-side lesson pane (reading + editor). The loop stays sequential.
- New fonts, new palette, light mode.
- Router/URL changes — mode switching stays in-memory state in `App.tsx`
  (single user, no deep-linking need).
- Phone/responsive-mobile work — desktop only, per the standing 2026-07-15
  decision. The grid wraps for narrower desktop windows, nothing more.

## Data flow

Unchanged. `App.tsx` keeps its `open` / `reviewOpen` state machine; `Shell`
receives the current mode and two callbacks (`onMap`, `onReview`) plus
`dueTodayCount` and runtime status — all values `App.tsx` already has.
`TopicMap` keeps its exact current props (`progress`, `onPick`,
`dueTodayCount`, `onOpenReview`); the Resume card derives from `progress` +
`topics` with the same helpers the map already imports (`nextLevel`,
`clearedCount`). No store changes, no new persistence.

## Error handling

No new failure modes: the shell renders from local state only. The runtime
status indicator moves homes but keeps its existing three states from
`RuntimeStatus`. The one care point: `LoopShell`'s stage cross-fade must not
delay `onComplete` side effects (progress save fires on click, animation is
purely visual).

## Testing & verification

- `npm test` and `npm run verify-content` stay green throughout — nothing
  they cover is allowed to change (engine, store, content). Any store/engine
  diff in this project is a scope violation by definition.
- UI verification is manual against the dev server, per project practice,
  with a written checklist per screen in the plan (map grid, resume card,
  level picker, loop transitions, review calendar, header nav from every
  mode, reduced-motion mode via devtools emulation).
- Visual states to explicitly check: fresh localStorage (no progress at all
  — Resume card points at variables-and-types Beginner, no review strip),
  partial progress, all-cleared (Resume card hidden), and something-due
  (Review shows count in header and strip on map).
