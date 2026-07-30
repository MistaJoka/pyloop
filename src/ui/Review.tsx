import { useState } from 'react'
import type { LevelId } from '../content/types'
import { topicById, levelOf } from '../content/topics'
import type { Runtime } from '../engine/runtime'
import { dueOn, type DueItem, type Progress } from '../progress/store'
import { ReviewCalendar } from './ReviewCalendar'
import { ReviewItem } from './ReviewItem'

export function Review({
  progress,
  runtime,
  onRecord,
}: {
  progress: Progress
  runtime: Runtime
  onRecord: (topicId: string, level: LevelId, correct: boolean) => void
}) {
  const [queue, setQueue] = useState<DueItem[] | null>(null) // null = showing the calendar

  return <div>{renderBody()}</div>

  function renderBody() {
    if (queue === null) {
      return <ReviewCalendar progress={progress} onOpenDay={(day) => setQueue(dueOn(progress, day))} />
    }

    if (queue.length === 0) {
      return (
        <div className="fade-rise">
          <p className="label t-mono" style={{ color: 'var(--good)' }}>All caught up.</p>
          <button
            onClick={() => setQueue(null)}
            className="label mt-4 t-label"
            style={{ color: 'var(--dim)' }}
          >
            ← Calendar
          </button>
        </div>
      )
    }

    const [current, ...rest] = queue
    const topic = topicById(current.topicId)
    const level = topic && levelOf(topic, current.level)
    if (!topic || !level) {
      setQueue(rest) // stale reference (content changed since scheduling); skip it
      return null
    }

    return (
      <ReviewItem
        key={`${current.topicId}-${current.level}`}
        topic={topic}
        level={level}
        runtime={runtime}
        onFinished={(correct) => {
          onRecord(current.topicId, current.level, correct)
          setQueue(rest)
        }}
      />
    )
  }
}
