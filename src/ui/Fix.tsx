import { useState } from 'react'
import type { Level } from '../content/types'
import type { Runtime } from '../engine/runtime'
import { checkSubmission } from '../engine/check'
import type { CheckResult } from '../engine/types'
import { Markdown } from './Markdown'

export function Fix({
  level,
  runtime,
  onDone,
}: {
  level: Level
  runtime: Runtime
  onDone: (assisted: boolean) => void
}) {
  const [code, setCode] = useState(level.fix.brokenCode)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [hintsShown, setHintsShown] = useState(0)
  const [assisted, setAssisted] = useState(false)

  async function submit() {
    setBusy(true)
    setResult(null)
    const r = await checkSubmission(runtime, code, level.fix.check, level.fix.stdin ?? '')
    setResult(r)
    setBusy(false)
  }

  const passed = result?.passed === true
  const hintsSpent = hintsShown >= level.fix.hints.length

  return (
    <div>
      <div className="mb-4" style={{ color: 'var(--ink)' }}>
        <Markdown text={level.fix.task} />
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => {
          // Tab moved focus instead of indenting — and at Advanced the answer
          // IS an indentation change, so the editor was fighting the lesson.
          if (e.key === 'Tab') {
            e.preventDefault()
            const el = e.currentTarget
            const { selectionStart: s, selectionEnd: en } = el
            const next = code.slice(0, s) + '    ' + code.slice(en)
            setCode(next)
            requestAnimationFrame(() => el.setSelectionRange(s + 4, s + 4))
          }
          // Cmd/Ctrl+Enter runs, so he never has to leave the keyboard.
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            void submit()
          }
        }}
        spellCheck={false}
        // Browsers otherwise capitalize `for` -> `For` and "correct" identifiers.
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        rows={code.split('\n').length + 2}
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
          onClick={() => setCode(level.fix.brokenCode)}
          className="label rounded px-4 py-2.5 text-[11px]"
          style={{ border: '1px solid var(--rule)', color: 'var(--dim)' }}
        >
          Reset
        </button>

        {!hintsSpent && (
          <button
            onClick={() => setHintsShown((n) => n + 1)}
            className="label rounded px-4 py-2.5 text-[11px]"
            style={{ border: '1px solid var(--rule)', color: 'var(--dim)' }}
          >
            {hintsShown === 0 ? 'Stuck?' : 'Another nudge'}
          </button>
        )}

        {/* Only once every hint is spent. Running out used to be a dead end
            that recorded nothing — the app withheld its one reward exactly when
            he was struggling most. Taking this still requires pressing Run, and
            it still counts. */}
        {hintsSpent && !passed && !assisted && (
          <button
            onClick={() => {
              setCode(level.fix.solution)
              setAssisted(true)
              setResult(null)
            }}
            className="label rounded px-4 py-2.5 text-[11px]"
            style={{ border: '1px solid var(--amber)', color: 'var(--amber)' }}
          >
            Show me the working version
          </button>
        )}
      </div>

      {assisted && !passed && (
        <p className="mt-4 text-sm" style={{ color: 'var(--dim)' }}>
          Here's one that works. Read it, run it, and see it go green — then this level comes
          back later so you get a clean shot at it.
        </p>
      )}

      {/* Hints ladder: each one gives away a little more. Never all at once. */}
      {hintsShown > 0 && (
        <div className="mt-5 space-y-3">
          {level.fix.hints.slice(0, hintsShown).map((h, n) => (
            <div
              key={n}
              className="rounded p-4 text-[15px]"
              style={{ background: 'var(--panel)', borderLeft: '2px solid var(--amber)' }}
            >
              <Markdown text={h} />
            </div>
          ))}
        </div>
      )}

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
          onClick={() => onDone(assisted)}
          className="label mt-6 rounded px-5 py-2.5 text-[11px]"
          style={{ background: 'var(--good)', color: 'var(--ground)' }}
        >
          Done →
        </button>
      )}
    </div>
  )
}
