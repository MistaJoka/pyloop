import type { Check } from '../engine/types'

export type LevelId = 1 | 2 | 3 | 4 | 5

export const LEVEL_NAMES: Record<LevelId, string> = {
  1: 'Beginner',
  2: 'Working',
  3: 'Fluent',
  4: 'Advanced',
  5: 'Master',
}

/** A Level is a whole lesson — not a variant of one. Everything scales:
 *  its own idea, trace, prediction and fix. This is exactly the shape the
 *  four-stage loop consumes, which is why adding difficulty touched no engine
 *  code. */
export type Level = {
  level: LevelId
  /** One line, shown on the map: what this rung is actually about.
   *  Plain text — it renders as a bare label, so backticks show up literally. */
  blurb: string
  concept: {
    /** Short. If it takes more than ~60 seconds to read, it's too long. */
    body: string
    /** The AI-specialty angle: why this matters past the course. */
    aiFraming: string
  }
  watch: {
    code: string
    /** What gets "typed" when the snippet calls input(). Required for any
     *  snippet that reads input — without it input() raises EOFError. */
    stdin?: string
    /** The exception type this snippet is MEANT to die of, e.g. `'ValueError'`.
     *
     *  Normally a watch that errors is a broken watch, and verify-content fails
     *  it. The exceptions topic needs the opposite: the crash IS the lesson, and
     *  the WATCH panel is built to render it ("crashed here", type/msg/line, the
     *  variables frozen where it blew up). Declaring the type here says "this is
     *  deliberate" AND pins it — verify-content then fails if the snippet does
     *  not raise, or raises something else. So it's a tighter gate than silence,
     *  not a hole in it. Omit it and any error is still a failure. */
    expectError?: string
    /** Line number → what that line MEANS, for "what is this?" in the line
     *  detail panel.
     *
     *  What a line DID is derived from the trace and costs nothing. This is the
     *  other half: the syntax gloss. Only write one where the line is genuinely
     *  unfamiliar — a note on `total = 0` is noise, and noise is what makes him
     *  stop reading them. Sparse on purpose; most lines have none. */
    notes?: Record<number, string>
  }
  predict: {
    code: string
    /** What gets "typed" if the snippet calls input(). `verify-content` already
     *  fed this; the field was missing from the type, so a predict that read
     *  input could only ever fail. */
    stdin?: string
    /** The exception type this snippet is MEANT to die of. Same contract as
     *  `watch.expectError`, and it costs the PREDICT stage nothing: PREDICT
     *  never runs the code, it only shows it. The answer stays exactly what it
     *  always was — what Python actually prints — which for a crashing snippet
     *  is everything it printed BEFORE it stopped. That the output already made
     *  it out is the point; the error does not take it back. */
    expectError?: string
    question: string
    choices: string[]
    answerIndex: number
    explain: string
  }
  fix: {
    task: string
    brokenCode: string
    /** Fed to input() for both the broken code and the solution. */
    stdin?: string
    check: Check
    hints: string[]
    /** The worked answer, offered only after every hint is spent.
     *
     *  Without this, running out of hints was a dead end: no way forward, and
     *  the level stayed unrecorded. Reading a worked solution costs far less
     *  than quitting. Taking it marks the level `assisted`, which is how the
     *  map knows it's worth another go.
     *
     *  `npm run verify-content` runs this against the real check, so a solution
     *  that doesn't actually pass fails the build. */
    solution: string
  }
  /** Optional deeper cut. Always skippable; never gates DONE. */
  stretch?: { title: string; body: string; code?: string }
}

/** Topics are data, not code. Adding or reordering one touches nothing else. */
export type Topic = {
  id: string
  title: string
  order: number
  /** Beginner → Master. Five is the intent; a topic may honestly carry fewer
   *  rather than pad the ladder with filler. */
  levels: Level[]
}

export const levelName = (l: LevelId) => LEVEL_NAMES[l]
