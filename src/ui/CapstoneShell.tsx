import { useState } from 'react'
import { capstone } from '../content/capstone'
import type { CapstoneProgress } from '../progress/store'
import type { Runtime } from '../engine/runtime'
import { checkSubmission } from '../engine/check'
import type { CheckResult, PyError } from '../engine/types'
import { Markdown } from './Markdown'
import { GridPlayer, isValidHistory } from './GridPlayer'

export function CapstoneShell({
  runtime,
  progress,
  onSave,
}: {
  runtime: Runtime
  progress: CapstoneProgress | undefined
  onSave: (patch: Partial<CapstoneProgress>) => void
}) {
  const passed = progress?.passed ?? 0
  const [code, setCode] = useState(progress?.code ?? '')
  const [result, setResult] = useState<CheckResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [hintsShown, setHintsShown] = useState(0)
  const [history, setHistory] = useState<number[][][] | null>(null)
  const [playError, setPlayError] = useState<PyError | null>(null)

  const complete = passed >= 4
  // The frontier stage: the first unpassed one. After completion there is no
  // frontier; Run replays the payoff.
  const stage = complete ? null : capstone.stages[passed]

  function persist(patch: Partial<CapstoneProgress>) {
    onSave({ code, ...patch })
  }

  async function runPayoff(source: string) {
    setBusy(true)
    setPlayError(null)
    setHistory(null)
    const col = await runtime.collect(source, capstone.harness)
    setBusy(false)
    if (col.error) {
      setPlayError(col.error)
      return
    }
    if (!isValidHistory(col.value)) {
      setPlayError({
        type: 'Shape',
        msg: 'step() ran, but the history it produced is not a stack of same-sized 0/1 grids.',
        line: null,
      })
      return
    }
    setHistory(col.value)
  }

  async function submit() {
    if (complete) {
      persist({})
      await runPayoff(code)
      return
    }
    setBusy(true)
    setResult(null)
    const r = await checkSubmission(runtime, code, stage!.check)
    setBusy(false)
    setResult(r)
    if (r.passed) {
      const nowPassed = (passed + 1) as CapstoneProgress['passed']
      persist({ passed: nowPassed })
      setHintsShown(0)
      if (nowPassed >= 4) await runPayoff(code)
    } else {
      persist({})
    }
  }

  const hintsSpent = stage ? hintsShown >= stage.hints.length : true

  return (
    <div>
      <h2 className="label t-title" style={{ color: 'var(--ink)' }}>
        {capstone.title}
      </h2>
      <p className="t-lead mt-2 max-w-2xl" style={{ color: 'var(--dim)' }}>
        {capstone.blurb}
      </p>

      {/* Checkpoint rail — same language as the loop's stage rail. */}
      <div className="mb-8 mt-6 flex items-center gap-2">
        {capstone.stages.map((s) => {
          const done = passed >= s.id
          const here = !complete && stage!.id === s.id
          return (
            <div key={s.id} className="flex items-center gap-2">
              <span
                className="label t-label"
                style={{
                  color: here ? 'var(--amber)' : done ? 'var(--good)' : 'var(--rule)',
                  borderBottom: `2px solid ${here ? 'var(--amber)' : 'transparent'}`,
                  paddingBottom: 2,
                }}
              >
                {done ? '✓ ' : ''}
                {s.title}
              </span>
              {s.id !== 4 && (
                <span style={{ color: 'var(--rule)' }} className="t-label">
                  ·
                </span>
              )}
            </div>
          )
        })}
      </div>

      {stage && (
        <div className="fade-rise mb-4 max-w-2xl" style={{ color: 'var(--ink)' }} key={stage.id}>
          <p className="label mb-2 t-label" style={{ color: 'var(--amber)' }}>
            Checkpoint {stage.id} of 4
          </p>
          <Markdown text={stage.task} />
        </div>
      )}

      {complete && (
        <p className="mb-4 max-w-2xl t-lead" style={{ color: 'var(--good)' }}>
          All four checkpoints passed. This is your simulation — run it, scrub it, change the
          code and run it again.
        </p>
      )}

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
        rows={Math.max(code.split('\n').length + 2, 10)}
        placeholder="One program, built in four pieces. Start with the grid."
        className="mono w-full resize-y rounded p-4 t-mono leading-7"
        style={{
          background: 'var(--panel)',
          color: 'var(--ink)',
          border: `1px solid ${complete ? 'var(--good)' : 'var(--rule)'}`,
        }}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={submit}
          disabled={busy}
          className="label rounded px-5 py-2.5 t-label"
          style={{ background: 'var(--amber)', color: 'var(--ground)', opacity: busy ? 0.5 : 1 }}
        >
          {busy ? 'Running…' : complete ? 'Run the world' : 'Run it'}
        </button>

        {stage && !hintsSpent && (
          <button
            onClick={() => setHintsShown((n) => n + 1)}
            className="label rounded px-4 py-2.5 t-label"
            style={{ border: '1px solid var(--rule)', color: 'var(--dim)' }}
          >
            {hintsShown === 0 ? 'Stuck?' : 'Another nudge'}
          </button>
        )}
      </div>

      {/* No solution reveal, by design: out of hints means the last hint has
          already named the topic to review. Composition is the test. */}
      {stage && hintsShown > 0 && (
        <div className="mt-5 max-w-2xl space-y-3">
          {stage.hints.slice(0, hintsShown).map((h, n) => (
            <div
              key={n}
              className="rounded p-4 t-mono"
              style={{ background: 'var(--panel)', borderLeft: '2px solid var(--amber)' }}
            >
              <Markdown text={h} />
            </div>
          ))}
        </div>
      )}

      {result && !result.passed && (
        <div className="mt-5">
          <p className="label mb-2 t-label" style={{ color: 'var(--hot)' }}>
            Not yet
          </p>
          <p className="mono t-mono" style={{ color: 'var(--ink)' }}>
            {result.error?.line != null && (
              <span style={{ color: 'var(--dim)' }}>line {result.error.line}: </span>
            )}
            {result.error?.msg}
          </p>
          {result.stdout && (
            <pre
              className="mono mt-3 whitespace-pre-wrap rounded p-3 t-mono"
              style={{ background: 'var(--ground)', color: 'var(--dim)' }}
            >
              {result.stdout}
            </pre>
          )}
        </div>
      )}

      {result?.passed && !complete && (
        <p className="label fade-rise mt-5 t-label" style={{ color: 'var(--good)' }}>
          Checkpoint {passed} ticked — next one's up
        </p>
      )}

      {playError && (
        <div className="mt-5">
          <p className="label mb-2 t-label" style={{ color: 'var(--hot)' }}>
            The world stumbled
          </p>
          <p className="mono t-mono" style={{ color: 'var(--ink)' }}>
            {playError.line != null && (
              <span style={{ color: 'var(--dim)' }}>line {playError.line}: </span>
            )}
            {playError.msg}
          </p>
        </div>
      )}

      {history && (
        <div className="fade-rise mt-8">
          <p className="label mb-3 t-label" style={{ color: 'var(--amber)' }}>
            Your world, {capstone.generations} generations
          </p>
          <GridPlayer history={history} />
        </div>
      )}

      {complete && (
        <div className="mt-10 max-w-2xl space-y-4">
          <p className="label t-label" style={{ color: 'var(--dim)' }}>
            Optional — where this goes next. Skip freely; you're already done.
          </p>
          {capstone.stretches.map((s, n) => (
            <StretchCard key={n} title={s.title} body={s.body} />
          ))}
        </div>
      )}
    </div>
  )
}

function StretchCard({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false)
  return open ? (
    <div className="rounded p-5" style={{ background: 'var(--panel)' }}>
      <h3 className="label t-lead" style={{ color: 'var(--ink)' }}>
        {title}
      </h3>
      <div className="mt-3" style={{ color: 'var(--dim)' }}>
        <Markdown text={body} />
      </div>
    </div>
  ) : (
    <button
      onClick={() => setOpen(true)}
      className="lift w-full rounded p-4 text-left"
      style={{ background: 'var(--panel)', border: '1px solid var(--rule)' }}
    >
      <span className="t-lead" style={{ color: 'var(--ink)' }}>
        {title}
      </span>
    </button>
  )
}
