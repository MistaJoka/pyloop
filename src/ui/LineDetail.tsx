import { useState } from 'react'
import type { LineDetail as Detail, LineVisit } from '../engine/line-detail'
import { Markdown } from './Markdown'

/** Phrase one visit in terms of what actually happened.
 *
 *  A loop header that changed nothing didn't "do nothing" — it checked whether
 *  to go round again and found nothing left. Reporting that as "no change" is
 *  technically true and pedagogically useless. */
function VisitLine({
  visit,
  isLoopHeader,
  onJump,
}: {
  visit: LineVisit
  isLoopHeader: boolean
  onJump: () => void
}) {
  const { changes, printed, crashed } = visit
  const nothing = changes.length === 0 && !printed

  return (
    <button
      onClick={onJump}
      className="mono flex w-full items-baseline gap-3 rounded px-2 py-1.5 text-left text-[12px] hover:bg-[color:var(--panel-hi)]"
      title="Jump the player to this moment"
    >
      <span className="label w-12 shrink-0 text-[9px]" style={{ color: 'var(--rule)' }}>
        {isLoopHeader && nothing ? '·' : `#${visit.nth}`}
      </span>

      <span className="flex-1">
        {crashed && (
          <span style={{ color: 'var(--hot)' }}>crashed here</span>
        )}

        {changes.map((c) => (
          <span key={c.name} className="mr-4 inline-block">
            <span style={{ color: 'var(--dim)' }}>{c.name}</span>{' '}
            {c.from === null ? (
              <>
                <span style={{ color: 'var(--rule)' }}>=</span>{' '}
                <span style={{ color: 'var(--hot)' }}>{c.to}</span>
              </>
            ) : (
              <>
                <span style={{ color: 'var(--dim)' }}>{c.from}</span>
                <span style={{ color: 'var(--rule)' }}> → </span>
                <span style={{ color: 'var(--hot)' }}>{c.to}</span>
              </>
            )}
          </span>
        ))}

        {printed && (
          <span className="inline-block">
            <span className="label mr-2 text-[9px]" style={{ color: 'var(--rule)' }}>
              printed
            </span>
            <span style={{ color: 'var(--good)' }}>{JSON.stringify(printed)}</span>
          </span>
        )}

        {nothing && !crashed && (
          <span style={{ color: 'var(--rule)' }}>
            {isLoopHeader ? 'checked — nothing left to take' : 'no visible change'}
          </span>
        )}
      </span>
    </button>
  )
}

export function LineDetail({
  detail,
  note,
  onJump,
  onClose,
}: {
  detail: Detail
  note?: string
  onJump: (stepIndex: number) => void
  onClose: () => void
}) {
  const [showNote, setShowNote] = useState(false)
  const n = detail.visits.length

  return (
    <div className="mt-px p-5" style={{ background: 'var(--panel)' }}>
      <div className="flex items-baseline gap-3">
        <span className="label text-[10px]" style={{ color: 'var(--amber)' }}>
          Line {detail.line}
        </span>
        <code className="mono flex-1 text-[13px]" style={{ color: 'var(--ink)' }}>
          {detail.source.trim()}
        </code>
        {note && (
          <button
            onClick={() => setShowNote((s) => !s)}
            className="label text-[10px]"
            style={{ color: showNote ? 'var(--amber)' : 'var(--dim)' }}
          >
            {showNote ? 'Hide' : 'What is this?'}
          </button>
        )}
        <button onClick={onClose} className="label text-[10px]" style={{ color: 'var(--dim)' }}>
          Close
        </button>
      </div>

      {/* The authored half: what the line MEANS. On demand, so the panel stays
          about what happened unless he asks. */}
      {showNote && note && (
        <div
          className="mt-4 rounded p-4 text-[15px]"
          style={{ background: 'var(--ground)', borderLeft: '2px solid var(--amber)' }}
        >
          <div style={{ color: 'var(--dim)' }}>
            <Markdown text={note} />
          </div>
        </div>
      )}

      <p className="label mt-4 text-[10px]" style={{ color: 'var(--dim)' }}>
        {n === 0 ? 'Never ran' : n === 1 ? 'Ran once' : `Ran ${n} times`}
        {n > 0 && <span style={{ color: 'var(--rule)' }}> · click a row to jump there</span>}
      </p>

      {n === 0 ? (
        <p className="mt-2 text-sm" style={{ color: 'var(--rule)' }}>
          This line never executed, so there's nothing to show.
        </p>
      ) : (
        <div className="mt-2 space-y-px">
          {detail.visits.map((v) => (
            <VisitLine
              key={v.stepIndex}
              visit={v}
              isLoopHeader={detail.isLoopHeader}
              onJump={() => onJump(v.stepIndex)}
            />
          ))}
        </div>
      )}

      {detail.untouched.length > 0 && n > 0 && (
        <p className="mono mt-4 text-[11px]" style={{ color: 'var(--rule)' }}>
          never touched by this line: {detail.untouched.join(', ')}
        </p>
      )}
    </div>
  )
}
