# Pedagogy: Build Stage & Review Scheduling — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a from-scratch "Build" stage that replaces "Fix" at levels 4–5
(Advanced, Master) across all 13 topics, and a spaced-repetition Review deck
that brings old Predict questions back on a schedule — the two gaps identified
in `docs/superpowers/specs/2026-07-28-pedagogy-build-review-design.md`.

**Architecture:** No new engine. The existing `Check`/`checkSubmission`
machinery already judges correctness regardless of whether code started
broken or started empty, and the tracer already replays cleanly for a
read-only Watch. This plan adds: one new `Level.build` content field, one new
`Build` loop stage (swapped in for `Fix` at levels ≥4), one new `nextInterval`
scheduling function plus two new `Progress` fields, and three new UI
components (`ReviewCalendar`, `ReviewItem`, `Review`) that read/write that
scheduling data through the existing `localStorage` progress store.

**Tech Stack:** React 19 + TypeScript 5.9 + Vite 7. Python execution via
Pyodide in a Web Worker (`engine/runtime.ts`, unchanged). Tests via Vitest.
Content verified via `scripts/verify-content.mjs` (a Node script that boots a
real Pyodide instance outside the browser).

## Global Constraints

- No new dependencies. Everything here is buildable with what's already in
  `package.json`.
- `localStorage` key stays `pyloop.progress.v1`; `Progress.version` stays `2`
  — new fields are additive and optional, so existing saves load unchanged
  (see Task 1).
- This codebase does not unit-test React components (`Fix.tsx`, `Predict.tsx`,
  `Watch.tsx` have none) — only pure logic (`progress/store.ts`,
  `engine/tracer.py`) gets Vitest coverage. Follow that pattern: store changes
  get tests; new UI components get a manual dev-server verification step
  instead of a fabricated test file.
- Run `npm test` and `npm run verify-content` after any change that touches
  `progress/store.ts`, `content/types.ts`, or `scripts/verify-content.mjs` —
  both must stay green before moving to the next task.
- Content rule for every lesson's new `build` field: `build.check` is the
  *exact same* `Check` object as that level's existing `fix.check` (copy the
  object, don't re-derive it), and `build.stdin` copies `fix.stdin` if it's
  set. This is what lets `verify-content` prove `build.check` is reachable
  without a brand-new solution field — the level's existing `fix.solution`
  already satisfies it (proven independently at the point `fix` is checked).
  Never invent a different check for `build`.

---

### Task 1: Spaced-repetition scheduling — `nextInterval`

**Files:**
- Modify: `src/progress/store.ts`
- Test: `src/progress/store.test.ts`

**Interfaces:**
- Produces: `nextInterval(current: number | null, correct: boolean): number`
  — a pure function later tasks call to compute the next spacing interval.

- [ ] **Step 1: Write the failing tests**

Add to `src/progress/store.test.ts`:

```typescript
import { nextInterval } from './store'

describe('nextInterval', () => {
  it('starts a never-reviewed item at 1 day', () => {
    expect(nextInterval(null, true)).toBe(1)
  })

  it('advances 1 -> 3 -> 7 -> 30 on repeated correct answers', () => {
    expect(nextInterval(1, true)).toBe(3)
    expect(nextInterval(3, true)).toBe(7)
    expect(nextInterval(7, true)).toBe(30)
  })

  it('holds at 30 once matured', () => {
    expect(nextInterval(30, true)).toBe(30)
  })

  it('resets to 1 on a wrong answer, from any interval', () => {
    expect(nextInterval(1, false)).toBe(1)
    expect(nextInterval(7, false)).toBe(1)
    expect(nextInterval(30, false)).toBe(1)
    expect(nextInterval(null, false)).toBe(1)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- store.test.ts`
Expected: FAIL with "nextInterval is not exported" or similar — the function
doesn't exist yet.

- [ ] **Step 3: Implement `nextInterval`**

Add to `src/progress/store.ts`, near the other exported pure functions:

```typescript
const REVIEW_SCHEDULE = [1, 3, 7, 30]

/** Standard spaced-repetition progression: 1 -> 3 -> 7 -> 30 days, held at 30
 *  once matured. Any wrong answer resets to 1, from whatever interval it was
 *  at. `current` is the interval that was just tested — null before a level
 *  has ever been reviewed. */
export function nextInterval(current: number | null, correct: boolean): number {
  if (!correct) return REVIEW_SCHEDULE[0]
  if (current === null) return REVIEW_SCHEDULE[0]
  const i = REVIEW_SCHEDULE.indexOf(current)
  if (i === -1 || i === REVIEW_SCHEDULE.length - 1) return REVIEW_SCHEDULE[REVIEW_SCHEDULE.length - 1]
  return REVIEW_SCHEDULE[i + 1]
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- store.test.ts`
Expected: PASS, all 6 new assertions green.

- [ ] **Step 5: Commit**

```bash
git add src/progress/store.ts src/progress/store.test.ts
git commit -m "Add nextInterval spaced-repetition scheduling function"
```

---

### Task 2: Wire scheduling into the progress store

**Files:**
- Modify: `src/progress/store.ts`
- Test: `src/progress/store.test.ts`

