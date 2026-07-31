# PyLoop Phase 2: The Life Capstone — Design

**Status:** Approved by Andrae 2026-07-30 ("go"), following the design
presented and re-confirmed after the shell refresh shipped.
**Context:** Phase 2 of the three-phase roadmap (pedagogy → projects → AI
track). The capstone answers the "nothing composes" gap: 65 rungs never add
up to a thing you built. Theme was chosen through several rounds: a
recommender was designed and rejected (flat payoff), "something
visual/interactive" was the stated want, simulation genre was picked over
game-with-opponent, and "staged, but lighter" was picked over locked-panel
stages and over one-big-task.

## What it is

A Conway's Game of Life the learner builds from scratch in one growing
program, across four checkpoints, capped by watching their own simulation
run as an animated grid — played back with the same play/pause/step/scrub
transport pattern Watch already uses. Quiet payoff: no confetti, no sound;
your code visibly alive is the reward.

## Decisions locked during brainstorming

- **One continuous editor, checkpoint ticks.** No locked/collapsed prior
  code, no re-reading panels. The whole program stays editable throughout;
  checkpoints just mark "this part now works."
- **Four required checkpoints:**
  1. **Represent the grid** — a 2D list of alive(1)/dead(0) cells, seeded
     with a glider given as literal data in the task text.
  2. **Count neighbors** — `count_neighbors(grid, row, col)`: the eight
     surrounding cells, edges handled (out-of-bounds counts as dead).
  3. **Apply the rule** — `next_state(alive, count)`: live cell survives on
     2–3 neighbors, dead cell births on exactly 3, else dead.
  4. **Step the grid** — `step(grid)` returns the next generation as a NEW
     grid (not mutated in place), using #2 and #3.
- **Hints yes, solution reveal no.** Each checkpoint has a Fix-style hint
  ladder, but there is no "show me the solution" exit. The last hint of
  each ladder names the topic/rung to go review (e.g. checkpoint 2's ends
  by pointing at for-loops · Advanced). A hidden reference solution exists
  in content ONLY for verify-content — the UI never shows it.
- **Reachable from day one.** No gate, consistent with "nothing is locked."
- **Placement:** a distinct full-width card on the map below the 13 topic
  cards — "The Capstone · Build a world that runs itself", showing `n/4`
  checkpoint progress. The header nav stays Map/Review; the capstone is a
  destination on the map, not a nav item.
- **The payoff:** when checkpoint 4 passes, the app runs the learner's
  `step()` for 40 generations in one Python call, collects every grid
  state, and opens the player. Born cells flare in the heat-trail coral and
  cool to ink, matching the app's existing "heat = recency" language.
- **Stretches (optional, after the payoff, existing stretch-card pattern):**
  wrap it in a `Life` class; load a starting pattern from a file with
  `with open(...)`; reject a malformed pattern with a custom exception.
  Content-only cards; never gate completion.
- **No review-scheduling integration.** Capstone checkpoints don't enter
  the spaced-repetition deck in this phase.

## Architecture

### Engine: one new execution kind, `collect`

The only engine change. A new worker message kind that runs the user's
code, then runs a content-supplied harness snippet, and returns a JSON
value the harness produced — structured data out, not stdout scraping.

- `tracer.py`: add `run_collect(code, collect_code, stdin)` alongside the
  existing `run_plain`/`run_with_asserts`. It executes `code` in a fresh
  namespace, then executes `collect_code` in that same namespace;
  `collect_code` must assign its result to a variable named `__collect__`
  (any `json.dumps`-able value). Returns `{value, stdout, error}` where
  `value` is the parsed result (null on error). The settrace machinery is
  NOT involved — this is a plain-exec path like `run_plain`, so none of the
  tracer's line-event traps apply.
- `engine/types.ts`: new `WorkerRequest` variant
  `{ id, kind: 'collect', code, collectCode, stdin }` and result type
  `CollectResult = { value: unknown; stdout: string; error: PyError | null }`.
- `pyodide.worker.ts`: route the new kind.
- `runtime.ts`: `collect(code, collectCode, stdin = '')` method, same
  timeout/restart semantics as every other call (a runaway 40-generation
  loop gets the existing RunawayError treatment).
- The harness snippet itself lives in **content** (`capstone.ts`), not the
  engine: it deep-copies the seed grid, calls the user's `step()` 40 times
  appending a copy of each generation to a list, and sets `__collect__` to
  that history. The engine stays generic — `collect` knows nothing about
  Life.

### Content: `src/content/capstone.ts`

