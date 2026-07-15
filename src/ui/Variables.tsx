import type { Lens } from '../engine/loop-lens'
import type { TraceStep } from '../engine/types'

export type Change = { from: string | null; to: string }

/** `NoneType` is what Python calls it; `None` is what he'll type. */
const TYPE_LABEL: Record<string, string> = { NoneType: 'None' }
const typeLabel = (t: string) => TYPE_LABEL[t] ?? t

const heatClass = (n: number) => `heat-${Math.min(n, 3)}`

/** Stepping into a function otherwise looks like every variable you had was
 *  destroyed and replaced by strangers. Scope is the thing functions exist to
 *  teach — say it out loud rather than letting the panel imply the opposite. */
function FrameBadge({ fn, depth }: { fn: string; depth: number }) {
  return (
    <div
      className="mb-3 rounded px-2 py-1.5"
      style={{ background: 'var(--ground)', borderLeft: '2px solid var(--amber)' }}
    >
      <span className="label text-[9px]" style={{ color: 'var(--amber)' }}>
        inside {fn}()
      </span>
      <p className="mt-0.5 text-[11px]" style={{ color: 'var(--rule)' }}>
        its own variables{depth > 1 ? ` · ${depth} calls deep` : ' · the caller’s are paused, not gone'}
      </p>
    </div>
  )
}

/** A list the loop is walking, drawn as the boxes it actually is, with the
 *  cursor on the item being processed right now.
 *
 *  This is the whole point of the lens: "what's left to consume" and "which
 *  pass am I on" are the two invisible things in a for loop, and a flat
 *  `[10, 20, 30]` shows neither. */
function ListLens({ lens }: { lens: Lens }) {
  const done = lens.cursor === -1 && lens.pass > 0
  return (
    <span className="inline-flex flex-col gap-1">
      <span className="flex flex-wrap items-center gap-px">
        {lens.items.length === 0 && <span style={{ color: 'var(--rule)' }}>[ ]</span>}
        {lens.items.map((item, n) => {
          const here = n === lens.cursor
          const spent = lens.cursor === -1 ? lens.pass > 0 : n < lens.cursor
          return (
            <span
              key={n}
              className="px-1.5 py-0.5"
              style={{
                background: here ? 'var(--amber)' : 'transparent',
                border: `1px solid ${here ? 'var(--amber)' : 'var(--rule)'}`,
                color: here ? 'var(--ground)' : spent ? 'var(--rule)' : 'var(--ink)',
                textDecoration: spent ? 'line-through' : undefined,
              }}
            >
              {item}
            </span>
          )
        })}
      </span>
      {lens.pass > 0 && (
        <span className="label text-[9px]" style={{ color: done ? 'var(--rule)' : 'var(--amber)' }}>
          {done ? 'nothing left' : `pass ${lens.pass} of ${lens.total}`}
        </span>
      )}
    </span>
  )
}

export function Variables({
  step,
  changes,
  heat,
  lenses,
}: {
  step: TraceStep | undefined
  changes: Record<string, Change>
  heat: Record<string, number>
  lenses: Record<string, Lens>
}) {
  if (!step) return null
  const inside = step.depth > 0
  const names = Object.keys(step.locals)

  return (
    <div>
      {inside && <FrameBadge fn={step.fn} depth={step.depth} />}
      {names.length === 0 ? (
        <p className="mono text-[13px]" style={{ color: 'var(--rule)' }}>
          none yet
        </p>
      ) : (
        <div className="mono space-y-2 text-[13px]">
          {Object.entries(step.locals).map(([name, v]) => {
            const ch = changes[name]
            const lens = lenses[name]
            return (
              <div key={name} className="flex gap-2">
                <span className="w-14 shrink-0" style={{ color: 'var(--dim)' }}>
                  {name}
                </span>
                {/* The type was already captured on every step and thrown away.
                    int vs str is the confusion behind most intro-Python errors —
                    showing it teaches that for free, on every level. */}
                <span
                  className="w-9 shrink-0 text-[10px] leading-6"
                  style={{ color: 'var(--rule)' }}
                >
                  {typeLabel(v.type)}
                </span>
                {lens ? (
                  <ListLens lens={lens} />
                ) : (
                  <span className={`${heatClass(heat[name] ?? 3)} break-all`}>
                    {/* old → new, so recency is legible without relying on colour */}
                    {ch?.from != null && (
                      <span className="mr-1.5" style={{ color: 'var(--dim)' }}>
                        {ch.from} →
                      </span>
                    )}
                    {v.repr}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
