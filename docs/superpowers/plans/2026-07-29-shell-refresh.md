# Shell & Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give PyLoop a real app shell (slim sticky nav), a dashboard-style
topic map (resume card + card grid + progress bars), and a quiet motion/depth
system — same identity, higher production value, zero gamification.

**Architecture:** UI-only. A new `Shell` component wraps every mode and owns
global wayfinding plus the runtime status indicator; `TopicMap` is rebuilt
into a resume-card + 3-across card grid with an in-grid level picker; shared
motion utilities (`fade-rise`, `bar-fill`, `.lift`) and a named type scale
(`t-label`/`t-mono`/`t-body`/`t-lead`/`t-title`/`t-display`) live in
`index.css` and are consumed everywhere. Engine, tracer, content, and
progress store are untouched by definition.

**Tech Stack:** React 19, TypeScript 5.9, Tailwind 3 utilities + CSS
variables in `src/index.css`. No new dependencies.

## Global Constraints

- No new dependencies (spec: "No new dependencies").
- UI-only: any diff to `src/engine/`, `src/progress/`, `src/content/`, or
  `scripts/` is a scope violation (spec: "UI-only"). `npm test` and
  `npm run verify-content` must stay green untouched.
- No XP, streaks, level badges, leaderboards, mascots, sound, urgency
  timers, or red notification badges (declined 2026-07-15, reaffirmed
  2026-07-29).
- The lesson loop stays one-thing-at-a-time — no side-by-side lesson pane.
- Desktop only. The grid may wrap at narrow widths; no mobile work.
- All new animation must obey the existing `prefers-reduced-motion` kill
  switch already in `index.css` (it zeroes all animation/transition
  durations globally — new animations get no exemption or workaround).
- Motion rules: nothing loops, nothing bounces, nothing blocks input;
  motion only accompanies a user-caused state change.
- Palette and fonts are frozen: only the existing CSS variables
  (`--ground`, `--panel`, `--panel-hi`, `--rule`, `--ink`, `--dim`,
  `--amber`, `--hot`, `--good`) and font stacks may be used.

---

### Task 1: Type scale and motion utilities in `index.css`

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- Produces (consumed by every later task):
  - Size classes: `.t-label` (11px), `.t-mono` (13px), `.t-body` (1rem),
    `.t-lead` (1.125rem), `.t-title` (1.875rem), `.t-display` (3rem)
  - Motion classes: `.fade-rise` (180ms enter), `.bar-fill` (400ms width
    fill), `.lift` (120ms hover/focus depth treatment)

- [ ] **Step 1: Add the type scale and motion utilities**

In `src/index.css`, after the existing `.mono` rule and before the heat
rules, insert:

```css
/* Named type scale — the only font sizes components may use. `.label` and
   `.mono` set face; these set size. Absorbs the old ad-hoc sizes:
   text-[10px]/text-[11px] -> t-label, text-[13px]/[15px] -> t-mono,
   text-sm/text-base -> t-body, text-lg -> t-lead, text-3xl -> t-title,
   text-5xl -> t-display. */
.t-label { font-size: 11px; }
.t-mono { font-size: 13px; }
.t-body { font-size: 1rem; }
.t-lead { font-size: 1.125rem; }
.t-title { font-size: 1.875rem; line-height: 1.15; }
.t-display { font-size: 3rem; line-height: 1.05; }

/* Enter animation for user-caused state changes: stage advances, panel
   expansion, the Done heading. Never used in a loop. */
@keyframes fade-rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.fade-rise {
  animation: fade-rise 180ms ease-out;
}

/* Progress bars fill from zero once, on mount. */
@keyframes bar-fill {
  from {
    width: 0;
  }
}
.bar-fill {
  animation: bar-fill 400ms ease-out;
}

/* The app's one depth treatment: resting = flat hairline; hover/focus =
   amber-tinted border, raised background, 1px lift, soft shadow. */
.lift {
  transition:
    border-color 120ms ease-out,
    background-color 120ms ease-out,
    transform 120ms ease-out,
    box-shadow 120ms ease-out;
}
.lift:hover,
.lift:focus-visible {
  border-color: rgba(255, 182, 39, 0.45) !important;
  background-color: var(--panel-hi) !important;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}
```

