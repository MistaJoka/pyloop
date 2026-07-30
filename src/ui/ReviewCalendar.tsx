import { useState } from 'react'
import type { Progress } from '../progress/store'
import { dueOn, localDay, today } from '../progress/store'

function monthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startPad = first.getDay() // 0 = Sunday
  const days: (string | null)[] = Array(startPad).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(localDay(new Date(year, month, d)))
  }
  return days
}

function countOn(progress: Progress, day: string): number {
  let n = 0
  for (const tp of Object.values(progress.topics)) {
    for (const lp of Object.values(tp.levels)) {
      if (lp?.nextReviewDue === day) n++
    }
  }
  return n
}

export function ReviewCalendar({
  progress,
  onOpenDay,
}: {
  progress: Progress
  onOpenDay: (day: string) => void
}) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const todayStr = today()
  const days = monthGrid(year, month)
  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <button onClick={() => shift(-1)} className="label t-label" style={{ color: 'var(--dim)' }}>←</button>
        <span className="label t-mono" style={{ color: 'var(--ink)' }}>{monthLabel}</span>
        <button onClick={() => shift(1)} className="label t-label" style={{ color: 'var(--dim)' }}>→</button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} />
          // Today's cell must reflect "due or overdue" (like the map's badge
          // and the actual queue), not an exact-date match — otherwise an
          // overdue item shows 0 on today's cell and is only clickable on the
          // day it was originally due, possibly in a different month.
          const count = day === todayStr ? dueOn(progress, day).length : countOn(progress, day)
          const isPast = day <= todayStr
          const clickable = count > 0 && isPast
          return (
            <button
              key={day}
              disabled={!clickable}
              onClick={() => clickable && onOpenDay(day)}
              className={`mono t-label flex flex-col items-center gap-0.5 rounded p-1.5 ${clickable ? 'lift' : ''}`}
              style={{
                border: `1px solid ${day === todayStr ? 'var(--amber)' : 'var(--rule)'}`,
                background: 'var(--panel)',
                color: clickable ? 'var(--ink)' : 'var(--dim)',
                opacity: clickable || day === todayStr ? 1 : 0.55,
              }}
            >
              <span>{Number(day.slice(-2))}</span>
              {count > 0 && (
                <span className="flex items-center gap-1" style={{ color: 'var(--good)' }}>
                  <span aria-hidden className="h-1 w-1 rounded-full" style={{ background: 'var(--good)' }} />
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
