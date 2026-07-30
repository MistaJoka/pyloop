import type { ReactNode } from 'react'
import type { RuntimeStatus } from '../engine/runtime'

export type ShellMode = 'map' | 'review' | 'loop'

const STATUS: Record<RuntimeStatus, { color: string; text: string }> = {
  ready: { color: 'var(--good)', text: 'python ready' },
  booting: { color: 'var(--amber)', text: 'warming up' },
  dead: { color: 'var(--hot)', text: 'restarting' },
}

/** The app's chrome: answers "where in the app am I" from anywhere.
 *  The loop's stage rail (inside LoopShell) still answers "where in the
 *  seven minutes" — different question, different bar. */
export function Shell({
  mode,
  status,
  dueTodayCount,
  onMap,
  onReview,
  children,
}: {
  mode: ShellMode
  status: RuntimeStatus
  dueTodayCount: number
  onMap: () => void
  onReview: () => void
  children: ReactNode
}) {
  const s = STATUS[status]
  return (
    <div className="min-h-full">
      <header
        className="sticky top-0 z-10"
        style={{
          background: 'rgba(23, 21, 15, 0.82)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--rule)',
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-8 px-6 py-3 sm:px-10">
          <button onClick={onMap} className="label t-label" style={{ color: 'var(--ink)' }}>
            PyLoop
          </button>
          <nav className="flex items-center gap-5">
            <button
              onClick={onMap}
              className="label t-label"
              style={{ color: mode === 'map' ? 'var(--amber)' : 'var(--dim)' }}
            >
              Map
            </button>
            <button
              onClick={onReview}
              className="label t-label"
              style={{ color: mode === 'review' ? 'var(--amber)' : 'var(--dim)' }}
            >
              Review{dueTodayCount > 0 ? ` · ${dueTodayCount}` : ''}
            </button>
          </nav>
          <span className="ml-auto flex items-center gap-2">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: s.color }}
            />
            <span className="label t-label" style={{ color: 'var(--dim)' }}>
              {s.text}
            </span>
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10 sm:px-10 sm:py-12">{children}</main>
    </div>
  )
}