New module, new types (in the same file — the capstone doesn't fit the
`Topic`/`Level` 5-rung shape and shouldn't pretend to):

```typescript
export type CapstoneStage = {
  id: 1 | 2 | 3 | 4
  title: string          // "Count neighbors"
  task: string           // markdown; includes any literal data the stage needs
  check: Check           // existing engine Check type, kind 'asserts';
                         // runs against the learner's WHOLE program
  hints: string[]        // last hint names the topic/rung to review
}

export type Capstone = {
  title: string
  blurb: string
  stages: CapstoneStage[]
  /** Runs after stage 4's check passes; sets __collect__ to the
   *  40-generation history. */
  harness: string
  generations: number    // 40
  /** Hidden reference program satisfying all four checks — used ONLY by
   *  verify-content; never surfaced in the UI. */
  solution: string
  stretches: { title: string; body: string; code?: string }[]
}
```

Checks are cumulative by construction: every stage's check runs the entire
editor contents, and stage n's asserts exercise the functions stages 1..n
defined. Passing stage 4 therefore means the whole program works.

### Progress: additive optional field, no version bump

`progress/store.ts` — same backward-compatible pattern as Phase 1's
`nextReviewDue`:

```typescript
export type CapstoneProgress = {
  /** Highest checkpoint passed, 0–4. Monotonic: once a stage has passed,
   *  it stays ticked even if later edits break it — the tick records "you
   *  composed this once," and stage 4's check re-proves the whole program
   *  anyway. */
  passed: 0 | 1 | 2 | 3 | 4
  /** The learner's program, persisted so the capstone survives leaving
   *  and returning. */
  code: string
  lastSeen: string
}

export type Progress = {
  version: 2
  topics: Record<string, TopicProgress>
  capstone?: CapstoneProgress   // absent on older saves = not started
}
```

`load()`'s v2 passthrough carries the field; old saves simply lack it. New
helpers: `saveCapstone(p, patch)` and `capstonePassed(p)`. The existing
"rebuild rather than pass through" note in `load()` must be updated to
carry `capstone` explicitly.

### UI

- **`ui/CapstoneShell.tsx`** — the whole capstone screen. Layout, top to
  bottom: title/blurb; the four checkpoints as a compact horizontal rail
  (ticked green when passed, amber for the current frontier — same visual
  language as the loop's stage rail); the current checkpoint's task
  (markdown); the editor (same textarea mechanics as Build: tab-indent,
  Cmd/Ctrl+Enter runs, persisted to `capstone.code` on change, seeded from
  it on mount); Run button; result panel (pass → tick animates in
  fade-rise and the next task appears; fail → same error/stdout panel Fix
  uses); hint ladder for the current checkpoint. After stage 4 passes: the
  payoff player and the stretch cards.
- **`ui/GridPlayer.tsx`** — renders one generation as a CSS grid of cells
  (alive = ink, newly-born flares `--hot` and cools over ~3 generations —
  reuse of the heat-trail idea, implemented locally by diffing consecutive
  generations) with the Watch-style transport: Play/pause, ◀ ▶ step,
  scrubber, `n / 41` frame readout (seed + 40 generations), arrow-key/space
  bindings. Watch's player is
  line-oriented and stays untouched; GridPlayer copies its interaction
  pattern, not its code.
- **`ui/TopicMap.tsx`** — full-width capstone card under the grid:
  label "The Capstone", blurb, `n/4`, `.lift`, amber border once started,
  green-tinged when complete. Clicking it opens capstone mode.
- **`App.tsx`** — one more in-memory mode alongside `open`/`reviewOpen`:
  `capstoneOpen`. `Shell` keeps mode `'map' | 'review' | 'loop'` — the
  capstone renders under mode `'map'`-inactive nav (neither Map nor Review
  lit), which is honest: you're somewhere else. (`ShellMode` gains
  `'capstone'` only if implementation finds the neither-lit state awkward —
  implementer's call, both acceptable.)

### Data flow

```
Run clicked
  → checkSubmission(runtime, code, stages[frontier].check)   // existing path
  → pass: saveCapstone({passed: frontier, code}); frontier advances
  → stage 4 pass: runtime.collect(code, capstone.harness)
      → CollectResult.value = number[][][] (41 grids: seed + 40)
      → GridPlayer plays it
```

Progress saves through the existing `save(progress)` effect in `App.tsx`.
Code persists on every edit (debounced is fine but not required —
localStorage writes of a <2KB string are cheap).

## Error handling

- `collect` failures (user's `step()` crashes on generation 12): the
  CollectResult carries the PyError; CapstoneShell shows it in the standard
  error panel with the generation number prefixed, and the player simply
  doesn't open. Stage 4 stays passed (its check passed); the payoff retries
  on next Run.
- Runaway harness (infinite loop in `step()`): existing RunawayError path,
  existing "ran forever" message.
- Malformed history (harness returns wrong shape because the user's `step`
  returns something odd that still passed asserts): GridPlayer validates
  shape (array of 2D arrays of 0/1) before rendering; on failure shows the
  standard error panel with a plain message naming what it got instead.

## Testing & verification

- **Engine:** unit tests for `run_collect` in the existing engine test
  style: happy path returns parsed value + stdout; user-code error surfaces
  as PyError with line; collect-code error surfaces distinctly; runaway
  restarts and rejects the culprit only.
- **Store:** tests for `saveCapstone`/`capstonePassed` and the
  load-passthrough of the `capstone` field (absent → undefined; present →
  intact; corrupt → dropped without nuking topic progress).
- **verify-content** gains a capstone section:
  - each stage's `check` must FAIL against an empty program (a check no
    blank editor can pass is the analogue of "broken code must fail");
  - the hidden `solution` must PASS all four checks cumulatively;
  - `collect(solution, harness)` must return a valid history: exactly
    `generations + 1` grids, every cell 0/1, all grids same dimensions,
    and at least two distinct consecutive generations (a frozen simulation
    fails — the glider must actually move);
  - every stage has ≥1 hint and the last hint mentions a real topic id.
- **UI:** manual browser verification per project practice (checkpoint
  tick flow, leave-and-return code persistence, payoff playback, error
  paths), performed against the dev server.

## Out of scope

- Phase 3 (numpy/AI-track ladder extension).
- Review-deck integration for capstone stages.
- Multiple capstones / a capstone picker — the data shape is a single
  `Capstone`, and generalizing waits until a second one actually exists.
- Any change to the 13 topics' loop, the Review system, or gamification
  posture (still none).
