import { useState } from 'react'
import { levelName, type Level, type Topic } from '../content/types'
import type { Runtime } from '../engine/runtime'
import type { TraceResult } from '../engine/types'
import { Watch } from './Watch'
import { Predict } from './Predict'

type Stage = 'predict' | 'replay' | 'reask'

export function ReviewItem({
  topic,
  level,
  runtime,
  onFinished,
}: {
  topic: Topic
  level: Level
  runtime: Runtime
  onFinished: (correct: boolean) => void
}) {
  const [stage, setStage] = useState<Stage>('predict')
  const [trace, setTrace] = useState<TraceResult | null>(null)
  const [tracing, setTracing] = useState(false)
  const [traceFailed, setTraceFailed] = useState<string | null>(null)

  function handleFirstAnswer(correct: boolean) {
    if (correct) {
      onFinished(true)
      return
    }
    setTracing(true)
    setTraceFailed(null)
    runtime
      .trace(level.watch.code, level.watch.stdin ?? '')
      .then((r) => {
        setTrace(r)
        setTracing(false)
        setStage('replay')
      })
      .catch((e: Error) => {
        setTracing(false)
        setTraceFailed(e.message)
        setStage('replay')
      })
  }

  return (
    <div>
      <p className="label mb-4 text-[10px]" style={{ color: 'var(--dim)' }}>
        {topic.title} · <span style={{ color: 'var(--amber)' }}>{levelName(level.level)}</span> · review
      </p>

      {stage === 'predict' && (
        <Predict level={level} nextLabel="Continue →" onDone={handleFirstAnswer} />
      )}

      {stage === 'replay' &&
        (traceFailed ? (
          <div>
            <p className="mono text-[13px]" style={{ color: 'var(--hot)' }}>
              Couldn't load the trace — try again
            </p>
          </div>
        ) : tracing || !trace ? (
          <p style={{ color: 'var(--dim)' }}>Tracing…</p>
        ) : (
          <div>
            <p className="label mb-3 text-[10px]" style={{ color: 'var(--amber)' }}>
              Missed it — here's the trace again
            </p>
            <Watch
              code={level.watch.code}
              result={trace}
              notes={level.watch.notes}
              loading={false}
              onDone={() => setStage('reask')}
            />
          </div>
        ))}

      {stage === 'reask' && (
        <div>
          <p className="label mb-3 text-[10px]" style={{ color: 'var(--dim)' }}>
            Once more, now that you've seen it
          </p>
          {/* This second attempt is for reinforcement only — the schedule
              already recorded the miss from the first, real attempt. */}
          <Predict level={level} nextLabel="Continue →" onDone={() => onFinished(false)} />
        </div>
      )}
    </div>
  )
}
