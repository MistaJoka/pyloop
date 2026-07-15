import { useEffect, useMemo, useState } from 'react'
import { Runtime, type RuntimeStatus } from './engine/runtime'
import { levelOf, topicById } from './content/topics'
import type { Level, LevelId } from './content/types'
import { TopicMap } from './ui/TopicMap'
import { LoopShell } from './ui/LoopShell'
import { completeLevel, load, save, type Progress } from './progress/store'

type Open = { topicId: string; level: LevelId }

export default function App() {
  const [status, setStatus] = useState<RuntimeStatus>('booting')
  // One runtime for the app's lifetime. It restarts itself internally when a
  // snippet runs away, so nothing above here has to care.
  const runtime = useMemo(() => new Runtime(setStatus), [])
  const [progress, setProgress] = useState<Progress>(() => load())
  const [open, setOpen] = useState<Open | null>(null)

  useEffect(() => {
    save(progress)
  }, [progress])

  const topic = open ? topicById(open.topicId) : null
  const level = topic && open ? levelOf(topic, open.level) : null

  return (
    <div className="mx-auto min-h-full max-w-4xl px-6 py-10 sm:px-10 sm:py-16">
      {topic && level ? (
        <LoopShell
          topic={topic}
          level={level}
          runtime={runtime}
          onComplete={(outcome) =>
            setProgress((p) => completeLevel(p, topic.id, level.level, outcome))
          }
          onExit={() => setOpen(null)}
          onNextLevel={(next: Level) => setOpen({ topicId: topic.id, level: next.level })}
        />
      ) : (
        <TopicMap
          progress={progress}
          onPick={(topicId, lvl) => setOpen({ topicId, level: lvl })}
        />
      )}

      <p className="label mt-16 text-[10px]" style={{ color: 'var(--rule)' }}>
        Python {status === 'ready' ? 'ready' : status === 'booting' ? 'warming up' : 'restarting'}
      </p>
    </div>
  )
}