**Interfaces:**
- Consumes: `nextInterval(current, correct)` from Task 1.
- Produces:
  - `LevelProgress.nextReviewDue?: string | null` and
    `LevelProgress.reviewIntervalDays?: number | null` (new optional fields).
  - `completeLevel(...)` (existing signature, unchanged) now also seeds
    scheduling on a level's *first* clear.
  - `recordReview(p: Progress, topicId: string, level: LevelId, correct: boolean): Progress`
  - `dueOn(p: Progress, day: string): { topicId: string; level: LevelId }[]`
  - `export today` (was private) so UI code can ask "what day is it" the same
    way the store does.
  - `export type DueItem = { topicId: string; level: LevelId }`

- [ ] **Step 1: Write the failing tests**

Add to `src/progress/store.test.ts`:

```typescript
import { recordReview, dueOn, today } from './store'

describe('review scheduling', () => {
  it('seeds a 1-day review on first clear, and leaves it alone on a redo', () => {
    at('2026-07-15T20:00:00')
    let p = completeLevel(fresh(), 'for-loops', 1, { predictCorrect: true, assisted: false })
    expect(p.topics['for-loops'].levels[1]?.nextReviewDue).toBe('2026-07-16')
    expect(p.topics['for-loops'].levels[1]?.reviewIntervalDays).toBe(1)

    // Redoing the level (not via Review) shouldn't reset an existing schedule.
    p = { ...p, topics: { ...p.topics, 'for-loops': { levels: { ...p.topics['for-loops'].levels, 1: { ...p.topics['for-loops'].levels[1]!, nextReviewDue: '2026-08-01', reviewIntervalDays: 7 } } } } }
    p = completeLevel(p, 'for-loops', 1, { predictCorrect: true, assisted: false })
    expect(p.topics['for-loops'].levels[1]?.nextReviewDue).toBe('2026-08-01')
    expect(p.topics['for-loops'].levels[1]?.reviewIntervalDays).toBe(7)
  })

  it('recordReview advances the schedule on a correct answer', () => {
    at('2026-07-15T20:00:00')
    let p = completeLevel(fresh(), 'for-loops', 1, { predictCorrect: true, assisted: false })
    at('2026-07-16T20:00:00')
    p = recordReview(p, 'for-loops', 1, true)
    expect(p.topics['for-loops'].levels[1]?.reviewIntervalDays).toBe(3)
    expect(p.topics['for-loops'].levels[1]?.nextReviewDue).toBe('2026-07-19')
  })

  it('recordReview resets to 1 day on a wrong answer', () => {
    at('2026-07-15T20:00:00')
    let p = completeLevel(fresh(), 'for-loops', 1, { predictCorrect: true, assisted: false })
    at('2026-07-16T20:00:00')
    p = recordReview(p, 'for-loops', 1, false)
    expect(p.topics['for-loops'].levels[1]?.reviewIntervalDays).toBe(1)
    expect(p.topics['for-loops'].levels[1]?.nextReviewDue).toBe('2026-07-17')
  })

  it('dueOn finds items due today or earlier, and excludes future ones', () => {
    at('2026-07-15T20:00:00')
    let p = completeLevel(fresh(), 'for-loops', 1, { predictCorrect: true, assisted: false }) // due 07-16
    p = completeLevel(p, 'for-loops', 2, { predictCorrect: true, assisted: false }) // due 07-16
    expect(dueOn(p, '2026-07-16')).toHaveLength(2)
    expect(dueOn(p, '2026-07-15')).toHaveLength(0) // not due yet
    expect(dueOn(p, '2026-07-20')).toHaveLength(2) // overdue items still show
  })

  it('today() reports the local calendar day', () => {
    at('2026-07-15T20:00:00')
    expect(today()).toBe('2026-07-15')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- store.test.ts`
Expected: FAIL — `recordReview`, `dueOn`, and `today` aren't exported, and
`completeLevel` doesn't set `nextReviewDue` yet.

- [ ] **Step 3: Implement the store changes**

In `src/progress/store.ts`, extend `LevelProgress`:

```typescript
export type LevelProgress = {
  completed: boolean
  predictCorrect: boolean
  assisted: boolean
  attempts: number
  lastSeen: string
  /** Next local calendar day this level's predict should be re-asked.
   *  Optional so pre-existing saves (from before Review shipped) load fine
   *  with it simply absent — absent is read the same as "not yet scheduled". */
  nextReviewDue?: string | null
  /** The spacing interval that produced nextReviewDue, so the NEXT review
   *  can compute where to go from here. */
  reviewIntervalDays?: number | null
}

export type DueItem = { topicId: string; level: LevelId }
```

Export `today` (remove the `const today` privacy, keep the implementation):

```typescript
export const today = () => localDay(new Date())
```

Add an `addDays` helper near `localDay`:

```typescript
/** Adds `n` local calendar days to a `localDay()`-formatted string. */
function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + n)
  return localDay(dt)
}
```

Update `completeLevel` to seed scheduling only on a level's first clear:

