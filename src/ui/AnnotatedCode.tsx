import { useState } from 'react'
import { Markdown } from './Markdown'

/** Static annotated code: Watch's line renderer without the trace. Lines
 *  with a note are clickable and expand it inline beneath the line — one
 *  open at a time, same as Watch's line detail. Notes are sparse by
 *  content convention; most lines are plain text. */
export function AnnotatedCode({
  code,
  notes,
}: {
  code: string
  /** 1-based line number → markdown note. */
  notes?: Record<number, string>
}) {
  const [openLine, setOpenLine] = useState<number | null>(null)
  const lines = code.split('\n')

  return (
    <div className="rounded p-5" style={{ background: 'var(--panel)' }}>
      <pre className="mono t-mono leading-7">
        {lines.map((l, n) => {
          const num = n + 1
          const note = notes?.[num]
          const open = openLine === num
          return (
            <div key={n}>
              <div
                role={note ? 'button' : undefined}
                tabIndex={note ? 0 : undefined}
                aria-label={note ? `Line ${num}: what's this line?` : undefined}
                onClick={note ? () => setOpenLine(open ? null : num) : undefined}
                onKeyDown={
                  note
                    ? (e) => {
                        if (e.key === 'Enter') setOpenLine(open ? null : num)
                      }
                    : undefined
                }
                className={`group -mx-2 flex px-2 ${note ? 'cursor-pointer' : ''}`}
                style={{
                  background: open ? 'var(--panel-hi)' : undefined,
                  borderLeft: `2px solid ${open ? 'var(--dim)' : 'transparent'}`,
                }}
              >
                <span
                  className="mr-4 w-5 select-none text-right"
                  style={{ color: '#565046' }}
                >
                  {num}
                </span>
                <span
                  style={{
                    color: open ? 'var(--ink)' : 'var(--dim)',
                    textDecoration: note ? 'underline dotted' : undefined,
                    textDecorationColor: note ? 'var(--rule)' : undefined,
                    textUnderlineOffset: 4,
                  }}
                >
                  {l || ' '}
                </span>
                {note && (
                  <span
                    className="label ml-3 self-center t-label opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: 'var(--rule)' }}
                  >
                    {open ? '' : "what's this line?"}
                  </span>
                )}
              </div>
              {note && open && (
                <div
                  className="fade-rise -mx-2 my-1 whitespace-normal rounded p-3"
                  style={{
                    background: 'var(--ground)',
                    borderLeft: '2px solid var(--amber)',
                    color: 'var(--dim)',
                  }}
                >
                  <Markdown text={note} />
                </div>
              )}
            </div>
          )
        })}
      </pre>
    </div>
  )
}
