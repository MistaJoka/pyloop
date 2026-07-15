import { nextInFrame, stdoutAt, type TraceResult, type TraceStep } from './types'

export type Change = { name: string; from: string | null; to: string }

export type LineVisit = {
  /** Index of the step where this line was about to run — click to jump. */
  stepIndex: number
  /** 1-based: which time round this was. */
  nth: number
  changes: Change[]
  printed: string
  crashed: boolean
}

export type LineDetail = {
  line: number
  source: string
  /** `for`/`while` headers behave differently: a visit that changes nothing is
   *  the loop checking whether to go round again, not a line doing nothing. */
  isLoopHeader: boolean
  visits: LineVisit[]
  /** In scope while this line ran, but never touched by it. */
  untouched: string[]
}

const LOOP_HEADER = /^\s*(for|while)\b/

function diff(before: TraceStep, after: TraceStep | undefined): Change[] {
  if (!after) return []
  const out: Change[] = []
  for (const [name, v] of Object.entries(after.locals)) {
    const prev = before.locals[name]
    if (!prev) out.push({ name, from: null, to: v.repr })
    else if (prev.repr !== v.repr) out.push({ name, from: prev.repr, to: v.repr })
  }
  return out
}

/** What a line actually DID, derived from the real execution.
 *
 *  This turns on one fact: a `line` event fires BEFORE that line runs, so a
 *  line's effect is the difference between its own step and the NEXT one.
 *  Diffing against the PREVIOUS step reads just as plausibly and attributes
 *  every change to the wrong line — `total = total + n` would claim it changed
 *  `n`, which is the `for` header's doing. There are tests for this; don't
 *  "simplify" the direction.
 *
 *  Single-frame only. A snippet that defines and calls a function will report
 *  the callee's locals without saying so — this needs a frame indicator before
 *  the `functions` topic can exist. */
export function lineDetail(result: TraceResult, code: string, line: number): LineDetail {
  const source = code.split('\n')[line - 1] ?? ''
  const visits: LineVisit[] = []
  const touched = new Set<string>()
  const inScope = new Set<string>()

  result.steps.forEach((s, i) => {
    if (s.line !== line || s.event !== 'line') return
    // Same-frame, so a line that CALLS a function is credited with what the
    // call did to this scope — not with the callee's locals appearing.
    const next = nextInFrame(result.steps, i)
    const changes = diff(s, next)
    changes.forEach((c) => touched.add(c.name))
    Object.keys(s.locals).forEach((n) => inScope.add(n))
    // stdout still advances while we're inside the callee, and a print in there
    // really was caused by this line calling it — so measure against the
    // immediate next step, not the same-frame one.
    const after = result.steps[i + 1]
    visits.push({
      stepIndex: i,
      nth: visits.length + 1,
      changes,
      printed: next ? stdoutAt(result, next).slice(stdoutAt(result, s).length) : '',
      crashed: after?.event === 'exception',
    })
  })

  return {
    line,
    source,
    isLoopHeader: LOOP_HEADER.test(source),
    visits,
    untouched: [...inScope].filter((n) => !touched.has(n)),
  }
}

/** Lines the trace actually reached. A line never visited (a branch not taken)
 *  has nothing to tell you, so it isn't clickable. */
export function visitedLines(result: TraceResult): Set<number> {
  return new Set(result.steps.filter((s) => s.event === 'line').map((s) => s.line))
}
