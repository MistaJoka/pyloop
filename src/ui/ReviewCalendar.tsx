import { useState } from 'react'
import type { Progress } from '../progress/store'
import { today } from '../progress/store'

function monthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startPad = first.getDay() // 0 = Sunday
  const days: (string | null)[] = Array(startPad).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d)
    days.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`)
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
        <button onClick={() => shift(-1)} className="label text-[11px]" style={{ color: 'var(--dim)' }}>←</button>
        <span className="label text-[13px]" style={{ color: 'var(--ink)' }}>{monthLabel}</span>
        <button onClick={() => shift(1)} className="label text-[11px]" style={{ color: 'var(--dim)' }}>→</button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} />
          const count = countOn(progress, day)
          const isPast = day <= todayStr
          const clickable = count > 0 && isPast
          return (
            <button
              key={day}
              disabled={!clickable}
              onClick={() => clickable && onOpenDay(day)}
              className="mono flex flex-col items-center rounded p-2 text-[11px]"
              style={{
                border: `1px solid ${day === todayStr ? 'var(--amber)' : 'var(--rule)'}`,
                color: clickable ? 'var(--amber)' : 'var(--dim)',
                opacity: clickable ? 1 : 0.6,
              }}
            >
              <span>{Number(day.slice(-2))}</span>
              {count > 0 && <span style={{ color: 'var(--good)' }}>{count}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
