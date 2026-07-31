import { useEffect, useRef, useState } from 'react'
import type { CipherPayoff } from '../../content/capstones/payoff'

const FRAME_MS = 130

/** Two acts on one transport. Act one: a cursor sweeps the message,
 *  flipping each character to its cipher form and showing the arithmetic.
 *  Act two: all 26 candidate decodes appear one per frame, and the final
 *  frame locks the cracked shift in green — the statistics found it. */
export function CipherPlayer({ payoff }: { payoff: CipherPayoff }) {
  const n = payoff.message.length
  // frames 0..n: sweep; n+1..n+26: candidates; n+27: the crack locks.
  const last = n + 27
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

  const sweeping = frame <= n
  const cur = sweeping && frame > 0 ? payoff.chars[frame - 1] : null
  const candidatesShown = sweeping ? 0 : Math.min(26, frame - n)
  const cracked = frame >= last

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
      {/* Act one: the sweep. Plain over cipher, one column per character. */}
      <div className="rounded p-4" style={{ background: 'var(--panel)' }}>
        <div className="flex flex-wrap gap-y-3">
          {payoff.chars.map((c, i) => {
            const flipped = i < frame
            const isCursor = sweeping && i === frame - 1
            return (
              <span key={i} className="flex w-[16px] flex-col items-center">
                <span className="mono t-mono" style={{ color: 'var(--dim)' }}>
                  {c.plain === ' ' ? ' ' : c.plain}
                </span>
                <span
                  className="mono t-mono"
                  style={{
                    color: !flipped ? 'var(--rule)' : isCursor ? 'var(--hot)' : 'var(--ink)',
                    transition: 'color 400ms ease-out',
                  }}
                >
                  {flipped ? (c.cipher === ' ' ? ' ' : c.cipher) : '·'}
                </span>
              </span>
            )
          })}
        </div>
        <p className="label mt-3 t-label" style={{ color: cur ? 'var(--amber)' : 'var(--rule)' }}>
          {cur
            ? /[a-zA-Z]/.test(cur.plain)
              ? `${cur.plain} → +${payoff.shift} → ${cur.cipher}`
              : `'${cur.plain}' passes through`
            : sweeping
              ? `shift ${payoff.shift}, one character at a time`
              : 'encoded — now break it'}
        </p>
      </div>

      {/* Act two: the break. */}
      {candidatesShown > 0 && (
        <div className="fade-rise mt-4 rounded p-4" style={{ background: 'var(--panel)' }}>
          <p className="label mb-3 t-label" style={{ color: 'var(--dim)' }}>
            try every shift, score by letter statistics
          </p>
          <div className="grid gap-x-6 sm:grid-cols-2">
            {payoff.candidates.slice(0, candidatesShown).map((c) => {
              const isCrack = cracked && c.shift === payoff.cracked
              return (
                <p
                  key={c.shift}
                  className="mono t-mono truncate"
                  style={{
                    color: isCrack ? 'var(--good)' : cracked ? 'var(--rule)' : 'var(--dim)',
                    transition: 'color 400ms ease-out',
                    lineHeight: '1.6rem',
                  }}
                >
                  <span style={{ color: isCrack ? 'var(--good)' : 'var(--rule)' }}>
                    {String(c.shift).padStart(2, ' ')}{' '}
                  </span>
                  {c.text}
                </p>
              )
            })}
          </div>
          {cracked && (
            <p className="label fade-rise mt-3 t-label" style={{ color: 'var(--good)' }}>
              shift {payoff.cracked} — the statistics found it
            </p>
          )}
        </div>
      )}

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
        <button onClick={() => step(-1)} aria-label="Previous frame" className="t-lead" style={{ color: 'var(--dim)' }}>
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
        <button onClick={() => step(1)} aria-label="Next frame" className="t-lead" style={{ color: 'var(--dim)' }}>
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
