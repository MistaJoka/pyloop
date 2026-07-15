# PyLoop

A learning engine for COP1047C Python. One rung at a time, about seven minutes:

**Idea → Watch → Predict → Fix → Done**

Every topic has five levels — Beginner, Working, Fluent, Advanced, Master — and each level
is a **whole lesson**, not a variant: its own idea, trace, prediction and fix. Nothing is
locked; jump to any rung.

The full COP1047C course, 13 topics × 5 levels:

| | | | |
|---|---|---|---|
| 1 variables and types | 4 conditionals | 7 functions | 10 dictionaries and sets |
| 2 input and output | 5 for loops | 8 strings | 11 files |
| 3 operators and expressions | 6 while loops | 9 lists and tuples | 12 exceptions |
| | | | 13 classes |

Python runs in the browser (Pyodide/WASM). No server to start, nothing to install, works
offline, and a runaway loop can't wedge your machine.

## Run it

```bash
npm install
npm run sync-pyodide   # vendors the Python runtime into public/ (once, ~14MB)
npm run dev
```

Open http://localhost:5173. The dev server binds `0.0.0.0`, so `npm run dev` also prints a
LAN URL and a tailnet URL — any machine on either can load it.

Built for a desktop-sized screen. It's not laid out for phones: below ~640px the filmstrip
collapses to a few pixels per step and stops being clickable. Nothing crashes, it just
isn't the target.

## Adding a topic

Content is data. Write the files, register the topic, done — no app code to touch.

1. Copy `src/content/topics/for-loops/` to `src/content/topics/<your-topic>/`
2. One file per level (`beginner.ts` … `master.ts`), assembled by `index.ts`
3. Add the topic to the array in `src/content/topics/index.ts`

The shape is defined and commented in `src/content/types.ts`. Each level needs `blurb`,
`concept` (+ `aiFraming`), `watch`, `predict`, `fix`, and optionally `stretch`.

`watch.notes` is a sparse map of line number → what that line *means*. What a line **did**
is derived from the trace and costs nothing to author; notes are only the syntax gloss, and
only for lines that are genuinely unfamiliar. A note on `total = 0` is noise, and noise is
what stops people reading them.

Don't pad a ladder to fill five slots. A topic honestly carrying four rungs should carry
four — `levels` is just an array.

For `fix.check`, prefer `{kind: 'asserts'}` over `{kind: 'stdout'}` — it tests behavior
instead of formatting, so a stray space or `+=` instead of `= x +` never fails you. The
assertion messages are what the learner reads when they're stuck, so write them as
questions, not verdicts.

Assertions can see `__stdout__` (what the code printed) and `__source__` (the submitted
source). Use `__source__` **only** via `ast.parse` — never text matching — when a task is
about *how* something is written. Master's "use a comprehension" check is the example.

Every level also needs a `fix.solution` — the worked answer, offered only once all hints
are spent. Without one, running out of hints is a dead end.

A snippet that is MEANT to crash declares `watch.expectError: 'ValueError'` (or
`predict.expectError`). This is a tighter gate, not an escape hatch: declare it and the
snippet must raise, and raise exactly that. Omit it and any error is still a failure.

## How it's put together

```
src/
  engine/     tracer.py       runs a snippet under sys.settrace, snapshots each step
              runtime.ts      owns the worker: load, run, kill on runaway, restart
              check.ts        grades FIX submissions
              line-detail.ts  derives what each line DID, from the trace
              loop-lens.ts    derives where each walked list is up to
  content/    topics as plain data
  ui/         LoopShell drives the stages; Watch is the trace player;
              LineDetail is the per-line panel
  progress/   localStorage (completion state only — no streak, no score)
```

In WATCH, clicking any line that ran opens its detail: how many times it ran and what
changed on each visit, derived from the real execution — plus its authored note behind
"what is this?". Clicking a visit jumps the player there.

