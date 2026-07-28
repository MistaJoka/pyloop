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
