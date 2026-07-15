import { afterEach, describe, expect, it, vi } from 'vitest'
import { completeLevel, load, needsAnotherLook, save, type Progress } from './store'

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