```typescript
export function completeLevel(
  p: Progress,
  topicId: string,
  level: LevelId,
  outcome: { predictCorrect: boolean; assisted: boolean },
): Progress {
  const topic = p.topics[topicId] ?? { levels: {} }
  const prev = topic.levels[level]
  const firstClear = !prev?.completed
  return {
    ...p,
    topics: {
      ...p.topics,
      [topicId]: {
        levels: {
          ...topic.levels,
          [level]: {
            completed: true,
            predictCorrect: outcome.predictCorrect,
            assisted: outcome.assisted,
            attempts: (prev?.attempts ?? 0) + 1,
            lastSeen: today(),
            nextReviewDue: firstClear ? addDays(today(), 1) : (prev?.nextReviewDue ?? addDays(today(), 1)),
            reviewIntervalDays: firstClear ? 1 : (prev?.reviewIntervalDays ?? 1),
          },
        },
      },
    },
  }
}
```

Add `recordReview` and `dueOn`:

```typescript
/** Answering one scheduled review: advances (or resets) the spacing interval
 *  and reschedules. Does not touch completed/predictCorrect/assisted — those
 *  describe the LOOP clear, not a later review answer. */
export function recordReview(
  p: Progress,
  topicId: string,
  level: LevelId,
  correct: boolean,
): Progress {
  const topic = p.topics[topicId] ?? { levels: {} }
  const prev = topic.levels[level]
  const interval = nextInterval(prev?.reviewIntervalDays ?? null, correct)
  return {
    ...p,
    topics: {
      ...p.topics,
      [topicId]: {
        levels: {
          ...topic.levels,
          [level]: {
            completed: prev?.completed ?? true,
            predictCorrect: prev?.predictCorrect ?? correct,
            assisted: prev?.assisted ?? false,
            attempts: prev?.attempts ?? 1,
            lastSeen: today(),
            nextReviewDue: addDays(today(), interval),
            reviewIntervalDays: interval,
          },
        },
      },
    },
  }
}

/** Every level scheduled on or before `day` — "due or overdue", so a
 *  skipped day never silently drops an item. */
export function dueOn(p: Progress, day: string): DueItem[] {
  const items: DueItem[] = []
  for (const [topicId, tp] of Object.entries(p.topics)) {
    for (const [levelStr, lp] of Object.entries(tp.levels)) {
      if (lp?.nextReviewDue && lp.nextReviewDue <= day) {
        items.push({ topicId, level: Number(levelStr) as LevelId })
      }
    }
  }
  return items
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- store.test.ts`
Expected: PASS, all new assertions green, and no existing test broken.

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: all 5 test files pass (the pre-existing 78 tests, plus the ones
added in Task 1 and this task).

- [ ] **Step 6: Commit**

```bash
git add src/progress/store.ts src/progress/store.test.ts
git commit -m "Add review scheduling (recordReview, dueOn) to the progress store"
```

---

### Task 3: Add the `build` content field

**Files:**
- Modify: `src/content/types.ts`

**Interfaces:**
- Produces: `Level.build?: { task: string; stdin?: string; check: Check }`

- [ ] **Step 1: Add the field**

In `src/content/types.ts`, add `build` as a sibling of `fix` on `Level`:

```typescript
  fix: {
    task: string
    brokenCode: string
    stdin?: string
    check: Check
    hints: string[]
    solution: string
  }
  /** Levels 4 and 5 only: replaces `fix` as the loop's fourth stage. No
   *  starting code — Build hands you a task, not something broken, because by
   *  Advanced/Master you've had the whole rung to learn the idea and this
   *  stage is asking you to compose it, not recover it.
   *
   *  `check` must be the exact same Check as this level's `fix.check` — see
   *  the Global Constraints note in the Build/Review plan. That's what lets
   *  verify-content prove it's reachable without a second solution field:
   *  `fix.solution` already satisfies it. */
  build?: {
    task: string
    stdin?: string
    check: Check
  }
  /** Optional deeper cut. Always skippable; never gates DONE. */
  stretch?: { title: string; body: string; code?: string }
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (an optional field addition can't break existing content,
since nothing currently sets `build`).

- [ ] **Step 3: Commit**

```bash
git add src/content/types.ts
git commit -m "Add optional Level.build field for the Build stage"
```

---

### Task 4: Author `build` content for for-loops levels 4–5

**Files:**
- Modify: `src/content/topics/for-loops/advanced.ts`
- Modify: `src/content/topics/for-loops/master.ts`

This is the reference/voice topic (per project convention — see
`src/content/topics/for-loops/` used elsewhere as the authoring template) and
proves the schema end-to-end before Task 8 repeats the pattern across the
other 12 topics.

**Interfaces:**
- Consumes: `Level.build` from Task 3.
- Produces: real content Task 5's UI work and Task 6's verify-content check
  can be tested against immediately.

- [ ] **Step 1: Add `build` to `for-loops/advanced.ts`**

Add this field to the exported `advanced` object, after `fix` and before
`stretch`:

```typescript
  build: {
    task: `Each cart is a list of item prices — \`carts = [[5, 5], [10], [2, 3, 4]]\`.
Write code from scratch, with nested \`for\` loops, that sums every price
across every cart into \`total\` and prints it. It should print \`29\`.`,
    check: {
      kind: 'asserts',
      code: `assert total == 29, f"total came out as {total}, expected 29 (5+5+10+2+3+4)."
assert __stdout__.strip() == "29", f"It should print 29, but it printed {__stdout__.strip()!r}."`,
    },
  },
