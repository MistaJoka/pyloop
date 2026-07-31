import { capstones, coveredTopicIds } from '../content/capstones'
import type { Capstone, CapstoneId } from '../content/capstones/types'
import { topics } from '../content/topics'
import { capstonePassed, type Progress } from '../progress/store'
import { ProgressBar } from './ProgressBar'

/** The topics a capstone stands on, deduped, in course order — chip fodder. */
function capstoneTopics(c: Capstone) {
  const ids = new Set(c.stages.flatMap((s) => s.topicRefs.map((r) => r.topicId)))
  return topics.filter((t) => ids.has(t.id))
}

export function CapstoneCatalog({
  progress,
  onOpen,
}: {
  progress: Progress
  onOpen: (id: CapstoneId) => void
}) {
  const covered = coveredTopicIds(capstones)

  return (
    <div>
      <h1 className="label t-display" style={{ color: 'var(--ink)' }}>
        Capstones
      </h1>
      <p className="t-lead mt-3 max-w-2xl" style={{ color: 'var(--dim)' }}>
        Whole programs, not exercises. Each one is built in four checkpoints, runs as one
        piece, and ends with something worth watching. The rungs it stands on are pinned to
        every checkpoint — wobble on one, replay it, come back.
      </p>

      {/* The honest coverage claim: computed, not asserted. */}
      <div className="mt-6 max-w-2xl">
        <p className="label t-label" style={{ color: 'var(--dim)' }}>
          Together they exercise {covered.size} of {topics.length} topics on the map
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {topics.map((t) => {
            const hit = covered.has(t.id)
            return (
              <span
                key={t.id}
                className="label rounded px-2 py-0.5 t-label"
                style={{
                  border: `1px solid ${hit ? 'var(--rule)' : 'transparent'}`,
                  color: hit ? 'var(--dim)' : 'var(--rule)',
                }}
              >
                {t.title}
              </span>
            )
          })}
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {capstones.map((c) => {
          const passed = capstonePassed(progress, c.id)
          return (
            <button
              key={c.id}
              onClick={() => onOpen(c.id)}
              className="lift w-full rounded p-5 text-left"
              style={{
                background: 'var(--panel)',
                border: `1px solid ${
                  passed >= 4
                    ? 'var(--good)'
                    : passed > 0
                      ? 'color-mix(in srgb, var(--amber) 45%, transparent)'
                      : 'var(--rule)'
                }`,
              }}
            >
              <div className="flex items-baseline gap-3">
                <span className="label t-label" style={{ color: 'var(--amber)' }}>
                  {c.title}
                </span>
                <span className="label ml-auto t-label" style={{ color: 'var(--dim)' }}>
                  {passed}/4
                </span>
              </div>
              <p className="t-lead mt-1.5 max-w-2xl" style={{ color: 'var(--ink)' }}>
                {c.blurb}
              </p>
              <div className="mt-3 max-w-xs">
                <ProgressBar clean={passed} shaky={0} total={4} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {capstoneTopics(c).map((t) => (
                  <span
                    key={t.id}
                    className="label rounded px-2 py-0.5 t-label"
                    style={{ border: '1px solid var(--rule)', color: 'var(--dim)' }}
                  >
                    {t.title}
                  </span>
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
