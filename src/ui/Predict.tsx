import { useState } from 'react'
import type { Level } from '../content/types'
import { Markdown } from './Markdown'

export function Predict({
  level,
  onDone,
}: {
  level: Level
  onDone: (correct: boolean) => void
}) {
  const [picked, setPicked] = useState<number | null>(null)
  const p = level.predict
  const revealed = picked !== null
  const correct = picked === p.answerIndex

  return (
    <div>
      <p className="label mb-3 text-[10px]" style={{ color: 'var(--dim)' }}>
        Don't run it — call it first
      </p>

      <pre
        className="mono rounded p-5 text-[13px] leading-7"
        style={{ background: 'var(--panel)', color: 'var(--ink)' }}
      >
        {p.code}
      </pre>

      <p className="mt-6 text-lg">{p.question}</p>

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
              className="mono rounded px-4 py-3 text-left text-[13px] transition-colors"
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
          <p className="label mb-2 text-[11px]" style={{ color: correct ? 'var(--good)' : 'var(--amber)' }}>
            {correct ? 'Called it' : 'Not this time'}
          </p>
          <div style={{ color: 'var(--dim)' }}>
            <Markdown text={p.explain} />
          </div>
          <button
            onClick={() => onDone(correct)}
            className="label mt-6 rounded px-5 py-2.5 text-[11px]"
            style={{ background: 'var(--amber)', color: 'var(--ground)' }}
          >
            Now fix one →
          </button>
        </div>
      )}
    </div>
  )
}
