import { useEffect, useRef, useState } from 'react'
import type { LedgerPayoff } from '../../content/capstones/payoff'

const FRAME_MS = 550

/** Plays the transaction script on the Watch transport: the statement fills
 *  one row per frame with a running-balance bar; refused rows flash hot with
 *  their exception's name and move nothing; the final frame is the verdict —
 *  the balance replayed from disk, matching. */
export function LedgerPlayer({ payoff }: { payoff: LedgerPayoff }) {
  // frames 0..steps.length reveal rows; the last frame adds the replay line.
  const last = payoff.steps.length + 1
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

  const rows = payoff.steps.slice(0, Math.min(frame, payoff.steps.length))
  const replayShown = frame >= last
  const maxBalance = Math.max(payoff.opening, ...payoff.steps.map((s) => s.balance))
  const matches = payoff.final === payoff.replayed

  const balanceBar = (balance: number, hot: boolean) => (
    <div className="h-2.5 flex-1 rounded-sm" style={{ background: 'var(--ground)' }}>
      <div
        className="h-2.5 rounded-sm"
        style={{
          width: `${(balance / maxBalance) * 100}%`,
          background: hot ? 'var(--hot)' : 'var(--good)',
          transition: 'width 400ms ease-out, background 400ms ease-out',
        }}
      />
    </div>
  )

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
      <div className="rounded p-4" style={{ background: 'var(--panel)' }}>
        <div className="flex items-baseline justify-between">
          <p className="label t-label" style={{ color: 'var(--dim)' }}>
            statement · {payoff.owner}
          </p>
          <p className="label t-label" style={{ color: 'var(--dim)' }}>
            ledger.txt
          </p>
        </div>

        {/* Opening line. */}
        <div className="mt-3 flex items-center gap-4">
          <span className="mono w-40 t-mono" style={{ color: 'var(--dim)' }}>
            open
          </span>
          <span className="mono w-16 text-right t-mono" style={{ color: 'var(--dim)' }}>
            {payoff.opening}
          </span>
          {balanceBar(payoff.opening, false)}
          <span className="mono w-14 text-right t-mono" style={{ color: 'var(--ink)' }}>
            {payoff.opening}
          </span>
        </div>

        {rows.map((s, i) => {
          const newest = i === rows.length - 1 && !replayShown
          return (
            <div key={i} className="mt-2 flex items-center gap-4">
              <span
                className="mono w-40 t-mono"
                style={{
                  color: s.ok ? (newest ? 'var(--ink)' : 'var(--dim)') : 'var(--hot)',
                  transition: 'color 400ms ease-out',
                }}
              >
                {s.op}
                {!s.ok && (
                  <span className="label ml-2 t-label" style={{ color: 'var(--hot)' }}>
                    {s.error}
                  </span>
                )}
              </span>
              <span
                className="mono w-16 text-right t-mono"
                style={{
                  color: !s.ok ? 'var(--hot)' : 'var(--ink)',
                  textDecoration: s.ok ? 'none' : 'line-through',
                }}
              >
                {s.op === 'deposit' ? '+' : '−'}
                {Math.abs(s.amount)}
              </span>
              {balanceBar(s.balance, !s.ok)}
              <span className="mono w-14 text-right t-mono" style={{ color: 'var(--ink)' }}>
                {s.balance}
              </span>
            </div>
          )
        })}

        {rows.length > 0 && !rows[rows.length - 1].ok && !replayShown && (
          <p className="label mt-2 t-label" style={{ color: 'var(--hot)' }}>
            refused — balance untouched
          </p>
        )}

        {replayShown && (
          <p
            className="label fade-rise mt-4 t-label"
            style={{ color: matches ? 'var(--good)' : 'var(--hot)' }}
          >
            {matches
              ? `replayed from ledger.txt: ${payoff.replayed} — matches`
              : `replayed from ledger.txt: ${payoff.replayed}, but the account says ${payoff.final} — the records disagree`}
          </p>
        )}
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
        <button onClick={() => step(-1)} aria-label="Previous transaction" className="t-lead" style={{ color: 'var(--dim)' }}>
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
        <button onClick={() => step(1)} aria-label="Next transaction" className="t-lead" style={{ color: 'var(--dim)' }}>
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
