import { useEffect, useMemo, useState } from 'react'
import { Runtime, type RuntimeStatus } from './engine/runtime'
import { levelOf, topicById } from './content/topics'
import type { Level, LevelId } from './content/types'
import { TopicMap } from './ui/TopicMap'
import { LoopShell } from './ui/LoopShell'
import { Review } from './ui/Review'
import { CapstoneShell } from './ui/CapstoneShell'
import { Shell, type ShellMode } from './ui/Shell'
import {
  capstonePassed,
  completeLevel,
  dueOn,
  load,
  recordReview,
  save,
  saveCapstone,
  today,
  type Progress,
} from './progress/store'

type Open = { topicId: string; level: LevelId }

export default function App() {
  const [status, setStatus] = useState<RuntimeStatus>('booting')
  // One runtime for the app's lifetime. It restarts itself internally when a
  // snippet runs away, so nothing above here has to care.
  const runtime = useMemo(() => new Runtime(setStatus), [])
  const [progress, setProgress] = useState<Progress>(() => load())
  const [open, setOpen] = useState<Open | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [capstoneOpen, setCapstoneOpen] = useState(false)

  useEffect(() => {
    save(progress)
  }, [progress])

  const topic = open ? topicById(open.topicId) : null
  const level = topic && open ? levelOf(topic, open.level) : null
  const mode: ShellMode =
    topic && level ? 'loop' : reviewOpen ? 'review' : capstoneOpen ? 'capstone' : 'map'

  return (
    <Shell
      mode={mode}
      status={status}
      dueTodayCount={dueOn(progress, today()).length}
      onMap={() => {
        setOpen(null)
        setReviewOpen(false)
        setCapstoneOpen(false)
      }}
      onReview={() => {
        setOpen(null)
        setReviewOpen(true)
        setCapstoneOpen(false)
      }}
    >
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
      ) : reviewOpen ? (
        <Review
          progress={progress}
          runtime={runtime}
          onRecord={(topicId, lvl, correct) =>
            setProgress((p) => recordReview(p, topicId, lvl, correct))
          }
        />
      ) : capstoneOpen ? (
        <CapstoneShell
          runtime={runtime}
          progress={progress.capstone}
          onSave={(patch) => setProgress((p) => saveCapstone(p, patch))}
        />
      ) : (
        <TopicMap
          progress={progress}
          onPick={(topicId, lvl) => setOpen({ topicId, level: lvl })}
          dueTodayCount={dueOn(progress, today()).length}
          onOpenReview={() => setReviewOpen(true)}
          capstonePassedCount={capstonePassed(progress)}
          onOpenCapstone={() => setCapstoneOpen(true)}
        />
      )}
    </Shell>
  )
}
