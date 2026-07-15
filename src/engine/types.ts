export type VarValue = { type: string; repr: string }

/** A Python failure, with the line so the UI can point at it. */
export type PyError = { type: string; msg: string; line: number | null }

export type TraceStep = {
  line: number
  event: 'line' | 'return' | 'exception'
  /** State going INTO this line — the line has not run yet. A line's effect
   *  appears in the NEXT step IN THE SAME FRAME. See tracer.py. */
  locals: Record<string, VarValue>
  /** Offset into TraceResult.stdout: everything printed before this step.
   *  An offset, not a copy — copies made the payload quadratic. */
  out: number
  /** Function this step is executing in; `<module>` at top level. */
  fn: string
  /** 0 at module level, 1 inside a function called from it, etc. */
  depth: number
}

/** The next step in the SAME frame, skipping over any call this line makes.
 *
 *  `total = total + double(n)` is followed by steps INSIDE `double`. Diffing
 *  against those says the line created `x` and destroyed `total` — nonsense
 *  that renders perfectly plausibly. Skip to where the frame resumes; that's
 *  where the line's effect actually lands. Returns undefined if the frame never
 *  resumes (the snippet ended, or we're on a function's last line). */
export function nextInFrame(steps: TraceStep[], i: number): TraceStep | undefined {
  const depth = steps[i]?.depth
  if (depth === undefined) return undefined
  for (let j = i + 1; j < steps.length; j++) {
    if (steps[j].depth === depth) return steps[j]
    if (steps[j].depth < depth) return undefined // our frame popped
  }
  return undefined
}

export type TraceResult = {
  steps: TraceStep[]
  stdout: string
  error: PyError | null
  /** True when the snippet blew past the step cap. The trace is truncated —
   *  never present it as complete. */
  capped: boolean
}

export type RunResult = {
  stdout: string
  error: PyError | null
}

export type CheckResult = {
  passed: boolean
  stdout: string
  error: PyError | null
}

/** How a FIX submission gets judged. Declared per topic, in content. */
export type Check =
  | { kind: 'asserts'; code: string }
  | { kind: 'stdout'; expected: string }

export type WorkerRequest =
  | { id: number; kind: 'trace'; code: string; stdin: string }
  | { id: number; kind: 'run'; code: string; stdin: string }
  | { id: number; kind: 'asserts'; code: string; assertCode: string; stdin: string }

export type WorkerResponse =
  | { id: number; ok: true; data: unknown }
  | { id: number; ok: false; error: string }
  | { kind: 'ready' }

/** Omit over a union has to distribute, or the variants collapse to their
 *  shared keys and `assertCode` disappears. */
export type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

/** stdout as of a given step. */
export const stdoutAt = (result: TraceResult, step: TraceStep) => result.stdout.slice(0, step.out)

/** Why a run ended early. Distinguishes "your loop never stops" from "we had
 *  to kill an unrelated job", which used to be conflated. */
export class RunawayError extends Error {
  constructor() {
    super('runaway')
    this.name = 'RunawayError'
  }
}