```

(This `check` is a verbatim copy of `fix.check` on the same level, per the
Global Constraints rule.)

- [ ] **Step 2: Add `build` to `for-loops/master.ts`**

Add this field to the exported `master` object, after `fix` and before
`stretch`:

```typescript
  build: {
    task: `Given \`prices = [10, 20, 30]\`, write code from scratch that computes
\`doubled\` as each price times 2 — using a single list comprehension, no
\`for\` statement — and prints it. It should print \`[20, 40, 60]\`.`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
assert doubled == [20, 40, 60], f"doubled came out as {doubled}, expected [20, 40, 60]."
assert any(isinstance(n, ast.ListComp) for n in ast.walk(tree)), "Right answer, but it's still a loop. Use a list comprehension: [ ... for p in prices]."
assert not any(isinstance(n, ast.For) for n in ast.walk(tree)), "The comprehension is there, but the old for loop is still hanging around. Delete it."
assert __stdout__.strip() == "[20, 40, 60]", f"It should print [20, 40, 60], but it printed {__stdout__.strip()!r}."`,
    },
  },
```

(Also a verbatim copy of that level's `fix.check`.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/topics/for-loops/advanced.ts src/content/topics/for-loops/master.ts
git commit -m "Author build content for for-loops levels 4-5"
```

---

### Task 5: `Build` UI component and `LoopShell` wiring

**Files:**
- Create: `src/ui/Build.tsx`
- Modify: `src/ui/LoopShell.tsx`

**Interfaces:**
- Consumes: `Level.build` (Task 3), `checkSubmission` (`src/engine/check.ts`,
  unchanged), `Runtime` (`src/engine/runtime.ts`, unchanged).
- Produces: `Build` component with props
  `{ build: NonNullable<Level['build']>; runtime: Runtime; onDone: (assisted: boolean) => void }`
  — `onDone` always receives `false` (Build has no assisted path), matching
  the signature `LoopShell` already wires to `Fix`.

- [ ] **Step 1: Create `src/ui/Build.tsx`**

This mirrors `src/ui/Fix.tsx`'s editor mechanics (Tab-to-indent,
Cmd/Ctrl+Enter to run, no autocapitalize/autocorrect/autocomplete) but starts
from an empty editor and has no hints or solution reveal:

```typescript
import { useState } from 'react'
import type { Level } from '../content/types'
import type { Runtime } from '../engine/runtime'
import { checkSubmission } from '../engine/check'
import type { CheckResult } from '../engine/types'
import { Markdown } from './Markdown'

export function Build({
  build,
  runtime,
  onDone,
}: {
  build: NonNullable<Level['build']>
  runtime: Runtime
  onDone: (assisted: boolean) => void
}) {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setResult(null)
    const r = await checkSubmission(runtime, code, build.check, build.stdin ?? '')
    setResult(r)
    setBusy(false)
  }

  const passed = result?.passed === true

  return (
    <div>
      <div className="mb-4" style={{ color: 'var(--ink)' }}>
        <Markdown text={build.task} />
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Tab') {
            e.preventDefault()
            const el = e.currentTarget
            const { selectionStart: s, selectionEnd: en } = el
            const next = code.slice(0, s) + '    ' + code.slice(en)
            setCode(next)
            requestAnimationFrame(() => el.setSelectionRange(s + 4, s + 4))
          }
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            void submit()
          }
        }}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        rows={Math.max(code.split('\n').length + 2, 8)}
        placeholder="Write it from here."
        className="mono w-full resize-y rounded p-4 text-[13px] leading-7"
        style={{
          background: 'var(--panel)',
          color: 'var(--ink)',
          border: `1px solid ${passed ? 'var(--good)' : 'var(--rule)'}`,
        }}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={submit}
          disabled={busy}
          className="label rounded px-5 py-2.5 text-[11px]"
          style={{ background: 'var(--amber)', color: 'var(--ground)', opacity: busy ? 0.5 : 1 }}
        >
          {busy ? 'Running…' : 'Run it'}
        </button>

        <button
          onClick={() => setCode('')}
          className="label rounded px-4 py-2.5 text-[11px]"
          style={{ border: '1px solid var(--rule)', color: 'var(--dim)' }}
        >
          Clear
        </button>
      </div>

      {result && (
        <div className="mt-5">
          {passed ? (
            <p className="label text-[11px]" style={{ color: 'var(--good)' }}>
              That's it
            </p>
          ) : (
            <>
              <p className="label mb-2 text-[11px]" style={{ color: 'var(--hot)' }}>
                Not yet
              </p>
              <p className="mono text-[13px]" style={{ color: 'var(--ink)' }}>
                {result.error?.line != null && (
                  <span style={{ color: 'var(--dim)' }}>line {result.error.line}: </span>
                )}
                {result.error?.msg}
              </p>
            </>
          )}
          {result.stdout && (
            <pre
              className="mono mt-3 whitespace-pre-wrap rounded p-3 text-[13px]"
              style={{ background: 'var(--ground)', color: 'var(--dim)' }}
            >
              {result.stdout}
            </pre>
          )}
        </div>
      )}

      {passed && (
        <button
          onClick={() => onDone(false)}
          className="label mt-6 rounded px-5 py-2.5 text-[11px]"
          style={{ background: 'var(--good)', color: 'var(--ground)' }}
        >
          Done →
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire it into `LoopShell.tsx`**

In `src/ui/LoopShell.tsx`:

Change the `Stage` type and `STAGES`/`LABELS` to be level-dependent (the
fourth stage is `'fix'` at levels 1–3, `'build'` at levels 4–5):

```typescript
import { Build } from './Build'
import type { LevelId } from '../content/types' // add LevelId to the existing named import from this module instead if one is already there
// ...
type Stage = 'concept' | 'watch' | 'predict' | 'fix' | 'build' | 'done'

const LABELS: Record<Stage, string> = {
  concept: 'Idea',
  watch: 'Watch',
  predict: 'Predict',
  fix: 'Fix',
  build: 'Build',
  done: 'Done',
}

/** Levels 4-5 compose from nothing; levels 1-3 repair something broken. */
const fourthStage = (level: LevelId): 'fix' | 'build' => (level >= 4 ? 'build' : 'fix')
```

Replace the module-level `const STAGES: Stage[] = [...]` with a function of
the current level, computed inside the component (it needs `level.level`):

```typescript
  const stages: Stage[] = ['concept', 'watch', 'predict', fourthStage(level.level), 'done']
```

Replace the stage-rail rendering block's reference to the old module-level
`STAGES` constant with this per-render `stages` array (only the two
`STAGES` occurrences change, to `stages` — everything else in the block is
unchanged):

```typescript
      <div className="mb-3 flex items-center gap-2">
        <button onClick={onExit} className="label mr-3 text-[10px]" style={{ color: 'var(--dim)' }}>
          ← Map
        </button>
        {stages.map((s) => {
          const done = stages.indexOf(s) < stages.indexOf(stage)
          const here = s === stage
          return (
            <div key={s} className="flex items-center gap-2">
              <span
                className="label text-[10px]"
                style={{ color: here ? 'var(--amber)' : done ? 'var(--good)' : 'var(--rule)' }}
              >
                {LABELS[s]}
              </span>
              {s !== 'done' && (
                <span style={{ color: 'var(--rule)' }} className="text-[10px]">
                  ·
                </span>
              )}
            </div>
          )
        })}
      </div>
```

In `Predict`'s `onDone`, route to whichever fourth stage this level uses:

```typescript
      {stage === 'predict' && (
        <Predict
          level={level}
          onDone={(correct) => {
            setPredictCorrect(correct)
            setStage(fourthStage(level.level))
          }}
        />
      )}
```

Replace the single `{stage === 'fix' && <Fix .../>}` block with both stages,
sharing the same completion handler:

```typescript
      {stage === 'fix' && (
        <Fix
          level={level}
          runtime={runtime}
          onDone={(assisted) => {
            onComplete({ predictCorrect, assisted })
            setStage('done')
          }}
        />
      )}

      {stage === 'build' && level.build && (
        <Build
          build={level.build}
          runtime={runtime}
          onDone={(assisted) => {
            onComplete({ predictCorrect, assisted })
            setStage('done')
          }}
        />
      )}

      {stage === 'build' && !level.build && (
        <p className="mono text-[13px]" style={{ color: 'var(--hot)' }}>
          This level is missing its build content — that's a content bug, not
          yours. (verify-content should have caught this before it shipped.)
        </p>
      )}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification in the browser**

Run `npm run dev`, open the app, go to **for-loops → Advanced**. Click
through Idea → Watch → Predict, and confirm:
- The stage rail now reads Idea · Watch · Predict · **Build** · Done (not Fix).
- The editor starts empty (not pre-filled with broken code).
- Typing `carts = [[5, 5], [10], [2, 3, 4]]` / `total = 0` / a nested loop /
  `print(total)` and clicking "Run it" shows "That's it" and a "Done →"
  button.
- Submitting empty or wrong code shows "Not yet" with the assertion message,
  and there is no hint button and no solution-reveal button anywhere on the
  page.

Repeat for **for-loops → Master**, confirming the list-comprehension check
behaves the same way. Then open **for-loops → Beginner** and confirm it still
shows **Fix** with broken starting code, unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/ui/Build.tsx src/ui/LoopShell.tsx
git commit -m "Add Build stage, replacing Fix at levels 4-5"
```

---

### Task 6: Gate `build` content in verify-content

**Files:**
- Modify: `scripts/verify-content.mjs`

**Interfaces:**
- Consumes: `lv.build`, `lv.fix.solution`, `runAsserts` (all already in scope
  in this script).

- [ ] **Step 1: Add the Build check**

In `scripts/verify-content.mjs`, immediately after the existing "4. FIX: the
SHIPPED solution must PASS its own check" block and before "5. Stretch code",
add:

```javascript
    // 4b. BUILD (levels 4 and 5 only): the schema requires it, and its check
    //     must be reachable. Proven using THIS level's own fix.solution as
    //     the witness — build.check is meant to be the same correctness bar
    //     as fix.check, so whatever solves Fix must also solve Build.
    if (lv.level >= 4) {
      if (!lv.build) bad('build: missing — required at levels 4 and 5')
      else if (!lv.build.task?.trim()) bad('build: task is empty')
      else {
        const w = JSON.parse(runAsserts(lv.fix.solution, lv.build.check.code, lv.build.stdin ?? lv.fix.stdin ?? ''))
        if (!w.passed) bad(`build: check not satisfiable — this level's fix.solution fails it: "${JSON.stringify(w.error)}"`)
        else ok('build: check reachable (verified via fix.solution)')
      }
    }
