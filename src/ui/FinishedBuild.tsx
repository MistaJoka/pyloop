import type { Capstone, TopicRef } from '../content/capstones/types'
import { walkthroughProgram } from '../content/capstones'
import type { Runtime } from '../engine/runtime'
import { AnnotatedCode } from './AnnotatedCode'
import { Markdown } from './Markdown'
import { TopicChips } from './TopicChips'
import { usePayoffRunner } from './usePayoffRunner'

/** The finished capstone, for reading: the whole program in annotated
 *  sections, then a Run button that executes exactly the code on this page
 *  and plays the payoff. Reading is not building — nothing here advances
 *  the checkpoints, by design. */
export function FinishedBuild({
  capstone,
  runtime,
  onBack,
  onOpenTopic,
}: {
  capstone: Capstone
  runtime: Runtime
  onBack: () => void
  onOpenTopic: (ref: TopicRef) => void
}) {
  const { busy, payoffValue, playError, payoff, run } = usePayoffRunner(capstone, runtime)
  let part = 0

  return (
    <div>
      <h2 className="label t-title" style={{ color: 'var(--ink)' }}>
        {capstone.title}
      </h2>
      <p className="t-lead mt-2 max-w-2xl" style={{ color: 'var(--dim)' }}>
        {capstone.blurb}
      </p>

      <div
        className="mt-6 max-w-2xl rounded p-5"
        style={{ background: 'var(--panel)', borderLeft: '2px solid var(--amber)' }}
      >
        <p className="label mb-2 t-label" style={{ color: 'var(--amber)' }}>
          The finished build, for reading
        </p>
        <p className="t-body" style={{ color: 'var(--dim)' }}>
          This is the whole program, working, explained piece by piece — dotted lines have a
          note behind them. Reading a program is not building one: your own build lives on
          the capstone page, and nothing here ticks a checkpoint. Read it before, during, or
          after — seeing how the pieces fit is exactly what worked examples are for.
        </p>
      </div>

      <button
        onClick={onBack}
        className="label lift mt-4 rounded px-4 py-2 t-label"
        style={{ border: '1px solid var(--rule)', color: 'var(--dim)' }}
      >
        ← Back to the build
      </button>

      <div className="mt-8 max-w-3xl space-y-10">
        {capstone.walkthrough.map((s, n) => {
          if (!s.aside) part += 1
          return (
            <div key={n}>
              <p className="label mb-1 t-label" style={{ color: 'var(--amber)' }}>
                {s.aside ? 'After your program runs' : `Part ${part}`} · {s.title}
              </p>
              <div className="mb-4 max-w-2xl" style={{ color: 'var(--dim)' }}>
                <Markdown text={s.body} />
              </div>
              <AnnotatedCode code={s.code} notes={s.notes} />
              {s.topicRefs && <TopicChips refs={s.topicRefs} onOpenTopic={onOpenTopic} />}
            </div>
          )
        })}
      </div>

      <div className="mt-10">
        <button
          onClick={() => void run(walkthroughProgram(capstone))}
          disabled={busy}
          className="label rounded px-5 py-2.5 t-label"
          style={{ background: 'var(--amber)', color: 'var(--ground)', opacity: busy ? 0.5 : 1 }}
        >
          {busy ? 'Running…' : capstone.runCta ?? 'Run it'}
        </button>
        <p className="label mt-2 t-label" style={{ color: 'var(--rule)' }}>
          Runs exactly the code above — the parts, joined
        </p>
      </div>

      {playError && (
        <div className="mt-5">
          <p className="label mb-2 t-label" style={{ color: 'var(--hot)' }}>
            The payoff stumbled
          </p>
          <p className="mono t-mono" style={{ color: 'var(--ink)' }}>
            {playError.line != null && (
              <span style={{ color: 'var(--dim)' }}>line {playError.line}: </span>
            )}
            {playError.msg}
          </p>
        </div>
      )}

      {payoffValue != null && payoff && (
        <div className="fade-rise mt-8">
          <p className="label mb-3 t-label" style={{ color: 'var(--amber)' }}>
            {capstone.payoffLabel}
          </p>
          {payoff.render(payoffValue)}
        </div>
      )}
    </div>
  )
}
