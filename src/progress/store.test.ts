import { afterEach, describe, expect, it, vi } from 'vitest'
import { completeLevel, load, needsAnotherLook, nextInterval, save, type Progress, recordReview, dueOn, today } from './store'

/** Drive the clock to a specific LOCAL wall-clock moment. */
function at(local: string) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(local))
}

afterEach(() => {
  vi.useRealTimers()
  localStorage.clear()
})

const fresh = (): Progress => ({ version: 2, topics: {} })

describe('completeLevel', () => {
  it('records a cleared level', () => {
    at('2026-07-15T20:00:00')
    const p = completeLevel(fresh(), 'for-loops', 1, { predictCorrect: true, assisted: false })
    expect(p.topics['for-loops'].levels[1]).toMatchObject({
      completed: true,
      predictCorrect: true,
      assisted: false,
      attempts: 1,
    })
  })

  it('does not launder a missed prediction on a later attempt', () => {
    at('2026-07-15T20:00:00')
    let p = completeLevel(fresh(), 'for-loops', 1, { predictCorrect: true, assisted: false })
    p = completeLevel(p, 'for-loops', 1, { predictCorrect: false, assisted: false })
    expect(p.topics['for-loops'].levels[1]?.predictCorrect).toBe(false) // latest wins
    expect(p.topics['for-loops'].levels[1]?.attempts).toBe(2)
  })

  it('lets a clean redo clear the assisted mark', () => {
    at('2026-07-15T20:00:00')
    let p = completeLevel(fresh(), 'for-loops', 1, { predictCorrect: false, assisted: true })
    expect(needsAnotherLook(p, 'for-loops', 1)).toBe(true)
    p = completeLevel(p, 'for-loops', 1, { predictCorrect: true, assisted: false })
    expect(needsAnotherLook(p, 'for-loops', 1)).toBe(false)
  })

  it('flags a level cleared with a guessed prediction for another look', () => {
    at('2026-07-15T20:00:00')
    const p = completeLevel(fresh(), 'for-loops', 3, { predictCorrect: false, assisted: false })
    expect(needsAnotherLook(p, 'for-loops', 3)).toBe(true)
  })

  it('does not flag a clean clear', () => {
    at('2026-07-15T20:00:00')
    const p = completeLevel(fresh(), 'for-loops', 2, { predictCorrect: true, assisted: false })
    expect(needsAnotherLook(p, 'for-loops', 2)).toBe(false)
  })
})

describe('lastSeen uses the local calendar day', () => {
  // toISOString() would stamp a 9pm US session with tomorrow's date. The streak
  // that this originally broke is gone, but lastSeen is the input any future
  // review scheduling would use — a wrong date here misleads quietly.
  it.each([
    ['America/New_York', '2026-07-15T21:30:00', '2026-07-15'],
    ['America/Los_Angeles', '2026-07-15T23:00:00', '2026-07-15'],
    ['Asia/Tokyo', '2026-07-15T08:00:00', '2026-07-15'],
    ['UTC', '2026-07-15T12:00:00', '2026-07-15'],
  ])('in %s a session at %s is stamped %s', (tz, when, expected) => {
    const prev = process.env.TZ
    process.env.TZ = tz
    try {
      at(when)
      const p = completeLevel(fresh(), 'for-loops', 1, { predictCorrect: true, assisted: false })
      expect(p.topics['for-loops'].levels[1]?.lastSeen).toBe(expected)
    } finally {
      process.env.TZ = prev
    }
  })
})

describe('persistence', () => {
  it('round-trips through localStorage', () => {
    at('2026-07-15T20:00:00')
    const p = completeLevel(fresh(), 'for-loops', 4, { predictCorrect: false, assisted: true })
    save(p)
    expect(load()).toEqual(p)
  })

  it('migrates v1, keeping a cleared topic as Beginner', () => {
    localStorage.setItem(
      'pyloop.progress.v1',
      JSON.stringify({
        version: 1,
        topics: {
          'for-loops': { completed: true, predictCorrect: true, attempts: 2, lastSeen: '2026-07-14' },
        },
        streak: { count: 9, lastDay: '2026-07-14' }, // v1 had a streak; it's gone now
      }),
    )
    const p = load()
    expect(p.version).toBe(2)
    expect(p.topics['for-loops'].levels[1]?.completed).toBe(true)
    expect(p).not.toHaveProperty('streak')
  })

  it('drops a leftover streak field from older v2 blobs', () => {
    localStorage.setItem(
      'pyloop.progress.v1',
      JSON.stringify({
        version: 2,
        topics: { 'for-loops': { levels: {} } },
        streak: { count: 4, lastDay: '2026-07-14' },
      }),
    )
    expect(load()).not.toHaveProperty('streak')
  })

  it('returns empty progress rather than throwing on corrupt data', () => {
    localStorage.setItem('pyloop.progress.v1', '{not json')
    expect(load().topics).toEqual({})
  })
})

