import { useEffect, useRef, useState } from 'react'

// The shape gate (isGridHistory) lives in src/content/capstones/payoff.ts so
// verify-content can run the exact same bouncer. The player trusts its input.

const FRAME_MS = 150

/** Plays a simulation history with the Watch transport pattern: play/pause,
 *  step, scrub, keyboard. Newly-born cells flare hot and cool via CSS
 *  transition — the app's heat-= -recency language, one more time. */
export function GridPlayer({ history }: { history: number[][][] }) {
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const last = history.length - 1
  const grid = history[frame]
  const prev = frame > 0 ? history[frame - 1] : null

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

  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return
        if (e.key === ' ') {
          e.preventDefault()
          if (playing || frame < last) {
            setPlaying((p) => !p)
          } else if (frame >= last) {
            setFrame(0)
            setPlaying(true)
          }
        }
        if (e.key === 'ArrowLeft') step(-1)
        if (e.key === 'ArrowRight') step(1)
      }}
      className="outline-none"
    >
      <div
        className="grid w-fit gap-px rounded p-2"
        style={{
          background: 'var(--rule)',
          gridTemplateColumns: `repeat(${grid[0].length}, 18px)`,
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const born = cell === 1 && prev !== null && prev[r][c] === 0
            return (
              <div
                key={`${r}-${c}`}
                className="h-[18px] w-[18px]"
                style={{
                  background: cell === 1 ? (born ? 'var(--hot)' : 'var(--ink)') : 'var(--ground)',
                  transition: 'background-color 300ms ease-out',
                }}
              />
            )
          }),
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
        <button
          onClick={() => step(-1)}
          aria-label="Previous frame"
          className="t-lead"
          style={{ color: 'var(--dim)' }}
        >
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
        <button
          onClick={() => step(1)}
          aria-label="Next frame"
          className="t-lead"
          style={{ color: 'var(--dim)' }}
        >
          ▶
        </button>
        <span className="label t-label" style={{ color: 'var(--dim)' }}>
          {frame + 1} / {history.length}
        </span>
      </div>
      <p className="label mt-2 t-label" style={{ color: 'var(--rule)' }}>
        ← → to step · space to play
      </p>
    </div>
  )
}
