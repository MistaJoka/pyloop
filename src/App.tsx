import { useEffect, useMemo, useState } from 'react'
import { Runtime, type RuntimeStatus } from './engine/runtime'
import { levelOf, topicById } from './content/topics'
import { capstoneById, capstones } from './content/capstones'
import type { CapstoneId } from './content/capstones/types'
import type { Level, LevelId } from './content/types'
import { TopicMap } from './ui/TopicMap'
import { LoopShell } from './ui/LoopShell'
import { Review } from './ui/Review'
import { CapstoneShell } from './ui/CapstoneShell'
import { CapstoneCatalog } from './ui/CapstoneCatalog'
import { Shell, type ShellMode } from './ui/Shell'
import {
  capstoneTotals,
  completeLevel,
  dueOn,
  load,
  recordReview,
  save,
  saveCapstone,
  today,
  type Progress,
} from './progress/store'

/** The whole "router". A lesson opened from a capstone carries `returnTo`,
 *  so finishing (or bailing) lands back in that capstone, not on the map.
 *  Explicit nav — Map/Review/Capstones buttons — always drops the trail. */
type View =
  | { kind: 'map' }
  | { kind: 'review' }
  | { kind: 'capstones' }
  | { kind: 'capstone'; id: CapstoneId }
  | { kind: 'loop'; topicId: string; level: LevelId; returnTo?: CapstoneId }

export default function App() {
  const [status, setStatus] = useState<RuntimeStatus>('booting')
  // One runtime for the app's lifetime. It restarts itself internally when a
  // snippet runs away, so nothing above here has to care.
  const runtime = useMemo(() => new Runtime(setStatus), [])
  const [progress, setProgress] = useState<Progress>(() => load())
  const [view, setView] = useState<View>({ kind: 'map' })

  useEffect(() => {
    save(progress)
  }, [progress])

  const topic = view.kind === 'loop' ? topicById(view.topicId) : null
  const level = view.kind === 'loop' && topic ? levelOf(topic, view.level) : null
  const capstone = view.kind === 'capstone' ? capstoneById(view.id) : null
  const returnTo = view.kind === 'loop' ? view.returnTo : undefined
  const returnCapstone = returnTo ? capstoneById(returnTo) : null

  const mode: ShellMode =
    topic && level
      ? 'loop'
      : view.kind === 'review'
        ? 'review'
        : view.kind === 'capstones'
          ? 'capstones'
          : capstone
            ? 'capstone'
            : 'map'

  return (
    <Shell
      mode={mode}
      status={status}
      dueTodayCount={dueOn(progress, today()).length}
      onMap={() => setView({ kind: 'map' })}
      onReview={() => setView({ kind: 'review' })}
      onCapstones={() => setView({ kind: 'capstones' })}
    >
      {topic && level ? (
        <LoopShell
          topic={topic}
          level={level}
          runtime={runtime}
          onComplete={(outcome) =>
            setProgress((p) => completeLevel(p, topic.id, level.level, outcome))
          }
          onExit={() =>
            setView(returnTo ? { kind: 'capstone', id: returnTo } : { kind: 'map' })
          }
          onNextLevel={(next: Level) =>
            setView({ kind: 'loop', topicId: topic.id, level: next.level, returnTo })
          }
          exitLabel={returnCapstone ? `← Back to ${returnCapstone.title}` : undefined}
        />
      ) : view.kind === 'review' ? (
        <Review
          progress={progress}
          runtime={runtime}
          onRecord={(topicId, lvl, correct) =>
            setProgress((p) => recordReview(p, topicId, lvl, correct))
          }
        />
      ) : view.kind === 'capstones' ? (
        <CapstoneCatalog
          progress={progress}
          onOpen={(id) => setView({ kind: 'capstone', id })}
        />
      ) : capstone ? (
        <CapstoneShell
          key={capstone.id}
          capstone={capstone}
          runtime={runtime}
          progress={progress.capstones[capstone.id]}
          onSave={(patch) => setProgress((p) => saveCapstone(p, capstone.id, patch))}
          onOpenTopic={(ref) =>
            setView({
              kind: 'loop',
              topicId: ref.topicId,
              level: ref.level,
              returnTo: capstone.id,
            })
          }
        />
      ) : (
        <TopicMap
          progress={progress}
          onPick={(topicId, lvl) => setView({ kind: 'loop', topicId, level: lvl })}
          dueTodayCount={dueOn(progress, today()).length}
          onOpenReview={() => setView({ kind: 'review' })}
          capstoneTotals={capstoneTotals(progress, capstones.map((c) => c.id))}
          onOpenCapstones={() => setView({ kind: 'capstones' })}
        />
      )}
    </Shell>
  )
}