describe('nextInterval', () => {
  it('starts a never-reviewed item at 1 day', () => {
    expect(nextInterval(null, true)).toBe(1)
  })

  it('advances 1 -> 3 -> 7 -> 30 on repeated correct answers', () => {
    expect(nextInterval(1, true)).toBe(3)
    expect(nextInterval(3, true)).toBe(7)
    expect(nextInterval(7, true)).toBe(30)
  })

  it('holds at 30 once matured', () => {
    expect(nextInterval(30, true)).toBe(30)
  })

  it('resets to 1 on a wrong answer, from any interval', () => {
    expect(nextInterval(1, false)).toBe(1)
    expect(nextInterval(7, false)).toBe(1)
    expect(nextInterval(30, false)).toBe(1)
    expect(nextInterval(null, false)).toBe(1)
  })
})

describe('review scheduling', () => {
  it('seeds a 1-day review on first clear, and leaves it alone on a redo', () => {
    at('2026-07-15T20:00:00')
    let p = completeLevel(fresh(), 'for-loops', 1, { predictCorrect: true, assisted: false })
    expect(p.topics['for-loops'].levels[1]?.nextReviewDue).toBe('2026-07-16')
    expect(p.topics['for-loops'].levels[1]?.reviewIntervalDays).toBe(1)

    // Redoing the level (not via Review) shouldn't reset an existing schedule.
    p = { ...p, topics: { ...p.topics, 'for-loops': { levels: { ...p.topics['for-loops'].levels, 1: { ...p.topics['for-loops'].levels[1]!, nextReviewDue: '2026-08-01', reviewIntervalDays: 7 } } } } }
    p = completeLevel(p, 'for-loops', 1, { predictCorrect: true, assisted: false })
    expect(p.topics['for-loops'].levels[1]?.nextReviewDue).toBe('2026-08-01')
    expect(p.topics['for-loops'].levels[1]?.reviewIntervalDays).toBe(7)
  })

  it('recordReview advances the schedule on a correct answer', () => {
    at('2026-07-15T20:00:00')
    let p = completeLevel(fresh(), 'for-loops', 1, { predictCorrect: true, assisted: false })
    at('2026-07-16T20:00:00')
    p = recordReview(p, 'for-loops', 1, true)
    expect(p.topics['for-loops'].levels[1]?.reviewIntervalDays).toBe(3)
    expect(p.topics['for-loops'].levels[1]?.nextReviewDue).toBe('2026-07-19')
  })

  it('recordReview resets to 1 day on a wrong answer', () => {
    at('2026-07-15T20:00:00')
    let p = completeLevel(fresh(), 'for-loops', 1, { predictCorrect: true, assisted: false })
    at('2026-07-16T20:00:00')
    p = recordReview(p, 'for-loops', 1, false)
    expect(p.topics['for-loops'].levels[1]?.reviewIntervalDays).toBe(1)
    expect(p.topics['for-loops'].levels[1]?.nextReviewDue).toBe('2026-07-17')
  })

  it('dueOn finds items due today or earlier, and excludes future ones', () => {
    at('2026-07-15T20:00:00')
    let p = completeLevel(fresh(), 'for-loops', 1, { predictCorrect: true, assisted: false }) // due 07-16
    p = completeLevel(p, 'for-loops', 2, { predictCorrect: true, assisted: false }) // due 07-16
    expect(dueOn(p, '2026-07-16')).toHaveLength(2)
    expect(dueOn(p, '2026-07-15')).toHaveLength(0) // not due yet
    expect(dueOn(p, '2026-07-20')).toHaveLength(2) // overdue items still show
  })

  it('today() reports the local calendar day', () => {
    at('2026-07-15T20:00:00')
    expect(today()).toBe('2026-07-15')
  })
})
