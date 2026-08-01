import type { TopicRef } from '../content/capstones/types'
import { topicById } from '../content/topics'
import { levelName } from '../content/types'

/** The "stands on" chip row: the rungs a checkpoint or walkthrough section
 *  rests on. Tap one, replay the lesson, and Done brings you straight back
 *  to wherever you left. */
export function TopicChips({
  refs,
  onOpenTopic,
}: {
  refs: TopicRef[]
  onOpenTopic: (ref: TopicRef) => void
}) {
  if (refs.length === 0) return null
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="label t-label" style={{ color: 'var(--rule)' }}>
        stands on
      </span>
      {refs.map((ref) => {
        const t = topicById(ref.topicId)
        return t ? (
          <button
            key={`${ref.topicId}-${ref.level}`}
            onClick={() => onOpenTopic(ref)}
            title="Replay this rung — you'll land back here after"
            className="label lift rounded px-2.5 py-1 t-label"
            style={{ border: '1px solid var(--rule)', color: 'var(--dim)' }}
          >
            {t.title} · {levelName(ref.level)}
          </button>
        ) : null
      })}
    </div>
  )
}
