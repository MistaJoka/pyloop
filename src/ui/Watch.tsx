import { useEffect, useMemo, useState } from 'react'
import { stdoutAt, type TraceResult, type TraceStep } from '../engine/types'
import { lineDetail, visitedLines } from '../engine/line-detail'
import { loopLenses } from '../engine/loop-lens'
import { LineDetail } from './LineDetail'
import { Variables } from './Variables'

const PLAY_MS = 800

type Change = { from: string | null; to: string }

/** What changed going INTO each step — i.e. what the PREVIOUS line did.
 *
 *  A settrace `line` event fires before its line runs, so step i's locals are
 *  the state entering line i. The value that changed was changed by step i-1's
 *  line. Attributing it to the highlighted line is the off-by-one that made
 *  WATCH teach the wrong causality. */
function computeChanges(steps: TraceStep[]): Record<string, Change>[] {
  // Which earlier step is "the state before" for each step: the last one in the
  // SAME frame. Crossing a frame boundary would report a callee's parameters as
  // things the call site invented.
  const prevInFrame = steps.map((_, i) => {
    for (let j = i - 1; j >= 0; j--) {
      if (steps[j].depth === steps[i].depth) return steps[j]
      if (steps[j].depth < steps[i].depth) return undefined // we just entered this frame
    }
    return undefined
  })
  return steps.map((s, i) => {
    const prev = prevInFrame[i]
    const out: Record<string, Change> = {}
    if (!prev) return out
    for (const [k, v] of Object.entries(s.locals)) {
      const before = prev.locals[k]
      // Known limitation: this compares reprs, so a re-binding to an EQUAL
      // value reads as "no change" — `n` walking [1, 1, 2] doesn't flare on the
      // second 1, though Python really did reassign it. Reprs can't tell the
      // difference and neither can id() (small ints are interned), so fixing it
      // properly means the tracer reporting assignments, not values. Pinned by
      // a test in line-detail.test.ts so it stays a decision, not a surprise.
      if (!before) out[k] = { from: null, to: v.repr }
      else if (before.repr !== v.repr) out[k] = { from: before.repr, to: v.repr }
    }
    return out
  })
}

/** Steps since each variable last changed. 0 = just changed (hot). */
function computeHeat(steps: TraceStep[], changes: Record<string, Change>[]): Record<string, number>[] {
  const lastChanged: Record<string, number> = {}
  return steps.map((s, i) => {
    for (const k of Object.keys(changes[i] ?? {})) lastChanged[k] = i
    const out: Record<string, number> = {}
    for (const k of Object.keys(s.locals)) out[k] = i - (lastChanged[k] ?? i)
    return out
  })
}