The variables panel shows each value's type (already captured on every step; `int` vs `str`
is the confusion behind most intro-Python errors) and, for a list a `for` loop is walking,
draws it as boxes with a cursor on the current item and "pass 2 of 3". The lens only fires
where the loop consumes a **named list** — `for i in range(len(xs))` and `for a, b in
zip(...)` get none, because those loops walk indices or a generator and a cursor over `xs`
would be a lie.

Things worth knowing before you change the engine — each of these was a real bug once:

- **A `line` event fires BEFORE that line runs.** A step's locals are the state *going
  into* the line; the line's effect appears in the NEXT step. Get this backwards and the UI
  confidently teaches the wrong causality — the highlighted line appears to have caused a
  change made by the previous one. `Watch.tsx` diffs step `i-1 → i` and labels the lines
  "about to run" / "just ran" for exactly this reason. There's a test pinning it.
- **"The next step" means the next step IN THE SAME FRAME** (`nextInFrame`). The step after
  `total = total + double(n)` is inside `double`, so a naive diff reports that the line
  created `x` and destroyed `total` — nonsense that renders perfectly plausibly. Every step
  carries `fn` and `depth`; use them.
- **`input()` needs `stdin` declared in the content.** Without it Python raises
  `EOFError: EOF when reading a line`. `watch.stdin` / `fix.stdin` are fed to the snippet.
- **Every run gets a fresh working directory** (`_Sandbox`). Pyodide's filesystem is real and
  persists for the worker's life, so files leaked between runs: re-run an append and the
  output doubled; a "this file doesn't exist yet" lesson quietly found one. Snippets must
  create whatever they read — nothing survives.
- **An `exception` step means "raised", not "died".** A caught exception traces identically
  to a fatal one. Only `result.error != null` means the run actually crashed; painting every
  exception step red would mis-teach the entire exceptions topic.
- **The untraced paths are capped too.** `run_plain`/`run_with_asserts` don't trace, so they
  had no cap and no timeout of their own. In the browser the worker kill covers it, but
  `verify-content` runs in Node with no worker — one infinite `fix.brokenCode` would hang
  the build forever instead of failing it. `_guard()` counts lines and nothing else.
- **Do not "restore" the deepcopy in `tracer.py`.** An earlier version deep-copied every
  local each step, with a confident comment saying values would otherwise all render as the
  final value. That was false: `_ser` calls `repr()` immediately, which materializes the
  value there and then. The copy bought nothing and cost seconds on large lists — enough to
  trip the 10s kill and tell the learner their correct code "ran forever".
- **The step cap must not be an `Exception`.** As one, `except Exception:` in user code
  swallowed it; tracing then switched off and the snippet ran on untraced, returning a
  truncated trace flagged as complete. It's a `BaseException` *and* the cap is recorded in a
  flag, because a bare `except:` catches even that.
- **Never store cumulative stdout per step.** It's quadratic — a few thousand prints became
  a ~90MB payload. Steps carry an `out` offset; use `stdoutAt(result, step)`.
- **Python runs in a Web Worker.** That's what keeps the UI alive and lets
  `worker.terminate()` kill an infinite loop. Three layers now, innermost first: the 10k
  step cap (WATCH via the tracer, FIX via `_guard`), then the 10s timeout, then the worker
  kill as the backstop for anything that hangs below Python (a C-level spin). A runaway only
  fails *its own* request — innocent in-flight work gets replayed on the new worker.
- **Dates in `store.ts` are local, never UTC.** `toISOString()` stamps a 9pm US session with
  tomorrow's date. It only feeds `lastSeen` now, but a wrong date there misleads quietly.

## Tests

```bash
npm test              # unit: tracer (real Pyodide), runtime (stub worker), store
npm run verify-content # every level against real Python
```

`npm test` covers the traps above as regressions. `verify-content` checks that each PREDICT
answer is what Python actually prints, each broken snippet is rejected, and each shipped
`fix.solution` passes its own check — a solution that doesn't is an escape hatch that
becomes a trap.
