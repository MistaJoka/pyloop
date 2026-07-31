import { useEffect, useRef, useState } from 'react'
import type { TextGenPayoff } from '../../content/capstones/payoff'

const FRAME_MS = 380

/** Plays the generation walk on the Watch transport: the sentence types out
 *  one token per frame, and beside it the candidate table shows what the
 *  model was weighing when it chose that token — count bars, with the
 *  chosen follower flaring hot. Scrub to any step to re-see its choice. */
export function TextGenPlayer({ payoff }: { payoff: TextGenPayoff }) {
  // frame = tokens revealed beyond the start word (0..steps.length).
  const last = payoff.steps.length
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!playing) return
    timer.current = setInterval(() => {
      setFrame((f) => {
        if (f >= last) {
          setPlaying(false)
          return f
        }
        return f + 1
      })
    }, FRAME_MS)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [playing, last])

  const step = (d: number) => {
    setPlaying(false)
    setFrame((f) => Math.min(last, Math.max(0, f + d)))
  }

  const visible = payoff.tokens.slice(0, frame + 1)
  // The table that chose the newest visible token.
  const current = frame > 0 ? payoff.steps[frame - 1] : null
  const maxCount = current ? Math.max(...current.options.map(([, c]) => c)) : 1

  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return
        if (e.key === ' ') {
          e.preventDefault()
          if (playing || frame < last) {
            setPlaying((p) => !p)
          } else {
            setFrame(0)
            setPlaying(true)
          }
        }
        if (e.key === 'ArrowLeft') step(-1)
        if (e.key === 'ArrowRight') step(1)
      }}
      className="outline-none"
    >
      <div className="grid gap-4 md:grid-cols-[3fr_2fr]">
        {/* The sentence, typing itself. */}
        <div className="rounded p-4" style={{ background: 'var(--panel)' }}>
          <p className="label mb-3 t-label" style={{ color: 'var(--dim)' }}>
            generated text
          </p>
          <p className="mono t-mono leading-8">
            {visible.map((tok, i) => (
              <span
                key={i}
                style={{
                  color: i === frame && frame > 0 ? 'var(--hot)' : 'var(--ink)',
                  transition: 'color 400ms ease-out',
                }}
              >
                {tok}{' '}
              </span>
            ))}
            {frame < last && (
              <span style={{ color: 'var(--rule)' }}>{'·'.repeat(3)}</span>
            )}
          </p>
        </div>

        {/* What the model was weighing when it picked the newest word. */}
        <div className="rounded p-4 self-start" style={{ background: 'var(--panel)' }}>
          <p className="label mb-3 t-label" style={{ color: 'var(--dim)' }}>
            {current ? `after "${current.word}" — the counts say:` : 'the model weighs its options here'}
          </p>
          {current ? (
            <div className="space-y-2">
              {current.options.map(([word, count]) => {
                const chosen = word === current.chosen
                return (
                  <div key={word} className="flex items-center gap-3">
                    <span
                      className="mono w-14 t-mono"
                      style={{ color: chosen ? 'var(--hot)' : 'var(--dim)' }}
                    >
                      {word}
                    </span>
                    <div className="h-3 flex-1 rounded-sm" style={{ background: 'var(--ground)' }}>
                      <div
                        className="h-3 rounded-sm"
                        style={{
                          width: `${(count / maxCount) * 100}%`,
                          background: chosen ? 'var(--hot)' : 'var(--rule)',
                          transition: 'background 300ms ease-out, width 300ms ease-out',
                        }}
                      />
                    </div>
                    <span className="label w-6 text-right t-label" style={{ color: 'var(--dim)' }}>
                      {count}
                    </span>
                    {chosen && (
                      <span className="label t-label" style={{ color: 'var(--hot)' }}>
                        ← picked
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="t-mono" style={{ color: 'var(--rule)' }}>
              press play
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={() => {
            if (frame >= last) setFrame(0)
            setPlaying((p) => !p)
          }}
          className="label rounded px-5 py-2.5 t-label"
          style={{ background: 'var(--amber)', color: 'var(--ground)' }}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button onClick={() => step(-1)} aria-label="Previous word" className="t-lead" style={{ color: 'var(--dim)' }}>
          ◀
        </button>
        <input
          type="range"
          min={0}
          max={last}
          value={frame}
          onChange={(e) => {
            setPlaying(false)
            setFrame(Number(e.target.value))
          }}
          className="flex-1"
        />
        <button onClick={() => step(1)} aria-label="Next word" className="t-lead" style={{ color: 'var(--dim)' }}>
          ▶
        </button>
        <span className="label t-label" style={{ color: 'var(--dim)' }}>
          {frame} / {last}
        </span>
      </div>
      <p className="label mt-2 t-label" style={{ color: 'var(--rule)' }}>
        ← → to step · space to play
      </p>
    </div>
  )
}
