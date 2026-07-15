import { useState } from 'react'
import { topics } from '../content/topics'
import { levelName, type LevelId } from '../content/types'
import {
  clearedCount, isLevelDone, needsAnotherLook, nextLevel, type Progress,
} from '../progress/store'

function Pips({ cleared, total }: { cleared: number; total: number }) {
  return (
    <span className="flex gap-1" aria-label={`${cleared} of ${total} cleared`}>
      {Array.from({ length: total }, (_, n) => (
        <span
          key={n}
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: n < cleared ? 'var(--good)' : 'var(--rule)' }}
        />
      ))}
    </span>
  )
}

export function TopicMap({
  progress,
  onPick,
}: {
  progress: Progress
  onPick: (topicId: string, level: LevelId) => void
}) {
  const [openId, setOpenId] = useState<string | null>(topics[0]?.id ?? null)

  return (
    <div>
      <h1 className="label text-5xl" style={{ color: 'var(--ink)' }}>
        PyLoop
      </h1>
      <p className="mt-3 max-w-lg text-lg" style={{ color: 'var(--dim)' }}>
        One concept at a time. Watch it run, call the output, fix a broken one. About seven
        minutes a rung.
      </p>

      <div className="mt-10 space-y-3">
        {topics.map((t) => {
          const ids = t.levels.map((l) => l.level)
          const cleared = clearedCount(progress, t.id)
          const next = nextLevel(progress, t.id, ids)
          const open = openId === t.id
          return (
            <div key={t.id} className="rounded" style={{ border: '1px solid var(--rule)' }}>
              <button
                onClick={() => setOpenId(open ? null : t.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-4 p-4 text-left"
                style={{ background: 'var(--panel)' }}
              >
                <span className="label w-4 text-[11px]" style={{ color: 'var(--dim)' }}>
                  {t.order}
                </span>
                <span className="mono flex-1 text-[15px]" style={{ color: 'var(--ink)' }}>
                  {t.title}
                </span>
                <Pips cleared={cleared} total={t.levels.length} />
                <span className="label w-10 text-right text-[10px]" style={{ color: 'var(--dim)' }}>
                  {cleared}/{t.levels.length}
                </span>
              </button>

              {open && (
                <div className="space-y-px" style={{ background: 'var(--rule)' }}>
                  {t.levels.map((lv) => {
                    const done = isLevelDone(progress, t.id, lv.level)
                    // Cleared, but with help or a guessed prediction. Shown
                    // hollow — not a scold, just an honest record of which
                    // rungs are worth another shot.
                    const shaky = needsAnotherLook(progress, t.id, lv.level)
                    const isNext = next === lv.level
                    const mark = done ? (shaky ? 'var(--amber)' : 'var(--good)') : null
                    return (
                      <button
                        key={lv.level}
                        onClick={() => onPick(t.id, lv.level)}
                        className="flex w-full items-center gap-4 px-4 py-3 text-left"
                        style={{ background: 'var(--ground)' }}
                      >
                        <span
                          className="label flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px]"
                          style={{
                            background: done && !shaky ? 'var(--good)' : 'transparent',
                            border: `1px solid ${mark ?? (isNext ? 'var(--amber)' : 'var(--rule)')}`,
                            color: done
                              ? shaky
                                ? 'var(--amber)'
                                : 'var(--ground)'
                              : isNext
                                ? 'var(--amber)'
                                : 'var(--dim)',
                          }}
                        >
                          {done ? '✓' : lv.level}
                        </span>
                        <span className="w-24 shrink-0">
                          <span
                            className="label text-[11px]"
                            style={{ color: mark ?? (isNext ? 'var(--amber)' : 'var(--ink)') }}
                          >
                            {levelName(lv.level)}
                          </span>
                        </span>
                        <span className="flex-1 text-sm" style={{ color: 'var(--dim)' }}>
                          {lv.blurb}
                        </span>
                        <span
                          className="label text-[10px]"
                          style={{ color: shaky ? 'var(--amber)' : 'var(--rule)' }}
                        >
                          {shaky ? 'Worth another go' : done ? 'Again' : isNext ? 'Next' : 'Jump'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-12 max-w-lg text-sm" style={{ color: 'var(--rule)' }}>
        Nothing is locked. If Beginner insults you, jump to Advanced — the ladder is a
        suggestion, not a gate.
      </p>
    </div>
  )
}
