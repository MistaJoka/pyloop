import { useState } from 'react'
import { levelName, type Level, type Topic } from '../content/types'
import { Markdown } from './Markdown'

export function Done({
  topic,
  level,
  nextLevel,
  onBackToMap,
  onNextLevel,
}: {
  topic: Topic
  level: Level
  nextLevel: Level | null
  onBackToMap: () => void
  onNextLevel: (next: Level) => void
}) {
  const [openStretch, setOpenStretch] = useState(false)
  const topped = nextLevel === null

  return (
    <div>
      <div className="fade-rise">
        <p className="label t-label" style={{ color: 'var(--good)' }}>
          {topic.title} · {levelName(level.level)} — done
        </p>
        <h2 className="label mt-3 t-title" style={{ color: 'var(--ink)' }}>
          {topped ? 'Top rung' : 'Done'}
        </h2>
        <p className="mt-3 max-w-xl t-lead" style={{ color: 'var(--dim)' }}>
          {topped
            ? `That's the top of ${topic.title}. You can read a loop, break one, and see straight through to what replaces it.`
            : 'You traced it, called the output, and fixed a broken one. That’s the whole loop.'}
        </p>
      </div>

      {/* The next rung is the main action — the ladder should have momentum. */}
      {nextLevel && (
        <button
          onClick={() => onNextLevel(nextLevel)}
          className="lift mt-8 w-full rounded p-4 text-left"
          style={{ background: 'var(--panel)', border: '1px solid var(--amber)' }}
        >
          <span className="label t-label" style={{ color: 'var(--amber)' }}>
            Next rung · {levelName(nextLevel.level)}
          </span>
          <p className="mt-1.5 t-lead" style={{ color: 'var(--ink)' }}>
            {nextLevel.blurb}
          </p>
        </button>
      )}

      {level.stretch && (
        <div className="mt-4">
          {!openStretch ? (
            <button
              onClick={() => setOpenStretch(true)}
              className="lift w-full rounded p-4 text-left"
              style={{ background: 'var(--panel)', border: '1px solid var(--rule)' }}
            >
              <span className="label t-label" style={{ color: 'var(--dim)' }}>
                Optional · 2 min
              </span>
              <p className="mt-1.5 t-lead" style={{ color: 'var(--ink)' }}>
                {level.stretch.title}
              </p>
              <p className="mt-1 t-body" style={{ color: 'var(--dim)' }}>
                Where this goes once you're doing AI work. Skip it freely — you're already done.
              </p>
            </button>
          ) : (
            <div className="rounded p-5" style={{ background: 'var(--panel)' }}>
              <span className="label t-label" style={{ color: 'var(--amber)' }}>
                Optional
              </span>
              <h3 className="label mt-1.5 t-lead" style={{ color: 'var(--ink)' }}>
                {level.stretch.title}
              </h3>
              <div className="mt-3" style={{ color: 'var(--dim)' }}>
                <Markdown text={level.stretch.body} />
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onBackToMap}
        className="label lift mt-8 rounded px-5 py-2.5 t-label"
        style={{ border: '1px solid var(--rule)', color: 'var(--ink)' }}
      >
        ← Back to the map
      </button>
    </div>
  )
}