export function Watch({
  code,
  result,
  notes,
  loading,
  onDone,
}: {
  code: string
  result: TraceResult
  notes?: Record<number, string>
  loading: boolean
  onDone: () => void
}) {
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [openLine, setOpenLine] = useState<number | null>(null)
  const steps = result.steps
  const changes = useMemo(() => computeChanges(steps), [steps])
  const heat = useMemo(() => computeHeat(steps, changes), [steps, changes])
  const ran = useMemo(() => visitedLines(result), [result])
  const detail = useMemo(
    () => (openLine == null ? null : lineDetail(result, code, openLine)),
    [result, code, openLine],
  )
  const lenses = useMemo(() => loopLenses(result, code, i), [result, code, i])
  const step = steps[i]
  const prevLine = steps[i - 1]?.line
  const atEnd = i >= steps.length - 1

  useEffect(() => {
    setI(0)
    setPlaying(false)
    setOpenLine(null)
  }, [steps])

  useEffect(() => {
    if (!playing || atEnd) return
    const t = setTimeout(() => setI((n) => n + 1), PLAY_MS)
    return () => clearTimeout(t)
  }, [playing, i, atEnd])

  useEffect(() => {
    if (atEnd) setPlaying(false)
  }, [atEnd])

  // Keyboard: the code is what he should be looking at, not the controls.
  // Every step spent hunting for a filmstrip cell is attention off the lesson.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) return
      if (e.key === 'ArrowRight') {
        setPlaying(false)
        setI((n) => Math.min(steps.length - 1, n + 1))
      } else if (e.key === 'ArrowLeft') {
        setPlaying(false)
        setI((n) => Math.max(0, n - 1))
      } else if (e.key === ' ') {
        e.preventDefault()
        setPlaying((p) => !p)
      } else if (e.key === 'Home') {
        setI(0)
      } else if (e.key === 'End') {
        setPlaying(false)
        setI(steps.length - 1)
      } else return
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [steps.length])

  const lines = code.split('\n')

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <p className="label text-sm" style={{ color: 'var(--dim)' }}>
          Warming up Python…
        </p>
      </div>
    )
  }

  // An exception step means "raised here" — NOT necessarily "died here". A
  // caught exception traces exactly the same way and the run carries on, so
  // painting it as a crash would mis-teach the whole exceptions topic. Only a
  // run that actually ended with an error crashed.
  const raised = step?.event === 'exception'
  const crashed = raised && result.error != null

  return (
    <div>
      <div className="grid gap-px md:grid-cols-[1.4fr_1fr]" style={{ background: 'var(--rule)' }}>
        {/* Code. Amber = about to run. Dim rule = just ran. */}
        <div className="p-5" style={{ background: 'var(--panel)' }}>
          <pre className="mono text-[13px] leading-7">
            {lines.map((l, n) => {
              const num = n + 1
              const active = step && step.line === num
              const justRan = !active && prevLine === num
              const clickable = ran.has(num)
              const open = openLine === num
              return (
                <div
                  key={n}
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  aria-label={clickable ? `Line ${num}: what did this do?` : undefined}
                  onClick={clickable ? () => setOpenLine(open ? null : num) : undefined}
                  onKeyDown={
                    clickable
                      ? (e) => {
                          if (e.key === 'Enter') setOpenLine(open ? null : num)
                        }
                      : undefined
                  }
                  className={`group -mx-2 flex px-2 ${clickable ? 'cursor-pointer' : ''}`}
                  style={{
                    background: active
                      ? raised
                        ? 'rgba(255,122,92,0.16)'
                        : 'rgba(255,182,39,0.13)'
                      : open
                        ? 'var(--panel-hi)'
                        : undefined,
                    borderLeft: `2px solid ${
                      active
                        ? raised
                          ? 'var(--hot)'
                          : 'var(--amber)'
                        : open
                          ? 'var(--dim)'
                          : 'transparent'
                    }`,
                  }}
                >
                  <span
                    className="mr-4 w-4 select-none text-right"
                    style={{ color: active ? 'var(--amber)' : '#565046' }}
                  >
                    {num}
                  </span>
                  <span style={{ color: active || justRan || open ? 'var(--ink)' : 'var(--dim)' }}>
                    {l || ' '}
                  </span>
                  {/* The captions that fix the causality. Without them the
                      natural reading is "the amber line made that value
                      change" — the exact opposite of the truth. */}
                  {active && (
                    <span className="label ml-3 self-center text-[9px]" style={{ color: 'var(--amber)' }}>
                      {crashed
                        ? 'crashed here'
                        : raised
                          ? 'raised here — caught below'
                          : 'about to run'}
                    </span>
                  )}
                  {justRan && (
                    <span className="label ml-3 self-center text-[9px]" style={{ color: 'var(--dim)' }}>
                      just ran
                    </span>
                  )}
                  {clickable && !active && !justRan && (
                    <span
                      className="label ml-3 self-center text-[9px] opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ color: 'var(--rule)' }}
                    >
                      {open ? '' : 'what did this do?'}
                    </span>
                  )}
                </div>
              )
            })}
          </pre>
        </div>

        {/* Variables + stdout */}
        <div className="p-5" style={{ background: 'var(--panel)' }}>
          <p className="label mb-3 text-[10px]" style={{ color: 'var(--dim)' }}>
            Variables
          </p>
          <Variables
            step={step}
            changes={changes[i] ?? {}}
            heat={heat[i] ?? {}}
            lenses={lenses}
          />

          <p className="label mb-2 mt-6 text-[10px]" style={{ color: 'var(--dim)' }}>
            Output
          </p>
          <pre
            className="mono min-h-[3rem] whitespace-pre-wrap rounded p-2 text-[13px]"
            style={{ background: 'var(--ground)', color: 'var(--good)' }}
          >
            {step ? stdoutAt(result, step) : ''}
          </pre>

          {crashed && result.error && (
            <div className="mt-4 rounded p-3" style={{ background: 'var(--ground)' }}>
              <p className="label text-[10px]" style={{ color: 'var(--hot)' }}>
                {result.error.type}
                {result.error.line ? ` · line ${result.error.line}` : ''}
              </p>
              <p className="mono mt-1.5 text-[12px]" style={{ color: 'var(--ink)' }}>
                {result.error.msg}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Per-line detail, derived from the real run. Clicking a visit drives
          the player, so the granular view and the animation stay one thing. */}
      {detail && (
        <LineDetail
          detail={detail}
          note={notes?.[detail.line]}
          onJump={(stepIndex) => {
            setPlaying(false)
            setI(stepIndex)
          }}
          onClose={() => setOpenLine(null)}
        />
      )}

      {result.capped && (
        <p className="label mt-3 text-[10px]" style={{ color: 'var(--hot)' }}>
          Trace truncated — this ran past {steps.length.toLocaleString()} steps
        </p>
      )}

      {/* Filmstrip: every step is a frame; the lamp shows where you are */}
      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={() => {
            if (atEnd) {
              setI(0)
              setPlaying(true)
            } else setPlaying((p) => !p)
          }}
          className="label w-20 rounded px-3 py-2 text-[11px]"
          style={{ background: 'var(--amber)', color: 'var(--ground)' }}
        >
          {playing ? 'Pause' : atEnd ? 'Replay' : 'Play'}
        </button>

        <div className="flex flex-1 items-center gap-3">
          <button
            aria-label="Previous step"
            onClick={() => {
              setPlaying(false)
              setI((n) => Math.max(0, n - 1))
            }}
            className="mono flex h-11 w-11 shrink-0 items-center justify-center text-lg"
            style={{ color: 'var(--dim)' }}
          >
            ◀
          </button>

          <div className="flex flex-1 gap-[2px]">
            {steps.map((s, n) => (
              <button
                key={n}
                aria-label={`Step ${n + 1}`}
                onClick={() => {
                  setPlaying(false)
                  setI(n)
                }}
                className="h-6 flex-1 rounded-[1px] transition-colors"
                style={{
                  background:
                    n === i
                      ? 'var(--amber)'
                      : s.event === 'exception'
                        ? 'var(--hot)'
                        : n < i
                          ? 'var(--panel-hi)'
                          : 'var(--panel)',
                  border: `1px solid ${n === i ? 'var(--amber)' : 'var(--rule)'}`,
                }}
              />
            ))}
          </div>

          <button
            aria-label="Next step"
            onClick={() => {
              setPlaying(false)
              setI((n) => Math.min(steps.length - 1, n + 1))
            }}
            className="mono flex h-11 w-11 shrink-0 items-center justify-center text-lg"
            style={{ color: 'var(--dim)' }}
          >
            ▶
          </button>
        </div>

        <span className="label w-20 text-right text-[11px]" style={{ color: 'var(--dim)' }}>
          {i + 1} / {steps.length}
        </span>
      </div>

      <p className="label mt-3 text-[9px]" style={{ color: 'var(--rule)' }}>
        ← → to step · space to play
      </p>

      <button
        onClick={onDone}
        className="label mt-6 rounded px-5 py-2.5 text-[11px]"
        style={{ border: '1px solid var(--rule)', color: 'var(--ink)' }}
      >
        Got it — next →
      </button>
    </div>
  )
}