```

- [ ] **Step 2: Run it against current content**

Run: `npm run verify-content`
Expected: `for-loops` levels 4 and 5 now print `ok build: check reachable...`.
Every OTHER topic's levels 4 and 5 print `FAIL build: missing — required at
levels 4 and 5` (12 topics × 2 levels = 24 expected failures) — this is
correct and expected at this point in the plan; Task 8 closes every one of
them. The final line reports `24 FAILURE(S)`.

- [ ] **Step 3: Commit**

```bash
git add scripts/verify-content.mjs
git commit -m "Gate build content in verify-content"
```

---

### Task 7: Review UI — calendar, item flow, and session

**Files:**
- Create: `src/ui/ReviewCalendar.tsx`
- Create: `src/ui/ReviewItem.tsx`
- Create: `src/ui/Review.tsx`
- Modify: `src/ui/TopicMap.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `dueOn`, `recordReview`, `today`, `type DueItem`, `type Progress`
  (Task 2); `topicById`, `levelOf` (`content/topics/index.ts`, unchanged);
  `Watch`, `Predict` (existing components, unchanged); `Runtime`
  (`engine/runtime.ts`, unchanged).
- Produces: `Review` component with props
  `{ progress: Progress; runtime: Runtime; onExit: () => void; onRecord: (topicId: string, level: LevelId, correct: boolean) => void }`.

