import { useEffect, useRef, useState } from 'react'
import type { TablePayoff } from '../../content/capstones/payoff'

const FRAME_MS = 350

/** Plays the wrangle pipeline with the Watch transport: the raw file is
 *  judged one line per frame — kept lines land in the growing clean table,
 *  rejects strike through hot and cool — and the stat tiles flip up once
 *  the last line is judged. */
export function TablePlayer({ payoff }: { payoff: TablePayoff }) {
  // frame = how many raw lines have been judged (0..raw.length).
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const last = payoff.raw.length
  const keptSoFar = payoff.verdicts.slice(0, frame).filter((v) => v.kept).length
  const visibleRows = payoff.rows.slice(0, keptSoFar)
  const done = frame >= last
  const newestKept = frame > 0 && payoff.verdicts[frame - 1].kept

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

  const stats = payoff.stats
  const tiles: [string, string | number][] = [
    ['rows kept', stats.count],
    ['mean', stats.mean_score],
    ['min', stats.min_score],
    ['max', stats.max_score],
    ['top', stats.top],
  ]

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
      <div className="grid gap-4 md:grid-cols-2">
        {/* The raw file, judged line by line. */}
        <div className="rounded p-4" style={{ background: 'var(--panel)' }}>
          <p className="label mb-3 t-label" style={{ color: 'var(--dim)' }}>
            survey.csv
          </p>
          {payoff.raw.map((line, i) => {
            const judged = i < frame
            const current = i === frame - 1
            const kept = payoff.verdicts[i].kept
            return (
              <p
                key={i}
                className="mono t-mono"
                style={{
                  color: !judged
                    ? 'var(--rule)'
                    : kept
                      ? current
                        ? 'var(--ink)'
                        : 'var(--dim)'
                      : current
                        ? 'var(--hot)'
                        : 'color-mix(in srgb, var(--hot) 55%, var(--dim))',
                  textDecoration: judged && !kept && line.trim() !== '' ? 'line-through' : 'none',
                  transition: 'color 400ms ease-out',
                  minHeight: '1.75rem',
                  lineHeight: '1.75rem',
                }}
              >
                {line || ' '}
              </p>
            )
          })}
        </div>

        {/* The clean table, growing. */}
        <div className="rounded p-4 self-start" style={{ background: 'var(--panel)' }}>
          <p className="label mb-3 t-label" style={{ color: 'var(--dim)' }}>
            clean rows
          </p>
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-6">
            <span className="label t-label" style={{ color: 'var(--rule)' }}>name</span>
            <span className="label t-label" style={{ color: 'var(--rule)' }}>age</span>
            <span className="label t-label" style={{ color: 'var(--rule)' }}>score</span>
            {visibleRows.map((r, i) => {
              const newest = newestKept && i === visibleRows.length - 1
              const rowStyle = {
                color: newest ? 'var(--hot)' : 'var(--ink)',
                transition: 'color 400ms ease-out',
                lineHeight: '1.75rem',
              }
              return (
                <span key={r.name} className="contents">
                  <span className="mono t-mono" style={rowStyle}>{r.name}</span>
                  <span className="mono t-mono text-right" style={rowStyle}>{r.age}</span>
                  <span className="mono t-mono text-right" style={rowStyle}>{r.score}</span>
                </span>
              )
            })}
          </div>
          {visibleRows.length === 0 && (
            <p className="t-mono" style={{ color: 'var(--rule)' }}>
              nothing kept yet
            </p>
          )}

          {done && (
            <div className="fade-rise mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {tiles.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded p-3"
                  style={{ background: 'var(--ground)', border: '1px solid var(--rule)' }}
                >
                  <p className="label t-label" style={{ color: 'var(--dim)' }}>
                    {label}
                  </p>
                  <p className="mono mt-1 t-lead" style={{ color: 'var(--good)' }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
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
        <button onClick={() => step(-1)} aria-label="Previous line" className="t-lead" style={{ color: 'var(--dim)' }}>
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
        <button onClick={() => step(1)} aria-label="Next line" className="t-lead" style={{ color: 'var(--dim)' }}>
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
