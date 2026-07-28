import type { LevelId } from '../content/types'

const KEY = 'pyloop.progress.v1' // key is stable across versions; `version` inside discriminates

export type LevelProgress = {
  completed: boolean
  /** The most RECENT attempt — not a high-water mark. Sticky-true laundered
   *  failure: miss the prediction today, guess right tomorrow, and the record
   *  claimed you always knew it. Wrong monotonicity for a study tool. */
  predictCorrect: boolean
  /** Cleared by reading the worked solution rather than solving it. Not a
   *  punishment — it's what puts the level back in the deck. */
  assisted: boolean
  /** Times cleared. */
  attempts: number
  lastSeen: string
  /** Next local calendar day this level's predict should be re-asked.
   *  Optional so pre-existing saves (from before Review shipped) load fine
   *  with it simply absent — absent is read the same as "not yet scheduled". */
  nextReviewDue?: string | null
  /** The spacing interval that produced nextReviewDue, so the NEXT review
   *  can compute where to go from here. */
  reviewIntervalDays?: number | null
}

export type TopicProgress = {
  /** Sparse: only levels that have been touched appear. */
  levels: Partial<Record<LevelId, LevelProgress>>
}

export type DueItem = { topicId: string; level: LevelId }

/** Records where he's been, not how well he's performing. There is deliberately
 *  no streak, score, or reward here — completion state exists so the map can
 *  answer "which rungs have I done, and which did I fudge". */
export type Progress = {
  version: 2
  topics: Record<string, TopicProgress>
}

/** v1 stored one flat record per topic, before levels existed. */
type ProgressV1 = {
  version: 1
  topics: Record<
    string,
    { completed: boolean; predictCorrect: boolean; attempts: number; lastSeen: string }
  >
}

const empty = (): Progress => ({ version: 2, topics: {} })

/** A cleared topic in v1 was, in v2 terms, a cleared Beginner. */
function migrateV1(old: ProgressV1): Progress {
  const topics: Record<string, TopicProgress> = {}
  for (const [id, t] of Object.entries(old.topics)) {
    topics[id] = { levels: { 1: { ...t, assisted: false } } } // v1 predates the solution hatch
  }
  return { version: 2, topics }
}

export function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw) as Progress | ProgressV1
    // Rebuild rather than pass through: older blobs carry a `streak` field that
    // no longer exists, and re-saving it would keep it alive forever.
    if (parsed.version === 2) return { version: 2, topics: parsed.topics ?? {} }
    if (parsed.version === 1) return migrateV1(parsed)
    return empty()
  } catch {
    return empty()
  }
}

export function save(p: Progress) {
  localStorage.setItem(KEY, JSON.stringify(p))
}

/** A calendar day in the USER'S timezone.
 *
 *  Never use toISOString() here. It converts to UTC, so a 9pm US session gets
 *  stamped with tomorrow's date. This burned the old streak logic badly; it now
 *  only feeds `lastSeen`, but a wrong date there would quietly mislead anything
 *  that later schedules review. Local in, local out. */
const localDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const today = () => localDay(new Date())

/** Adds `n` local calendar days to a `localDay()`-formatted string. */
function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + n)
  return localDay(dt)
}

export function completeLevel(
  p: Progress,
  topicId: string,
  level: LevelId,
  outcome: { predictCorrect: boolean; assisted: boolean },
): Progress {
  const topic = p.topics[topicId] ?? { levels: {} }
  const prev = topic.levels[level]
  const firstClear = !prev?.completed
  return {
    ...p,
    topics: {
      ...p.topics,
      [topicId]: {
        levels: {
          ...topic.levels,
          [level]: {
            completed: true,
            // Latest attempt wins, both ways: a clean redo clears `assisted`,
            // and a fumbled redo un-sets predictCorrect. The record should say
            // where he is now, not the best he ever managed.
            predictCorrect: outcome.predictCorrect,
            assisted: outcome.assisted,
            attempts: (prev?.attempts ?? 0) + 1,
            lastSeen: today(),
            nextReviewDue: firstClear ? addDays(today(), 1) : (prev?.nextReviewDue ?? addDays(today(), 1)),
            reviewIntervalDays: firstClear ? 1 : (prev?.reviewIntervalDays ?? 1),
          },
        },
      },
    },
  }
}

/** Cleared, but not cleanly: guessed the prediction or read the solution.
 *  These are the levels worth coming back to. */
export const needsAnotherLook = (p: Progress, topicId: string, level: LevelId) => {
  const l = p.topics[topicId]?.levels[level]
  return !!l?.completed && (l.assisted || !l.predictCorrect)
}

export const isLevelDone = (p: Progress, topicId: string, level: LevelId) =>
  p.topics[topicId]?.levels[level]?.completed === true

export const clearedCount = (p: Progress, topicId: string) =>
  Object.values(p.topics[topicId]?.levels ?? {}).filter((l) => l?.completed).length

/** The lowest level not yet cleared — what the map points at. Nothing is
 *  locked; this is a suggestion, not a gate. */
export function nextLevel(p: Progress, topicId: string, levels: LevelId[]): LevelId | null {
  return levels.find((l) => !isLevelDone(p, topicId, l)) ?? null
}

const REVIEW_SCHEDULE = [1, 3, 7, 30]

/** Standard spaced-repetition progression: 1 -> 3 -> 7 -> 30 days, held at 30
 *  once matured. Any wrong answer resets to 1, from whatever interval it was
 *  at. `current` is the interval that was just tested — null before a level
 *  has ever been reviewed. */
export function nextInterval(current: number | null, correct: boolean): number {
  if (!correct) return REVIEW_SCHEDULE[0]
  if (current === null) return REVIEW_SCHEDULE[0]
  const i = REVIEW_SCHEDULE.indexOf(current)
  if (i === -1 || i === REVIEW_SCHEDULE.length - 1) return REVIEW_SCHEDULE[REVIEW_SCHEDULE.length - 1]
  return REVIEW_SCHEDULE[i + 1]
}

/** Answering one scheduled review: advances (or resets) the spacing interval
 *  and reschedules. Does not touch completed/predictCorrect/assisted — those
 *  describe the LOOP clear, not a later review answer. */
export function recordReview(
  p: Progress,
  topicId: string,
  level: LevelId,
  correct: boolean,
): Progress {
  const topic = p.topics[topicId] ?? { levels: {} }
  const prev = topic.levels[level]
  const interval = nextInterval(prev?.reviewIntervalDays ?? null, correct)
  return {
    ...p,
    topics: {
      ...p.topics,
      [topicId]: {
        levels: {
          ...topic.levels,
          [level]: {
            completed: prev?.completed ?? true,
            predictCorrect: prev?.predictCorrect ?? correct,
            assisted: prev?.assisted ?? false,
            attempts: prev?.attempts ?? 1,
            lastSeen: today(),
            nextReviewDue: addDays(today(), interval),
            reviewIntervalDays: interval,
          },
        },
      },
    },
  }
}

/** Every level scheduled on or before `day` — "due or overdue", so a
 *  skipped day never silently drops an item. */
export function dueOn(p: Progress, day: string): DueItem[] {
  const items: DueItem[] = []
  for (const [topicId, tp] of Object.entries(p.topics)) {
    for (const [levelStr, lp] of Object.entries(tp.levels)) {
      if (lp?.nextReviewDue && lp.nextReviewDue <= day) {
        items.push({ topicId, level: Number(levelStr) as LevelId })
      }
    }
  }
  return items
}
