import { useState } from 'react'
import type { Level } from '../content/types'
import { Markdown } from './Markdown'

export function Predict({
  level,
  onDone,
  nextLabel = 'Now fix one →',
}: {
  level: Level
  onDone: (correct: boolean) => void
  nextLabel?: string
}) {
  const [picked, setPicked] = useState<number | null>(null)
  const p = level.predict
  const revealed = picked !== null
  const correct = picked === p.answerIndex

  return (
    <div>
      <p className="label mb-3 t-label" style={{ color: 'var(--dim)' }}>
        Don't run it — call it first
      </p>

      <pre
        className="mono rounded p-5 t-mono leading-7"
        style={{ background: 'var(--panel)', color: 'var(--ink)' }}
      >
        {p.code}
      </pre>

      <p className="mt-6 t-lead">{p.question}</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {p.choices.map((c, n) => {
          const isAnswer = n === p.answerIndex
          const isPicked = n === picked
          let border = 'var(--rule)'
          let color = 'var(--ink)'
          if (revealed && isAnswer) {
            border = 'var(--good)'
            color = 'var(--good)'
          } else if (revealed && isPicked) {
            border = 'var(--hot)'
            color = 'var(--hot)'
          }
          return (
            <button
              key={n}
              disabled={revealed}
              onClick={() => setPicked(n)}
              className="mono rounded px-4 py-3 text-left t-mono transition-colors"
              style={{
                border: `1px solid ${border}`,
                color,
                background: revealed && isAnswer ? 'rgba(155,209,123,0.08)' : 'var(--panel)',
              }}
            >
              {c}
            </button>
          )
        })}
      </div>

      {revealed && (
        <div className="mt-6">
          <p className="label mb-2 t-label" style={{ color: correct ? 'var(--good)' : 'var(--amber)' }}>
            {correct ? 'Called it' : 'Not this time'}
          </p>
          <div style={{ color: 'var(--dim)' }}>
            <Markdown text={p.explain} />
          </div>
          <button
            onClick={() => onDone(correct)}
            className="label mt-6 rounded px-5 py-2.5 t-label"
            style={{ background: 'var(--amber)', color: 'var(--ground)' }}
          >
            {nextLabel}
          </button>
        </div>
      )}
    </div>
  )
}