(The `!important`s are needed because most components set `border` and
`background` via inline `style={}`, which otherwise beats any class. This is
the one sanctioned use; do not add others.)

- [ ] **Step 2: Typecheck and eyeball**

Run: `npx tsc --noEmit` (expected: clean — CSS only) and `npm run dev`, then
confirm in the browser that nothing visually changed yet (no component uses
the new classes).

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "Add named type scale and shared motion utilities"
```

---

### Task 2: `Shell` component and `App.tsx` wiring

**Files:**
- Create: `src/ui/Shell.tsx`
- Modify: `src/App.tsx`
- Modify: `src/ui/LoopShell.tsx` (remove the rail's `← Map` button only)
- Modify: `src/ui/Review.tsx` (remove the `← Map` button and `onExit` prop)

**Interfaces:**
- Consumes: `.t-label` from Task 1; `RuntimeStatus` from
  `src/engine/runtime.ts` (existing).
- Produces: `Shell` component with props
  `{ mode: 'map' | 'review' | 'loop'; status: RuntimeStatus; dueTodayCount: number; onMap: () => void; onReview: () => void; children: ReactNode }`
  and exported type `ShellMode = 'map' | 'review' | 'loop'`.
- Removes: `Review`'s `onExit` prop (header nav replaces it). `LoopShell`
  keeps its `onExit` prop — `Done`'s "Back to the map" still uses it.

- [ ] **Step 1: Create `src/ui/Shell.tsx`**

```tsx
import type { ReactNode } from 'react'
import type { RuntimeStatus } from '../engine/runtime'

export type ShellMode = 'map' | 'review' | 'loop'

const STATUS: Record<RuntimeStatus, { color: string; text: string }> = {
  ready: { color: 'var(--good)', text: 'python ready' },
  booting: { color: 'var(--amber)', text: 'warming up' },
  dead: { color: 'var(--hot)', text: 'restarting' },
}

/** The app's chrome: answers "where in the app am I" from anywhere.
 *  The loop's stage rail (inside LoopShell) still answers "where in the
 *  seven minutes" — different question, different bar. */
