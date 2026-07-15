import { useEffect, useState } from 'react'
import { levelName, type Level, type Topic } from '../content/types'
import type { Runtime } from '../engine/runtime'
import type { TraceResult } from '../engine/types'
import { Watch } from './Watch'
import { Predict } from './Predict'
import { Fix } from './Fix'
import { Done } from './Done'
import { Markdown } from './Markdown'

type Stage = 'concept' | 'watch' | 'predict' | 'fix' | 'done'
const STAGES: Stage[] = ['concept', 'watch', 'predict', 'fix', 'done']
const LABELS: Record<Stage, string> = {
  concept: 'Idea',
  watch: 'Watch',
  predict: 'Predict',
  fix: 'Fix',
  done: 'Done',
}

export function LoopShell({
  topic,
  level,
  runtime,
  onComplete,
  onExit,
  onNextLevel,
}: {
  topic: Topic
  level: Level
  runtime: Runtime
  onComplete: (outcome: { predictCorrect: boolean; assisted: boolean }) => void
  onExit: () => void
  onNextLevel: (next: Level) => void
}) {
  const [stage, setStage] = useState<Stage>('concept')
  const [trace, setTrace] = useState<TraceResult | null>(null)
  const [tracing, setTracing] = useState(true)
  const [traceFailed, setTraceFailed] = useState<string | null>(null)
  const [predictCorrect, setPredictCorrect] = useState(false)

  // Restart the loop when the level changes (e.g. "next rung" from Done).
  useEffect(() => {
    setStage('concept')
    setPredictCorrect(false)
  }, [level])

  // Trace up front, while the concept text is on screen. By the time he clicks
  // through, the animation is ready — no spinner with nothing to do.
  useEffect(() => {
    let alive = true
    setTracing(true)
    setTraceFailed(null)
    runtime
      .trace(level.watch.code, level.watch.stdin ?? '')
      .then((r) => {
        if (!alive) return
        // A Python error is NOT a failure to trace. The tracer returns the
        // steps up to the crash plus an `exception` step — watching a snippet
        // fall over is one of the most useful things here, so play it.
        setTrace(r)
        setTracing(false)
      })
      .catch((e: Error) => {
        if (!alive) return
        setTraceFailed(e.message)
        setTracing(false)
      })
    return () => {
      alive = false
    }
  }, [level, runtime])

  const nextInTopic = topic.levels.find((l) => l.level === level.level + 1) ?? null

  return (
    <div>
      {/* Stage rail — where you are in the seven minutes */}
      <div className="mb-3 flex items-center gap-2">
        <button onClick={onExit} className="label mr-3 text-[10px]" style={{ color: 'var(--dim)' }}>
          ← Map
        </button>
        {STAGES.map((s) => {
          const done = STAGES.indexOf(s) < STAGES.indexOf(stage)
          const here = s === stage
          return (
            <div key={s} className="flex items-center gap-2">
              <span
                className="label text-[10px]"
                style={{ color: here ? 'var(--amber)' : done ? 'var(--good)' : 'var(--rule)' }}
              >
                {LABELS[s]}
              </span>
              {s !== 'done' && (
                <span style={{ color: 'var(--rule)' }} className="text-[10px]">
                  ·
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Which rung you're on */}
      <p className="label mb-8 text-[10px]" style={{ color: 'var(--dim)' }}>
        {topic.title} · <span style={{ color: 'var(--amber)' }}>{levelName(level.level)}</span> ·{' '}
        {level.level} of {topic.levels.length}
      </p>

      {stage === 'concept' && (
        <div>
          <h2 className="label text-3xl" style={{ color: 'var(--ink)' }}>
            {topic.title}
          </h2>
          <p className="mt-1 text-lg" style={{ color: 'var(--dim)' }}>
            {level.blurb}
          </p>
          <div className="mt-5 max-w-2xl text-lg" style={{ color: 'var(--dim)' }}>
            <Markdown text={level.concept.body} />
          </div>

          <div
            className="mt-8 max-w-2xl rounded p-5"
            style={{ background: 'var(--panel)', borderLeft: '2px solid var(--amber)' }}
          >
            <p className="label mb-2 text-[10px]" style={{ color: 'var(--amber)' }}>
              Why it matters for AI
            </p>
            <div style={{ color: 'var(--dim)' }}>
              <Markdown text={level.concept.aiFraming} />
            </div>
          </div>

          <button
            onClick={() => setStage('watch')}
            className="label mt-8 rounded px-5 py-2.5 text-[11px]"
            style={{ background: 'var(--amber)', color: 'var(--ground)' }}
          >
            Watch it run →
          </button>
        </div>
      )}

      {stage === 'watch' &&
        (traceFailed ? (
          <div>
            <p className="mono text-[13px]" style={{ color: 'var(--hot)' }}>
              Couldn't run the trace: {traceFailed}
            </p>
            <button
              onClick={() => setStage('predict')}
              className="label mt-6 rounded px-5 py-2.5 text-[11px]"
              style={{ border: '1px solid var(--rule)', color: 'var(--ink)' }}
            >
              Skip ahead →
            </button>
          </div>
        ) : (
          <Watch
            code={level.watch.code}
            result={trace ?? { steps: [], stdout: '', error: null, capped: false }}
            notes={level.watch.notes}
            loading={tracing || !trace}
            onDone={() => setStage('predict')}
          />
        ))}

      {stage === 'predict' && (
        <Predict
          level={level}
          onDone={(correct) => {
            setPredictCorrect(correct)
            setStage('fix')
          }}
        />
      )}

      {stage === 'fix' && (
        <Fix
          level={level}
          runtime={runtime}
          onDone={(assisted) => {
            onComplete({ predictCorrect, assisted })
            setStage('done')
          }}
        />
      )}

      {stage === 'done' && (
        <Done
          topic={topic}
          level={level}
          nextLevel={nextInTopic}
          onBackToMap={onExit}
          onNextLevel={onNextLevel}
        />
      )}
    </div>
  )
}
