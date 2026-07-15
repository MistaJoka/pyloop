import type { TraceResult } from './types'

/** `for <vars> in <name>:` — a BARE name only.
 *
 *  Deliberately no match for `for i in range(len(xs)):` or
 *  `for a, b in zip(x, y):`. Those loops don't walk a named list, they walk
 *  indices or a generator, and pretending otherwise would draw a cursor over
 *  something the loop isn't actually consuming. Fluent's whole point is that
 *  you're walking positions, not items — so it correctly gets no lens. */
const FOR_HEADER = /^\s*for\s+.+?\s+in\s+([A-Za-z_]\w*)\s*:/

export type Lens = {
  /** Item reprs, in order. */
  items: string[]
  /** 0-based index of the item being processed; -1 once the loop is done. */
  cursor: number
  /** 1-based pass number; 0 before the first, items.length+1 once exhausted. */
  pass: number
  total: number
}

/** Split a Python list repr into its item reprs.
 *
 *  Bracket- and quote-aware: naively splitting on ", " turns
 *  `[[1, 2], [3, 4]]` into four bogus items and `['a,b']` into two. Returns
 *  null for anything that isn't a list repr. A truncated repr (reprlib caps
 *  long lists) yields a trailing '...' item, which is honest — there really are
 *  more items than shown. */
export function splitReprItems(repr: string): string[] | null {
  if (!repr.startsWith('[') || !repr.endsWith(']')) return null
  const inner = repr.slice(1, -1).trim()
  if (!inner) return []
  const items: string[] = []
  let depth = 0
  let quote: string | null = null
  let start = 0
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i]
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = null
      continue
    }
    if (c === "'" || c === '"') quote = c
    else if ('([{'.includes(c)) depth++
    else if (')]}'.includes(c)) depth--
    else if (c === ',' && depth === 0) {
      items.push(inner.slice(start, i).trim())
      start = i + 1
    }
  }
  items.push(inner.slice(start).trim())
  return items
}

/** Which named list each `for` header walks: line number → variable name. */
export function forHeaders(code: string): Map<number, string> {
  const out = new Map<number, string>()
  code.split('\n').forEach((line, i) => {
    const m = FOR_HEADER.exec(line)
    if (m) out.set(i + 1, m[1])
  })
  return out
}

/** Where each walked list is up to, at a given step.
 *
 *  The pass number is derived by COUNTING visits to the `for` header, not by
 *  matching the loop variable's value against the list. Value-matching looks
 *  simpler and is wrong the moment a list holds duplicates — `[1, 1, 2]` would
 *  put the cursor back on the first item for the second pass.
 *
 *  The count RESETS whenever the iterable is rebound, which is what makes
 *  nested loops work: the outer loop hands the inner one a fresh list each
 *  pass, and the inner loop starts over. Counting straight through instead made
 *  the second group report "nothing left" from its very first item.
 *
 *  KNOWN LIMITATION, matters once the `functions` topic exists: visits are
 *  counted across every frame. A function containing a `for` loop, called twice
 *  with the SAME list, won't reset on the second call — the rebind check sees no
 *  change — so the cursor reads "nothing left" from the start of call two. Fix
 *  by keying the count on frame identity (depth + call ordinal), not just the
 *  iterable's repr. No shipped content hits this yet. */
export function loopLenses(
  result: TraceResult,
  code: string,
  stepIndex: number,
): Record<string, Lens> {
  const headers = forHeaders(code)
  if (!headers.size) return {}
  const step = result.steps[stepIndex]
  if (!step) return {}

  const out: Record<string, Lens> = {}
  for (const [line, name] of headers) {
    const value = step.locals[name]
    if (!value) continue
    const items = splitReprItems(value.repr)
    if (!items) continue // not a list — no lens

    let pass = 0
    let bound: string | undefined
    for (let i = 0; i <= stepIndex; i++) {
      const s = result.steps[i]
      const repr = s.locals[name]?.repr
      if (repr !== bound) {
        // A different list (or the first one): this loop starts over.
        bound = repr
        pass = 0
      }
      if (s.line === line && s.event === 'line') pass++
    }
    out[name] = {
      items,
      // Past the end = the loop checked and found nothing left.
      cursor: pass >= 1 && pass <= items.length ? pass - 1 : -1,
      pass,
      total: items.length,
    }
  }
  return out
}