export function Shell({
  mode,
  status,
  dueTodayCount,
  onMap,
  onReview,
  children,
}: {
  mode: ShellMode
  status: RuntimeStatus
  dueTodayCount: number
  onMap: () => void
  onReview: () => void
  children: ReactNode
}) {
  const s = STATUS[status]
  return (
    <div className="min-h-full">
      <header
        className="sticky top-0 z-10"
        style={{
          background: 'rgba(23, 21, 15, 0.82)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--rule)',
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-8 px-6 py-3 sm:px-10">
          <button onClick={onMap} className="label t-label" style={{ color: 'var(--ink)' }}>
            PyLoop
          </button>
          <nav className="flex items-center gap-5">
            <button
              onClick={onMap}
              className="label t-label"
              style={{ color: mode === 'map' ? 'var(--amber)' : 'var(--dim)' }}
            >
              Map
            </button>
            <button
              onClick={onReview}
              className="label t-label"
              style={{ color: mode === 'review' ? 'var(--amber)' : 'var(--dim)' }}
            >
              Review{dueTodayCount > 0 ? ` · ${dueTodayCount}` : ''}
            </button>
          </nav>
          <span className="ml-auto flex items-center gap-2">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: s.color }}
            />
            <span className="label t-label" style={{ color: 'var(--dim)' }}>
              {s.text}
            </span>
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10 sm:px-10 sm:py-12">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite `src/App.tsx` to wrap everything in `Shell`**

Replace the whole return (and drop the footer status line — the shell owns
status now):

```tsx
import { useEffect, useMemo, useState } from 'react'
import { Runtime, type RuntimeStatus } from './engine/runtime'
import { levelOf, topicById } from './content/topics'
import type { Level, LevelId } from './content/types'
import { TopicMap } from './ui/TopicMap'
import { LoopShell } from './ui/LoopShell'
import { Review } from './ui/Review'
import { Shell, type ShellMode } from './ui/Shell'
import { completeLevel, dueOn, load, recordReview, save, today, type Progress } from './progress/store'

type Open = { topicId: string; level: LevelId }

export default function App() {
  const [status, setStatus] = useState<RuntimeStatus>('booting')
  // One runtime for the app's lifetime. It restarts itself internally when a
  // snippet runs away, so nothing above here has to care.
  const runtime = useMemo(() => new Runtime(setStatus), [])
  const [progress, setProgress] = useState<Progress>(() => load())
  const [open, setOpen] = useState<Open | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)

  useEffect(() => {
    save(progress)
  }, [progress])

  const topic = open ? topicById(open.topicId) : null
  const level = topic && open ? levelOf(topic, open.level) : null
  const mode: ShellMode = topic && level ? 'loop' : reviewOpen ? 'review' : 'map'

  return (
    <Shell
      mode={mode}
      status={status}
      dueTodayCount={dueOn(progress, today()).length}
      onMap={() => {
        setOpen(null)
        setReviewOpen(false)
      }}
      onReview={() => {
        setOpen(null)
        setReviewOpen(true)
      }}
    >
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
    </Shell>
  )
}
```

- [ ] **Step 3: Remove the rail's `← Map` button from `LoopShell.tsx`**

Delete exactly this block from the stage-rail div (the header's Map now
covers it; `onExit` stays — `Done` still consumes it):

```tsx
        <button onClick={onExit} className="label mr-3 text-[10px]" style={{ color: 'var(--dim)' }}>
          ← Map
        </button>
```

- [ ] **Step 4: Remove `← Map` and the `onExit` prop from `Review.tsx`**

In `src/ui/Review.tsx`: delete the `onExit` prop from the signature and
props type, and delete the `← Map` button from the returned JSX, leaving:

```tsx
export function Review({
  progress,
  runtime,
  onRecord,
}: {
  progress: Progress
  runtime: Runtime
  onRecord: (topicId: string, level: LevelId, correct: boolean) => void
}) {
  const [queue, setQueue] = useState<DueItem[] | null>(null) // null = showing the calendar

  return <div>{renderBody()}</div>
  // renderBody() unchanged below this line, including its "← Calendar"
  // button — that's within-mode navigation the header can't express.
```

- [ ] **Step 5: Typecheck, test, and verify in the browser**

Run: `npx tsc --noEmit && npm test` — expected: clean, all tests pass.
Then in the dev server verify:
- Sticky header on all three modes: map, review (click Review), and in-loop
  (open any rung) — content scrolls under a blurred header.
- Active nav item is amber and matches the mode; `PyLoop` and `Map` both
  return to the map from anywhere, including mid-loop and mid-review-item.
- The Python status dot/label sits at the right of the header and the old
  footer line is gone.
- With one item due (seed via devtools as in prior sessions), the header
  reads `Review · 1` with no red badge.

- [ ] **Step 6: Commit**

```bash
git add src/ui/Shell.tsx src/App.tsx src/ui/LoopShell.tsx src/ui/Review.tsx
git commit -m "Add app shell: sticky nav, runtime status, header-owned wayfinding"
```

---

### Task 3: `ProgressBar` and the TopicMap dashboard rebuild

**Files:**
- Create: `src/ui/ProgressBar.tsx`
- Modify: `src/ui/TopicMap.tsx` (full rebuild, same props)

**Interfaces:**
- Consumes: `.t-*`, `.fade-rise`, `.bar-fill`, `.lift` (Task 1); existing
  store helpers `clearedCount`, `isLevelDone`, `needsAnotherLook`,
  `nextLevel`; `topics` from `content/topics`; `levelName` from
  `content/types`.
- Produces:
  - `ProgressBar` with props `{ clean: number; shaky: number; total: number }`
    (clean = cleared without help, shaky = cleared but flagged
    needs-another-look; green then amber segments).
  - `TopicMap` keeps its exact existing props:
    `{ progress, onPick, dueTodayCount, onOpenReview }`.

- [ ] **Step 1: Create `src/ui/ProgressBar.tsx`**

```tsx
/** Thin two-segment progress bar: green for clean clears, amber for rungs
 *  cleared with help or a guessed prediction ("worth another go"). Fills
 *  from zero once on mount. Replaces the old dot pips. */
export function ProgressBar({
  clean,
  shaky,
  total,
}: {
  clean: number
  shaky: number
  total: number
}) {
  const filled = total > 0 ? ((clean + shaky) / total) * 100 : 0
  return (
    <div
      className="h-1 w-full overflow-hidden rounded-full"
      style={{ background: 'var(--rule)' }}
      aria-label={`${clean + shaky} of ${total} cleared${shaky ? `, ${shaky} worth another go` : ''}`}
    >
      <div className="bar-fill flex h-full" style={{ width: `${filled}%` }}>
        <div style={{ flex: clean, background: 'var(--good)' }} />
        <div style={{ flex: shaky, background: 'var(--amber)' }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Rebuild `src/ui/TopicMap.tsx`**

Replace the entire file:

```tsx
import { Fragment, useState } from 'react'
import { topics } from '../content/topics'
import { levelName, type LevelId, type Topic } from '../content/types'
import {
  clearedCount,
  isLevelDone,
  needsAnotherLook,
  nextLevel,
  type Progress,
} from '../progress/store'
import { ProgressBar } from './ProgressBar'

/** First topic in course order with an uncleared rung — what Continue
 *  points at. Null once every rung in the course is cleared. */
function firstUnfinished(progress: Progress): { topic: Topic; level: LevelId } | null {
  for (const t of topics) {
    const next = nextLevel(progress, t.id, t.levels.map((l) => l.level))
    if (next !== null) return { topic: t, level: next }
  }
  return null
}

function shakyCount(progress: Progress, topicId: string, ids: LevelId[]): number {
  return ids.filter((l) => needsAnotherLook(progress, topicId, l)).length
}

function chunk<T>(xs: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n))
  return out
}

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
  const [openId, setOpenId] = useState<string | null>(null)
  const resume = firstUnfinished(progress)
  const resumeLevel = resume?.topic.levels.find((l) => l.level === resume.level)

  return (
    <div>
      <h1 className="label t-display" style={{ color: 'var(--ink)' }}>
        PyLoop
      </h1>
      <p className="t-lead mt-3 max-w-lg" style={{ color: 'var(--dim)' }}>
        One concept at a time. Watch it run, call the output, fix a broken one or build one
        from scratch. About seven minutes a rung.
      </p>

      {/* The single most likely action: the next unfinished rung. */}
      {resume && resumeLevel && (
        <button
          onClick={() => onPick(resume.topic.id, resume.level)}
          className="lift mt-8 w-full rounded p-5 text-left"
          style={{ background: 'var(--panel)', border: '1px solid var(--amber)' }}
        >
          <span className="label t-label" style={{ color: 'var(--amber)' }}>
            Continue · {resume.topic.title} · {levelName(resume.level)}
          </span>
          <p className="t-lead mt-1.5" style={{ color: 'var(--ink)' }}>
            {resumeLevel.blurb}
          </p>
        </button>
      )}

      {/* Quiet when nothing's due; visible without shouting when something is. */}
      {dueTodayCount > 0 && (
        <button
          onClick={onOpenReview}
          className="lift mt-3 w-full rounded p-4 text-left"
          style={{ background: 'var(--panel)', border: '1px solid var(--rule)' }}
        >
          <span className="label t-label" style={{ color: 'var(--amber)' }}>
            {dueTodayCount} to review today →
          </span>
        </button>
      )}

      <div className="mt-8 space-y-3">
        {chunk(topics, 3).map((row, rowIdx) => {
          const openTopic = row.find((t) => t.id === openId)
          return (
            <Fragment key={rowIdx}>
              <div className="grid grid-cols-3 gap-3">
                {row.map((t) => {
                  const ids = t.levels.map((l) => l.level)
                  const cleared = clearedCount(progress, t.id)
                  const shaky = shakyCount(progress, t.id, ids)
                  const next = nextLevel(progress, t.id, ids)
                  const nextLv = next ? t.levels.find((l) => l.level === next) : null
                  const open = openId === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => setOpenId(open ? null : t.id)}
                      aria-expanded={open}
                      className="lift rounded p-4 text-left"
                      style={{
                        background: 'var(--panel)',
                        border: `1px solid ${open ? 'rgba(255, 182, 39, 0.45)' : 'var(--rule)'}`,
                      }}
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="label t-label" style={{ color: 'var(--dim)' }}>
                          {t.order}
                        </span>
                        <span className="mono t-mono flex-1" style={{ color: 'var(--ink)' }}>
                          {t.title}
                        </span>
                        <span className="label t-label" style={{ color: 'var(--dim)' }}>
                          {cleared}/{t.levels.length}
                        </span>
                      </div>
                      <div className="mt-3">
                        <ProgressBar
                          clean={cleared - shaky}
                          shaky={shaky}
                          total={t.levels.length}
                        />
                      </div>
                      <p className="t-mono mt-3 truncate" style={{ color: 'var(--dim)' }}>
                        {nextLv ? `${levelName(nextLv.level)} · ${nextLv.blurb}` : 'All five cleared'}
                      </p>
                    </button>
                  )
                })}
              </div>

              {/* Level picker: expands in place below the open card's row.
                  A panel, not a modal — modals are a different app. */}
              {openTopic && (
                <div
                  className="fade-rise space-y-px rounded"
                  style={{ background: 'var(--rule)', border: '1px solid var(--rule)' }}
                >
                  {openTopic.levels.map((lv) => {
                    const done = isLevelDone(progress, openTopic.id, lv.level)
                    const shakyLv = needsAnotherLook(progress, openTopic.id, lv.level)
                    const ids = openTopic.levels.map((l) => l.level)
                    const isNext = nextLevel(progress, openTopic.id, ids) === lv.level
                    const mark = done ? (shakyLv ? 'var(--amber)' : 'var(--good)') : null
                    return (
                      <button
                        key={lv.level}
                        onClick={() => onPick(openTopic.id, lv.level)}
                        className="flex w-full items-center gap-4 px-4 py-3 text-left"
                        style={{ background: 'var(--ground)' }}
                      >
                        <span
                          className="label t-label flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                          style={{
                            background: done && !shakyLv ? 'var(--good)' : 'transparent',
                            border: `1px solid ${mark ?? (isNext ? 'var(--amber)' : 'var(--rule)')}`,
                            color: done
                              ? shakyLv
                                ? 'var(--amber)'
                                : 'var(--ground)'
                              : isNext
                                ? 'var(--amber)'
                                : 'var(--dim)',
                          }}
                        >
                          {done ? '✓' : lv.level}
                        </span>
                        <span className="w-24 shrink-0">
                          <span
                            className="label t-label"
                            style={{ color: mark ?? (isNext ? 'var(--amber)' : 'var(--ink)') }}
                          >
                            {levelName(lv.level)}
                          </span>
                        </span>
                        <span className="t-body flex-1" style={{ color: 'var(--dim)' }}>
                          {lv.blurb}
                        </span>
                        <span
                          className="label t-label"
                          style={{ color: shakyLv ? 'var(--amber)' : 'var(--rule)' }}
                        >
                          {shakyLv ? 'Worth another go' : done ? 'Again' : isNext ? 'Next' : 'Jump'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </Fragment>
          )
        })}
      </div>

      <p className="t-body mt-12 max-w-lg" style={{ color: 'var(--rule)' }}>
        Nothing is locked. If Beginner insults you, jump to Advanced — the ladder is a
        suggestion, not a gate.
      </p>
    </div>
  )
}
```

(Notes for the implementer: `openId` now starts `null` — the resume card
already answers "where do I go", so no card needs to start expanded. The old
`Pips` component is gone entirely. Cards keep their whole body clickable;
the expanded row keeps the exact status-language of the old accordion —
`Next`/`Again`/`Jump`/`Worth another go` — so no progress vocabulary is
lost.)

- [ ] **Step 3: Typecheck and test**

Run: `npx tsc --noEmit && npm test`
Expected: clean. (`Pips` was private to TopicMap.tsx, so nothing else breaks.)

- [ ] **Step 4: Verify in the browser**

In the dev server, against each of these localStorage states (set via
devtools console, reload between):

1. **Fresh** (`localStorage.removeItem('pyloop.progress.v1')`): Resume card
   points at variables-and-types · Beginner; no review strip; all 13 cards
   show empty bars, subtext = Beginner blurbs.
2. **Partial** (clear a rung or two by playing, or seed): Resume card moves
   to the first unfinished rung; cleared topic's bar shows green; a rung
   cleared with the solution shows an amber segment.
3. **Something due** (seed `nextReviewDue` = today as in earlier sessions):
   review strip appears between Resume and the grid; header shows
   `Review · N`.
4. Click a card → level picker expands in place beneath that card's row
   with a fade-rise; click another card → picker moves; click the open card
   → closes. Rung rows launch the right lesson.
5. Bars animate their fill exactly once, on page load, ~400ms.

- [ ] **Step 5: Commit**

```bash
git add src/ui/ProgressBar.tsx src/ui/TopicMap.tsx
git commit -m "Rebuild TopicMap as dashboard: resume card, card grid, progress bars"
```

---

### Task 4: Loop stage transitions and Done's moment

**Files:**
- Modify: `src/ui/LoopShell.tsx`
- Modify: `src/ui/Done.tsx`

**Interfaces:**
- Consumes: `.fade-rise`, `.lift`, `.t-*` (Task 1). No signature changes to
  either component.

- [ ] **Step 1: Cross-fade stages in `LoopShell.tsx`**

Wrap the five stage blocks (`concept`, `watch`, `predict`, `fix`/`build`,
`done`) in a single keyed container so React remounts it per stage, playing
the enter animation (the spec's cross-fade: enter-only, one direction, no
exit choreography):

```tsx
      <div key={stage} className="fade-rise">
        {stage === 'concept' && (
          /* ...existing concept JSX unchanged... */
        )}
        {/* ...all other stage blocks, unchanged, moved inside this div... */}
      </div>
```

The completion handlers must stay exactly as they are — `onComplete` fires
on click, before the next stage's animation, so progress persistence is
never gated on motion.

- [ ] **Step 2: Stage-rail underline in `LoopShell.tsx`**

In the stage rail's label `<span>`, add an animated underline via
border (the "movement" reads as the lit underline advancing to the next
label):

```tsx
              <span
                className="label t-label"
                style={{
                  color: here ? 'var(--amber)' : done ? 'var(--good)' : 'var(--rule)',
                  borderBottom: `2px solid ${here ? 'var(--amber)' : 'transparent'}`,
                  paddingBottom: 2,
                  transition: 'border-color 120ms ease-out, color 120ms ease-out',
                }}
              >
                {LABELS[s]}
              </span>
```

Also update the rail's own sizes while in the file: every `text-[10px]` in
the rail and the rung-position line becomes `t-label` (keep the `label`
class as-is).

- [ ] **Step 3: Done's completion beat in `Done.tsx`**

- Wrap the heading block (the `<p>` kicker + `<h2>` + summary `<p>`) in
  `<div className="fade-rise">…</div>`. (The whole screen already remounts
  per stage from Step 1; this second fade-rise on the heading alone is the
  deliberate "one celebratory beat" — quiet, silent, no confetti.)
- Add `lift` to the next-rung button's className:
  `className="lift mt-8 w-full rounded p-4 text-left"`.
- Add `lift` to the stretch card button and the back-to-map button the same
  way.
- Swap ad-hoc sizes in this file: `text-[10px]`/`text-[11px]` → `t-label`,
  `text-lg` → `t-lead`, `text-3xl` → `t-title`, `text-sm` → `t-body`,
  `text-xl` → `t-lead`.

- [ ] **Step 4: Typecheck, test, verify**

Run: `npx tsc --noEmit && npm test` — expected clean.
In the browser, run one full rung (for-loops Beginner is fastest) and
confirm: each stage advance fades/rises in (~180ms, no flicker of the old
stage), the amber underline sits under the current rail label and moves on
advance, Done's heading rises in once, and the next-rung card lifts on
hover. Then enable "emulate prefers-reduced-motion" in devtools rendering
settings and confirm every one of those is instant.

- [ ] **Step 5: Commit**

```bash
git add src/ui/LoopShell.tsx src/ui/Done.tsx
git commit -m "Add stage cross-fade, rail underline, and Done's completion beat"
```

---

### Task 5: Review surfaces polish

**Files:**
- Modify: `src/ui/ReviewCalendar.tsx`
- Modify: `src/ui/Review.tsx`
- Modify: `src/ui/ReviewItem.tsx`

**Interfaces:**
- Consumes: `.lift`, `.fade-rise`, `.t-*` (Task 1). No prop changes to any
  of the three.

- [ ] **Step 1: Calendar cells get the standard treatment**

In `src/ui/ReviewCalendar.tsx`, replace the cell `<button>` with:

```tsx
            <button
              key={day}
              disabled={!clickable}
              onClick={() => clickable && onOpenDay(day)}
              className={`mono t-label flex flex-col items-center gap-0.5 rounded p-1.5 ${clickable ? 'lift' : ''}`}
              style={{
                border: `1px solid ${day === todayStr ? 'var(--amber)' : 'var(--rule)'}`,
                background: 'var(--panel)',
                color: clickable ? 'var(--ink)' : 'var(--dim)',
                opacity: clickable || day === todayStr ? 1 : 0.55,
              }}
            >
              <span>{Number(day.slice(-2))}</span>
              {count > 0 && (
                <span className="flex items-center gap-1" style={{ color: 'var(--good)' }}>
                  <span aria-hidden className="h-1 w-1 rounded-full" style={{ background: 'var(--good)' }} />
                  {count}
                </span>
              )}
            </button>
```

And in the month header row, swap `text-[11px]`/`text-[13px]` for
`t-label`/`t-mono`.

- [ ] **Step 2: Type-scale and enter-animation sweep of `Review.tsx` and `ReviewItem.tsx`**

- `Review.tsx`: `text-[13px]` → `t-mono`, `text-[10px]` → `t-label`. Give
  the "All caught up." block `className="fade-rise"` on its wrapper div.
- `ReviewItem.tsx`: `text-[10px]` → `t-label`, `text-[13px]` → `t-mono`.
  Wrap the `replay` stage's inner content div (the one holding "Missed it —
  here's the trace again" + `Watch`) and the `reask` stage's div in
  `className="fade-rise"` (add to their existing `<div>`s — both stage
  changes are user-caused).

- [ ] **Step 3: Typecheck, test, verify**

Run: `npx tsc --noEmit && npm test` — expected clean.
In the browser (seed one due item as before): calendar cells show the small
green dot + count, today is amber-ringed, clickable cells lift on hover,
inert future cells don't react; answering wrong fades the replay in;
finishing the queue fades "All caught up." in. Reduced-motion check: all
instant.

- [ ] **Step 4: Commit**

```bash
git add src/ui/ReviewCalendar.tsx src/ui/Review.tsx src/ui/ReviewItem.tsx
git commit -m "Polish review surfaces: cell depth, dot counts, enter animations"
```

---

### Task 6: Type-scale sweep of the remaining components

**Files:**
- Modify: `src/ui/Watch.tsx`
- Modify: `src/ui/Predict.tsx`
- Modify: `src/ui/Fix.tsx`
- Modify: `src/ui/Build.tsx`
- Modify: `src/ui/LineDetail.tsx`
- Modify: `src/ui/Variables.tsx`

**Interfaces:**
- Consumes: `.t-*` (Task 1). Pure class swaps — no logic, prop, or layout
  changes of any kind in this task.

- [ ] **Step 1: Apply the size mapping in all six files**

In each file, replace Tailwind font-size utilities with the named scale,
leaving every other class and all inline styles untouched:

| Old | New |
| --- | --- |
| `text-[10px]` | `t-label` |
| `text-[11px]` | `t-label` |
| `text-[13px]` | `t-mono` |
| `text-[15px]` | `t-mono` |
| `text-sm` | `t-body` |
| `text-base` | `t-body` |
| `text-lg` | `t-lead` |
| `text-xl` | `t-lead` |
| `text-3xl` | `t-title` |
| `text-5xl` | `t-display` |

Any size in these files not in the table (e.g. a `text-[9px]` if one
exists) maps to the nearest listed class — `t-label` for anything smaller
than 13px. Buttons using the `label` face keep `label` alongside `t-label`.

- [ ] **Step 2: Grep for stragglers**

Run: `grep -rn "text-\[1" src/ui/ src/App.tsx | grep -v t-`
Expected: no output (no bracketed pixel font sizes left anywhere in the UI).
Also run: `grep -rn "text-sm\|text-lg\|text-xl\|text-3xl\|text-5xl\|text-base" src/ui/ src/App.tsx`
Expected: no output.

- [ ] **Step 3: Typecheck, test, verify**

Run: `npx tsc --noEmit && npm test` — expected clean.
In the browser, click through one rung end to end (including opening a line
detail in Watch and the variables panel) checking for any size that jumps
out as wrong — the 10px→11px and 14px→16px bumps are intended, anything
else is a mis-mapping.

- [ ] **Step 4: Commit**

```bash
git add src/ui/ src/App.tsx
git commit -m "Sweep remaining components onto the named type scale"
```

---

### Task 7: Final end-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Full automated check**

```bash
npm test
npm run verify-content
npx tsc --noEmit
```

Expected: all clean. Also confirm scope held:
`git diff --stat b2e1a3a -- src/engine src/progress src/content scripts` —
expected: empty (UI-only, per the Global Constraints).

- [ ] **Step 2: Full manual pass, all four progress states**

Dev server, per state (fresh / partial / something-due / all-cleared — for
all-cleared, seed every level of every topic `completed: true` via a
devtools loop, or accept checking that state's one assertion: the Resume
card is hidden):

- Header: right mode highlighted, `Review · N` only when due, status dot
  tracks Pyodide boot (reload and watch it go amber → green).
- Map: resume card → correct rung; strip only when due; cards open/close;
  bars fill once; hover lifts everywhere a click works.
- Loop: stage fades, rail underline, Done beat, no `← Map` in the rail
  (header covers it).
- Review: no `← Map` inside the pane (header covers it), `← Calendar`
  still present past the calendar screen, cells lift, dot counts.
- Reduced-motion emulation: every animation instant, nothing broken.
- One real end-to-end: clear a rung, watch the map's bar and resume card
  update, and confirm the header's `Review · N` appears the next local day
  (or via a seeded due date).

- [ ] **Step 3: Commit any fixes found**

```bash
git add -A
git commit -m "Fix issues found in final shell-refresh verification"
```

(Skip if the pass was clean.)