- [ ] **Step 1: Create `src/ui/ReviewCalendar.tsx`**

A single-month grid. Each day with items scheduled *exactly* on it shows a
count; only today (or an overdue past day) is clickable, future days are
inert:

```typescript
import { useState } from 'react'
import type { Progress } from '../progress/store'
import { today } from '../progress/store'

function monthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startPad = first.getDay() // 0 = Sunday
  const days: (string | null)[] = Array(startPad).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d)
    days.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`)
  }
  return days
}

function countOn(progress: Progress, day: string): number {
  let n = 0
  for (const tp of Object.values(progress.topics)) {
    for (const lp of Object.values(tp.levels)) {
      if (lp?.nextReviewDue === day) n++
    }
  }
  return n
}

export function ReviewCalendar({
  progress,
  onOpenDay,
}: {
  progress: Progress
  onOpenDay: (day: string) => void
}) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const todayStr = today()
  const days = monthGrid(year, month)
  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <button onClick={() => shift(-1)} className="label text-[11px]" style={{ color: 'var(--dim)' }}>←</button>
        <span className="label text-[13px]" style={{ color: 'var(--ink)' }}>{monthLabel}</span>
        <button onClick={() => shift(1)} className="label text-[11px]" style={{ color: 'var(--dim)' }}>→</button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} />
          const count = countOn(progress, day)
          const isPast = day <= todayStr
          const clickable = count > 0 && isPast
          return (
            <button
              key={day}
              disabled={!clickable}
              onClick={() => clickable && onOpenDay(day)}
              className="mono flex flex-col items-center rounded p-2 text-[11px]"
              style={{
                border: `1px solid ${day === todayStr ? 'var(--amber)' : 'var(--rule)'}`,
                color: clickable ? 'var(--amber)' : 'var(--dim)',
                opacity: clickable ? 1 : 0.6,
              }}
            >
              <span>{Number(day.slice(-2))}</span>
              {count > 0 && <span style={{ color: 'var(--good)' }}>{count}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/ui/ReviewItem.tsx`**

One scheduled item: ask the Predict; if wrong, replay the Watch trace, ask
Predict again for reinforcement, but the *recorded* outcome always reflects
the first (real) answer:

```typescript
import { useState } from 'react'
import { levelName, type Level, type Topic } from '../content/types'
import type { Runtime } from '../engine/runtime'
import type { TraceResult } from '../engine/types'
import { Watch } from './Watch'
import { Predict } from './Predict'

type Stage = 'predict' | 'replay' | 'reask'

export function ReviewItem({
  topic,
  level,
  runtime,
  onFinished,
}: {
  topic: Topic
  level: Level
  runtime: Runtime
  onFinished: (correct: boolean) => void
}) {
  const [stage, setStage] = useState<Stage>('predict')
  const [trace, setTrace] = useState<TraceResult | null>(null)
  const [tracing, setTracing] = useState(false)

  function handleFirstAnswer(correct: boolean) {
    if (correct) {
      onFinished(true)
      return
    }
    setTracing(true)
    runtime.trace(level.watch.code, level.watch.stdin ?? '').then((r) => {
      setTrace(r)
      setTracing(false)
      setStage('replay')
    })
  }

  return (
    <div>
      <p className="label mb-4 text-[10px]" style={{ color: 'var(--dim)' }}>
        {topic.title} · <span style={{ color: 'var(--amber)' }}>{levelName(level.level)}</span> · review
      </p>

      {stage === 'predict' && <Predict level={level} onDone={handleFirstAnswer} />}

      {stage === 'replay' &&
        (tracing || !trace ? (
          <p style={{ color: 'var(--dim)' }}>Tracing…</p>
        ) : (
          <div>
            <p className="label mb-3 text-[10px]" style={{ color: 'var(--amber)' }}>
              Missed it — here's the trace again
            </p>
            <Watch
              code={level.watch.code}
              result={trace}
              notes={level.watch.notes}
              loading={false}
              onDone={() => setStage('reask')}
            />
          </div>
        ))}

      {stage === 'reask' && (
        <div>
          <p className="label mb-3 text-[10px]" style={{ color: 'var(--dim)' }}>
            Once more, now that you've seen it
          </p>
          {/* This second attempt is for reinforcement only — the schedule
              already recorded the miss from the first, real attempt. */}
          <Predict level={level} onDone={() => onFinished(false)} />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create `src/ui/Review.tsx`**

Orchestrates calendar → queue → items:

```typescript
import { useState } from 'react'
import type { LevelId } from '../content/types'
import { topicById, levelOf } from '../content/topics'
import type { Runtime } from '../engine/runtime'
import { dueOn, type DueItem, type Progress } from '../progress/store'
import { ReviewCalendar } from './ReviewCalendar'
import { ReviewItem } from './ReviewItem'

export function Review({
  progress,
  runtime,
  onExit,
  onRecord,
}: {
  progress: Progress
  runtime: Runtime
  onExit: () => void
  onRecord: (topicId: string, level: LevelId, correct: boolean) => void
}) {
  const [queue, setQueue] = useState<DueItem[] | null>(null) // null = showing the calendar

  if (queue === null) {
    return (
      <div>
        <button onClick={onExit} className="label mb-6 text-[10px]" style={{ color: 'var(--dim)' }}>
          ← Map
        </button>
        <ReviewCalendar progress={progress} onOpenDay={(day) => setQueue(dueOn(progress, day))} />
      </div>
    )
  }

  if (queue.length === 0) {
    return (
      <div>
        <p className="label text-[13px]" style={{ color: 'var(--good)' }}>All caught up.</p>
        <button
          onClick={() => setQueue(null)}
          className="label mt-4 text-[10px]"
          style={{ color: 'var(--dim)' }}
        >
          ← Calendar
        </button>
      </div>
    )
  }

  const [current, ...rest] = queue
  const topic = topicById(current.topicId)
  const level = topic && levelOf(topic, current.level)
  if (!topic || !level) {
    setQueue(rest) // stale reference (content changed since scheduling); skip it
    return null
  }

  return (
    <ReviewItem
      key={`${current.topicId}-${current.level}`}
      topic={topic}
      level={level}
      runtime={runtime}
      onFinished={(correct) => {
        onRecord(current.topicId, current.level, correct)
        setQueue(rest)
      }}
    />
  )
}
```

- [ ] **Step 4: Add the entry point to `TopicMap.tsx`**

Add two new props and a line under the tagline:

```typescript
export function TopicMap({
  progress,
  onPick,
  dueTodayCount,
  onOpenReview,
}: {
  progress: Progress
  onPick: (topicId: string, level: LevelId) => void
  dueTodayCount: number
  onOpenReview: () => void
}) {
```

Immediately after the existing tagline `<p>` (the "One concept at a time..."
paragraph), add:

```typescript
      {dueTodayCount > 0 && (
        <button
          onClick={onOpenReview}
          className="label mt-4 text-[11px]"
          style={{ color: 'var(--amber)' }}
        >
          {dueTodayCount} to review today →
        </button>
      )}
```

- [ ] **Step 5: Wire `App.tsx`**

```typescript
import { Review } from './ui/Review'
import { completeLevel, dueOn, load, recordReview, save, today, type Progress } from './progress/store'
// ...
  const [reviewOpen, setReviewOpen] = useState(false)
  // ...
  return (
    <div className="mx-auto min-h-full max-w-4xl px-6 py-10 sm:px-10 sm:py-16">
      {topic && level ? (
        <LoopShell
          topic={topic}
          level={level}
          runtime={runtime}
          onComplete={(outcome) =>
            setProgress((p) => completeLevel(p, topic.id, level.level, outcome))
          }
          onExit={() => setOpen(null)}
          onNextLevel={(next: Level) => setOpen({ topicId: topic.id, level: next.level })}
        />
      ) : reviewOpen ? (
        <Review
          progress={progress}
          runtime={runtime}
          onExit={() => setReviewOpen(false)}
          onRecord={(topicId, lvl, correct) =>
            setProgress((p) => recordReview(p, topicId, lvl, correct))
          }
        />
      ) : (
        <TopicMap
          progress={progress}
          onPick={(topicId, lvl) => setOpen({ topicId, level: lvl })}
          dueTodayCount={dueOn(progress, today()).length}
          onOpenReview={() => setReviewOpen(true)}
        />
      )}
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Manual verification in the browser**

Run `npm run dev`. Since a fresh `localStorage` has no completed levels, there
is nothing to review yet, so first:
1. Clear a couple of levels normally (e.g. for-loops Beginner and Working)
   through the loop, to seed `nextReviewDue` for tomorrow.
2. Open the browser devtools console and run:
   `JSON.parse(localStorage.getItem('pyloop.progress.v1'))` — confirm the
   cleared levels show a `nextReviewDue` one day out and `reviewIntervalDays: 1`.
3. To actually exercise Review without waiting a day, in the console, patch
   one level's `nextReviewDue` back to today's date directly in the parsed
   object and `localStorage.setItem('pyloop.progress.v1', JSON.stringify(patched))`,
   then reload the app.
4. Confirm the TopicMap now shows "1 to review today →". Click it.
5. Confirm the calendar shows today's cell with a count, and it's clickable.
   Click it.
6. Answer the Predict correctly — confirm it returns to "All caught up" (or
   the next queued item) without ever showing a Watch replay.
7. Reset that level's `nextReviewDue` to today again the same way, reload,
   re-enter Review, and this time answer the Predict incorrectly — confirm
   the Watch trace replays read-only, then Predict asks again, and after that
   second answer (regardless of it) the queue advances.
8. Confirm `nextReviewDue` in devtools now reflects the correct/incorrect
   outcome of the FIRST answer (3 days out if correct, 1 day out if wrong) —
   not affected by the reinforcement re-ask.

- [ ] **Step 8: Commit**

```bash
git add src/ui/ReviewCalendar.tsx src/ui/ReviewItem.tsx src/ui/Review.tsx src/ui/TopicMap.tsx src/App.tsx
git commit -m "Add Review deck: calendar, scheduled items, TopicMap entry point"
```

---

### Task 8: Author `build` content for the remaining 12 topics

**Files:**
- Modify: `src/content/topics/variables-and-types/advanced.ts` and `master.ts`
- Modify: `src/content/topics/input-output/advanced.ts` and `master.ts`
- Modify: `src/content/topics/operators/advanced.ts` and `master.ts`
- Modify: `src/content/topics/conditionals/advanced.ts` and `master.ts`
- Modify: `src/content/topics/while-loops/advanced.ts` and `master.ts`
- Modify: `src/content/topics/functions/advanced.ts` and `master.ts`
- Modify: `src/content/topics/strings/advanced.ts` and `master.ts`
- Modify: `src/content/topics/lists-and-tuples/advanced.ts` and `master.ts`
- Modify: `src/content/topics/dicts-and-sets/advanced.ts` and `master.ts`
- Modify: `src/content/topics/files/advanced.ts` and `master.ts`
- Modify: `src/content/topics/exceptions/advanced.ts` and `master.ts`
- Modify: `src/content/topics/classes/advanced.ts` and `master.ts`

(24 files. `for-loops` was already done in Task 4 — do not repeat it.)

**Interfaces:**
- Consumes: nothing new — this is content only, using the `Level.build` type
  from Task 3 and the pattern proven in Task 4.

- [ ] **Step 1: For each of the 24 files above, add a `build` field**

For each `advanced.ts` / `master.ts` file:

1. Open the file and read its existing `fix` field: `fix.task` (what the
   lesson is teaching), `fix.brokenCode` (what data/setup already exists —
   this tells you what literal values the learner needs to be told about,
   since Build has no starting code to imply them), and `fix.check` (the
   exact correctness bar to copy).
2. Add a `build` field, placed after `fix` and before `stretch` (or at the
   end of the object if there's no `stretch`), of this shape:

   ```typescript
     build: {
       task: `<one to three sentences: state any literal values the learner
   needs (the same ones fix.brokenCode already assumed), what to write from
   scratch, and what it should print or produce — phrased as a "write this"
   task, not a "fix this" task>`,
       check: {
         kind: 'asserts',
         code: `<paste fix.check.code here VERBATIM, unchanged>`,
       },
     },
   ```

   If that level's `fix` declares a `stdin`, also copy it onto `build.stdin`
   verbatim.
3. Use `src/content/topics/for-loops/advanced.ts` and
   `src/content/topics/for-loops/master.ts` (from Task 4) as the worked
   examples for tone and shape — the task sentence names the same
   literal/setup the old `brokenCode` had, states the goal in "write" terms,
   and states the expected output plainly.

- [ ] **Step 2: Typecheck after every few files (don't wait until the end)**

Run: `npx tsc --noEmit`
Expected: no errors. Run this after roughly every 4-6 files so a typo doesn't
compound across all 24.

- [ ] **Step 3: Run full content verification**

Run: `npm run verify-content`
Expected: `ALL CONTENT CHECKS PASSED` — every topic's levels 4 and 5 now print
`ok build: check reachable...` and the failure count is 0.

- [ ] **Step 4: Run the full test suite one more time**

Run: `npm test`
Expected: all tests still pass (content changes shouldn't touch engine tests,
but confirm nothing regressed).

- [ ] **Step 5: Commit**

```bash
git add src/content/topics/
git commit -m "Author build content for the remaining 12 topics"
```

---

### Task 9: Final end-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Full automated check**

Run, in order:

```bash
npm test
npm run verify-content
npx tsc --noEmit
```

Expected: all three clean (78+ new tests passing, `ALL CONTENT CHECKS
PASSED`, zero type errors).

- [ ] **Step 2: Manual spot-check across topics**

Run `npm run dev`. Pick three topics you haven't already checked in Task 5
or Task 7 (e.g. `dicts-and-sets`, `exceptions`, `classes`) and for each, open
**Advanced**, confirm Build shows a blank editor with a real task and passes
on a correct from-scratch answer; open **Master**, same check.

- [ ] **Step 3: Commit any final fixes**

If Step 2 surfaces anything (a task sentence that's ambiguous, a check
that's too strict), fix it in the relevant content file, re-run
`npm run verify-content`, and commit:

```bash
git add -A
git commit -m "Fix content issues found in manual spot-check"
```

(Skip this commit if Step 2 found nothing to fix.)
