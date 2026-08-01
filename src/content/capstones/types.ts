import type { Check } from '../../engine/types'
import type { LevelId } from '../types'

export type CapstoneId = 'life' | 'wrangle' | 'cipher' | 'markov' | 'ledger'

/** Which payoff player renders `__collect__`, and which shape validator
 *  gates it. One kind per capstone; the payload types live in payoff.ts. */
export type PayoffKind = 'grid' | 'table' | 'cipher' | 'textgen' | 'ledger'

/** A rung this stage stands on. Rendered as a jump chip; verify-content
 *  checks it resolves to a real topic and a level that topic actually has. */
export type TopicRef = { topicId: string; level: LevelId }

/** One section of the finished-build walkthrough. Sections marked `aside`
 *  are shown but NOT part of the joined program — they explain the harness
 *  PyLoop runs after your code. Everything else, joined in order with blank
 *  lines between, IS the finished program: verify-content proves the joined
 *  code passes all four stage checks and the payoff, and the reading view's
 *  Run button runs exactly that joined code. */
export type WalkthroughSection = {
  title: string
  /** Markdown prose: what this part does and the decision behind it —
   *  the syntax gloss belongs in `notes`, not here. */
  body: string
  /** Python. `notes` line numbers are 1-based WITHIN this section. */
  code: string
  /** Watch-style: only genuinely tricky lines get one. Sparse on purpose. */
  notes?: Record<number, string>
  /** Rungs this section stands on — rendered as jump chips like the stages'. */
  topicRefs?: TopicRef[]
  /** True = explanatory only; excluded from the joined runnable program. */
  aside?: true
}

export type CapstoneStage = {
  id: 1 | 2 | 3 | 4
  title: string
  /** What to write, as markdown. Includes any literal data the stage needs. */
  task: string
  /** Runs against the learner's WHOLE program — checks are cumulative by
   *  construction. */
  check: Check
  /** Fix-style ladder. The LAST hint names the topic · rung to review in
   *  prose — there is no solution reveal in the capstone. `topicRefs` below
   *  is the machine truth the chips and verify-content use. */
  hints: string[]
  topicRefs: TopicRef[]
}

export type Capstone = {
  id: CapstoneId
  title: string
  blurb: string
  /** Markdown: the real job this code mirrors, and where it points next.
   *  Shown as a card before the first checkpoint. */
  whyItMatters: string
  payoffKind: PayoffKind
  /** Heading over the payoff player, e.g. "Your world, 40 generations". */
  payoffLabel: string
  /** Fed to input() for every stage check AND the payoff run. A capstone
   *  that reads input declares here what gets typed. */
  stdin?: string
  /** Editor placeholder before any code exists. */
  placeholder?: string
  /** Run-button label once all four checkpoints are passed. */
  runCta?: string
  /** Exactly four — the progress shape (`passed: 0|1|2|3|4`) counts on it. */
  stages: [CapstoneStage, CapstoneStage, CapstoneStage, CapstoneStage]
  /** Runs after stage 4 passes, in the same namespace as the learner's
   *  program; must assign a JSON-serializable payload to __collect__. */
  harness: string
  /** Python asserts over __collect__, run by verify-content in the same
   *  namespace as solution + harness — the semantic half of the payoff gate
   *  (the shape half is payoff.ts's validator, shared with the UI). */
  payoffAsserts: string
  /** Reference program satisfying all four checks. verify-content only —
   *  never surfaced in the UI. */
  solution: string
  /** The finished build, for reading. Joined non-aside code must pass every
   *  stage check and the payoff — verify-content gates it. */
  walkthrough: WalkthroughSection[]
  stretches: { title: string; body: string; code?: string }[]
}
