/** Shape gates for what each capstone's collect harness returned. The payoff
 *  players trust their input; these are the bouncers at the door — shared
 *  verbatim by the UI and by scripts/verify-content.mjs, so the gate the
 *  build enforces is the exact gate the learner hits.
 *
 *  This file rides the esbuild content bundle: it must never import from
 *  src/ui/ (that would drag React into a node script). */
import type { PayoffKind } from './types'

/** Life: a non-empty stack of same-sized, non-empty 2D grids of 0/1. */
export type GridHistory = number[][][]

export function isGridHistory(v: unknown): v is GridHistory {
  if (!Array.isArray(v) || v.length === 0) return false
  const first = v[0]
  if (!Array.isArray(first) || first.length === 0) return false
  const rows = first.length
  const cols = Array.isArray(first[0]) ? first[0].length : -1
  if (cols <= 0) return false
  return v.every(
    (g) =>
      Array.isArray(g) &&
      g.length === rows &&
      g.every(
        (row) =>
          Array.isArray(row) && row.length === cols && row.every((c) => c === 0 || c === 1),
      ),
  )
}

/** Wrangle: the raw file, a keep/reject verdict per line, the clean rows,
 *  and the closing stats. */
export type TablePayoff = {
  raw: string[]
  verdicts: { line: string; kept: boolean }[]
  rows: { name: string; age: number; score: number }[]
  stats: { count: number; mean_score: number; min_score: number; max_score: number; top: string }
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isStr = (v: unknown): v is string => typeof v === 'string'

export function isTablePayoff(v: unknown): v is TablePayoff {
  if (!isRecord(v)) return false
  const { raw, verdicts, rows, stats } = v
  if (!Array.isArray(raw) || raw.length === 0 || !raw.every(isStr)) return false
  if (
    !Array.isArray(verdicts) ||
    verdicts.length !== raw.length ||
    !verdicts.every((x) => isRecord(x) && isStr(x.line) && typeof x.kept === 'boolean')
  )
    return false
  if (
    !Array.isArray(rows) ||
    !rows.every((r) => isRecord(r) && isStr(r.name) && isNum(r.age) && isNum(r.score))
  )
    return false
  if (!isRecord(stats)) return false
  return (
    isNum(stats.count) &&
    isNum(stats.mean_score) &&
    isNum(stats.min_score) &&
    isNum(stats.max_score) &&
    isStr(stats.top)
  )
}

/** Cipher: the message, its encoding character by character, all 26 shift
 *  candidates, and the shift the crack picked. */
export type CipherPayoff = {
  message: string
  shift: number
  encoded: string
  chars: { plain: string; cipher: string }[]
  candidates: { shift: number; text: string }[]
  cracked: number
}

export function isCipherPayoff(v: unknown): v is CipherPayoff {
  if (!isRecord(v)) return false
  const { message, shift, encoded, chars, candidates, cracked } = v
  if (!isStr(message) || message.length === 0 || !isStr(encoded)) return false
  if (encoded.length !== message.length || !isNum(shift)) return false
  if (
    !Array.isArray(chars) ||
    chars.length !== message.length ||
    !chars.every(
      (c) => isRecord(c) && isStr(c.plain) && c.plain.length === 1 && isStr(c.cipher) && c.cipher.length === 1,
    )
  )
    return false
  if (
    !Array.isArray(candidates) ||
    candidates.length !== 26 ||
    !candidates.every((c) => isRecord(c) && isNum(c.shift) && isStr(c.text))
  )
    return false
  return isNum(cracked) && Number.isInteger(cracked) && cracked >= 0 && cracked <= 25
}

/** Markov: the generated walk. tokens[0] is the start word; steps[i] shows
 *  the candidate table the model chose tokens[i+1] from — so a player can
 *  scrub to any step and show what the model was weighing. */
export type TextGenPayoff = {
  start: string
  tokens: string[]
  steps: { word: string; options: [string, number][]; chosen: string }[]
}

export function isTextGenPayoff(v: unknown): v is TextGenPayoff {
  if (!isRecord(v)) return false
  const { start, tokens, steps } = v
  if (!isStr(start) || !Array.isArray(tokens) || tokens.length === 0 || !tokens.every(isStr))
    return false
  if (!Array.isArray(steps) || tokens.length !== steps.length + 1) return false
  return steps.every(
    (s) =>
      isRecord(s) &&
      isStr(s.word) &&
      isStr(s.chosen) &&
      Array.isArray(s.options) &&
      s.options.length > 0 &&
      s.options.every(
        (o) => Array.isArray(o) && o.length === 2 && isStr(o[0]) && isNum(o[1]),
      ),
  )
}

/** Ledger: a fixed transaction script's play-by-play, then the balance that
 *  came back from disk. */
export type LedgerPayoff = {
  owner: string
  opening: number
  steps: { op: string; amount: number; ok: boolean; balance: number; error: string | null }[]
  final: number
  replayed: number
}

export function isLedgerPayoff(v: unknown): v is LedgerPayoff {
  if (!isRecord(v)) return false
  const { owner, opening, steps, final, replayed } = v
  if (!isStr(owner) || !isNum(opening) || !isNum(final) || !isNum(replayed)) return false
  if (!Array.isArray(steps) || steps.length === 0) return false
  return steps.every(
    (s) =>
      isRecord(s) &&
      isStr(s.op) &&
      isNum(s.amount) &&
      typeof s.ok === 'boolean' &&
      isNum(s.balance) &&
      (s.error === null || isStr(s.error)),
  )
}

export const payoffValidators: Record<PayoffKind, (v: unknown) => boolean> = {
  grid: isGridHistory,
  table: isTablePayoff,
  cipher: isCipherPayoff,
  textgen: isTextGenPayoff,
  ledger: isLedgerPayoff,
}
