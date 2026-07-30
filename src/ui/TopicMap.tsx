import { Fragment, useState } from 'react'
import { topics } from '../content/topics'
import { levelName, type LevelId, type Topic } from '../content/types'
import {
  clearedCount,
  isLevelDone,
  needsAnotherLook,
  nextLevel,
  type Progress,
} from '../progress/store'
import { ProgressBar } from './ProgressBar'

/** First topic in course order with an uncleared rung — what Continue
 *  points at. Null once every rung in the course is cleared. */
function firstUnfinished(progress: Progress): { topic: Topic; level: LevelId } | null {
  for (const t of topics) {
    const next = nextLevel(progress, t.id, t.levels.map((l) => l.level))
    if (next !== null) return { topic: t, level: next }
  }
  return null
}

function shakyCount(progress: Progress, topicId: string, ids: LevelId[]): number {
  return ids.filter((l) => needsAnotherLook(progress, topicId, l)).length
}

function chunk<T>(xs: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n))
  return out
}

export function TopicMap({
  progress,
  onPick,
  dueTodayCount,
  onOpenReview,
}: {
  progress: Progress
  onPick: (topicId: string, level: LevelId) => void
  dueTodayCount: number
  onOpenReview: () => void
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const resume = firstUnfinished(progress)
  const resumeLevel = resume?.topic.levels.find((l) => l.level === resume.level)

  return (
    <div>
      <h1 className="label t-display" style={{ color: 'var(--ink)' }}>
        PyLoop
      </h1>
      <p className="t-lead mt-3 max-w-lg" style={{ color: 'var(--dim)' }}>
        One concept at a time. Watch it run, call the output, fix a broken one or build one
        from scratch. About seven minutes a rung.
      </p>

      {/* The single most likely action: the next unfinished rung. */}
      {resume && resumeLevel && (
        <button
          onClick={() => onPick(resume.topic.id, resume.level)}
          className="lift mt-8 w-full rounded p-5 text-left"
          style={{ background: 'var(--panel)', border: '1px solid var(--amber)' }}
        >
          <span className="label t-label" style={{ color: 'var(--amber)' }}>
            Continue · {resume.topic.title} · {levelName(resume.level)}
          </span>
          <p className="t-lead mt-1.5" style={{ color: 'var(--ink)' }}>
            {resumeLevel.blurb}
          </p>
        </button>
      )}

      {/* Quiet when nothing's due; visible without shouting when something is. */}
      {dueTodayCount > 0 && (
        <button
          onClick={onOpenReview}
          className="lift mt-3 w-full rounded p-4 text-left"
          style={{ background: 'var(--panel)', border: '1px solid var(--rule)' }}
        >
          <span className="label t-label" style={{ color: 'var(--amber)' }}>
            {dueTodayCount} to review today →
          </span>
        </button>
      )}

      <div className="mt-8 space-y-3">
        {chunk(topics, 3).map((row, rowIdx) => {
          const openTopic = row.find((t) => t.id === openId)
          return (
            <Fragment key={rowIdx}>
              <div className="grid grid-cols-3 gap-3">
                {row.map((t) => {
                  const ids = t.levels.map((l) => l.level)
                  const cleared = clearedCount(progress, t.id)
                  const shaky = shakyCount(progress, t.id, ids)
                  const next = nextLevel(progress, t.id, ids)
                  const nextLv = next ? t.levels.find((l) => l.level === next) : null
                  const open = openId === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => setOpenId(open ? null : t.id)}
                      aria-expanded={open}
                      className="lift rounded p-4 text-left"
                      style={{
                        background: 'var(--panel)',
                        border: `1px solid ${open ? 'rgba(255, 182, 39, 0.45)' : 'var(--rule)'}`,
                      }}
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="label t-label" style={{ color: 'var(--dim)' }}>
                          {t.order}
                        </span>
                        <span className="mono t-mono flex-1" style={{ color: 'var(--ink)' }}>
                          {t.title}
                        </span>
                        <span className="label t-label" style={{ color: 'var(--dim)' }}>
                          {cleared}/{t.levels.length}
                        </span>
                      </div>
                      <div className="mt-3">
                        <ProgressBar
                          clean={cleared - shaky}
                          shaky={shaky}
                          total={t.levels.length}
                        />
                      </div>
                      <p className="t-mono mt-3 truncate" style={{ color: 'var(--dim)' }}>
                        {nextLv ? `${levelName(nextLv.level)} · ${nextLv.blurb}` : 'All five cleared'}
                      </p>
                    </button>
                  )
                })}
              </div>

              {/* Level picker: expands in place below the open card's row.
                  A panel, not a modal — modals are a different app. */}
              {openTopic && (
                <div
                  className="fade-rise space-y-px rounded"
                  style={{ background: 'var(--rule)', border: '1px solid var(--rule)' }}
                >
                  {openTopic.levels.map((lv) => {
                    const done = isLevelDone(progress, openTopic.id, lv.level)
                    const shakyLv = needsAnotherLook(progress, openTopic.id, lv.level)
                    const ids = openTopic.levels.map((l) => l.level)
                    const isNext = nextLevel(progress, openTopic.id, ids) === lv.level
                    const mark = done ? (shakyLv ? 'var(--amber)' : 'var(--good)') : null
                    return (
                      <button
                        key={lv.level}
                        onClick={() => onPick(openTopic.id, lv.level)}
                        className="flex w-full items-center gap-4 px-4 py-3 text-left"
                        style={{ background: 'var(--ground)' }}
                      >
                        <span
                          className="label t-label flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                          style={{
                            background: done && !shakyLv ? 'var(--good)' : 'transparent',
                            border: `1px solid ${mark ?? (isNext ? 'var(--amber)' : 'var(--rule)')}`,
                            color: done
                              ? shakyLv
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
                            className="label t-label"
                            style={{ color: mark ?? (isNext ? 'var(--amber)' : 'var(--ink)') }}
                          >
                            {levelName(lv.level)}
                          </span>
                        </span>
                        <span className="t-body flex-1" style={{ color: 'var(--dim)' }}>
                          {lv.blurb}
                        </span>
                        <span
                          className="label t-label"
                          style={{ color: shakyLv ? 'var(--amber)' : 'var(--rule)' }}
                        >
                          {shakyLv ? 'Worth another go' : done ? 'Again' : isNext ? 'Next' : 'Jump'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </Fragment>
          )
        })}
      </div>

      <p className="t-body mt-12 max-w-lg" style={{ color: 'var(--rule)' }}>
        Nothing is locked. If Beginner insults you, jump to Advanced — the ladder is a
        suggestion, not a gate.
      </p>
    </div>
  )
}
