import { beforeAll, describe, expect, it } from 'vitest'
import { loadPyodide } from 'pyodide'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { lineDetail, visitedLines } from './line-detail'
import type { TraceResult } from './types'

let trace: (code: string) => string

beforeAll(async () => {
  const py = await loadPyodide()
  py.runPython(readFileSync(fileURLToPath(new URL('./tracer.py', import.meta.url)), 'utf8'))
  trace = py.globals.get('trace')
}, 120_000)

const T = (code: string) => JSON.parse(trace(code)) as TraceResult

const LOOP = `total = 0
nums = [10, 20, 30]
for n in nums:
    total = total + n
    print(n, total)`

describe('lineDetail — what a line did', () => {
  it('attributes a change to the line that CAUSED it, not the next one', () => {
    // The whole feature. `total = total + n` is line 4; it must own the total
    // changes and NOT claim it changed `n` (that's line 3's doing).
    const d = lineDetail(T(LOOP), LOOP, 4)
    expect(d.visits).toHaveLength(3)
    expect(d.visits.map((v) => v.changes)).toEqual([
      [{ name: 'total', from: '0', to: '10' }],
      [{ name: 'total', from: '10', to: '30' }],
      [{ name: 'total', from: '30', to: '60' }],
    ])
    expect(d.visits.flatMap((v) => v.changes).some((c) => c.name === 'n')).toBe(false)
  })

  it('gives the loop header the loop variable, and only that', () => {
    const d = lineDetail(T(LOOP), LOOP, 3)
    expect(d.isLoopHeader).toBe(true)
    const named = d.visits.map((v) => v.changes.map((c) => `${c.name}:${c.from}->${c.to}`).join())
    expect(named.slice(0, 3)).toEqual(['n:null->10', 'n:10->20', 'n:20->30'])
    // The final visit is the loop checking and finding nothing left.
    expect(d.visits.at(-1)!.changes).toEqual([])
  })

  it('captures what a line printed, per visit', () => {
    const d = lineDetail(T(LOOP), LOOP, 5)
    expect(d.visits.map((v) => v.printed)).toEqual(['10 10\n', '20 30\n', '30 60\n'])
    expect(d.visits.every((v) => v.changes.length === 0)).toBe(true) // print changes nothing
  })

  it('reports a line that ran once', () => {
    const d = lineDetail(T(LOOP), LOOP, 1)
    expect(d.visits).toHaveLength(1)
    expect(d.visits[0].changes).toEqual([{ name: 'total', from: null, to: '0' }])
  })

  it('names variables the line never touched', () => {
    const d = lineDetail(T(LOOP), LOOP, 4)
    expect(d.untouched).toContain('nums')
    expect(d.untouched).not.toContain('total')
  })

  it('carries the step index so a visit can jump the player', () => {
    const r = T(LOOP)
    const d = lineDetail(r, LOOP, 4)
    for (const v of d.visits) expect(r.steps[v.stepIndex].line).toBe(4)
  })
})

describe('lineDetail — edge cases', () => {
  it('marks the visit where the line crashed', () => {
    const code = `carts = [[5], [10]]
total = 0
for c in carts:
    total = total + c`
    const d = lineDetail(T(code), code, 4)
    expect(d.visits).toHaveLength(1)
    expect(d.visits[0].crashed).toBe(true)
  })

  it('returns no visits for a line that never ran', () => {
    const code = `x = 1
if x > 5:
    print("never")`
    expect(lineDetail(T(code), code, 3).visits).toEqual([])
    expect(visitedLines(T(code)).has(3)).toBe(false)
  })

  it('treats a while header as a loop header', () => {
    const code = `i = 0
while i < 2:
    i = i + 1`
    const d = lineDetail(T(code), code, 2)
    expect(d.isLoopHeader).toBe(true)
    // A while condition only ever checks — it changes nothing itself.
    expect(d.visits.every((v) => v.changes.length === 0)).toBe(true)
  })

  it('sees a rebinding to an equal value as no textual change', () => {
    // Honest limitation: we compare reprs, so `n` walking [1, 1] looks static
    // on the second 1. Pinning it so the behaviour is a decision, not a
    // surprise.
    const code = `for n in [1, 1]:\n    pass`
    const d = lineDetail(T(code), code, 1)
    expect(d.visits[0].changes).toEqual([{ name: 'n', from: null, to: '1' }])
    expect(d.visits[1].changes).toEqual([])
  })
})

describe('lineDetail across function calls', () => {
  const FN = `def double(x):
    result = x * 2
    return result

total = 0
for n in [1, 2]:
    total = total + double(n)
print(total)`

  it('credits a CALL line with what it did to this scope, not the callee\'s locals', () => {
    // The bug: the step after line 7 is inside double(), so a naive diff said
    // line 7 created `x` and that `total` vanished. Plausible and nonsense.
    const d = lineDetail(T(FN), FN, 7)
    expect(d.visits).toHaveLength(2)
    expect(d.visits.map((v) => v.changes)).toEqual([
      [{ name: 'total', from: '0', to: '2' }],
      [{ name: 'total', from: '2', to: '6' }],
    ])
    expect(d.visits.flatMap((v) => v.changes).some((c) => c.name === 'x')).toBe(false)
  })

  it('reads a line inside the function in its own frame', () => {
    const d = lineDetail(T(FN), FN, 2)
    expect(d.visits.map((v) => v.changes)).toEqual([
      [{ name: 'result', from: null, to: '2' }],
      [{ name: 'result', from: null, to: '4' }],
    ])
  })

  it('does not invent changes on a function\'s last line', () => {
    // `return result` has no next step in its own frame — the frame ends.
    const d = lineDetail(T(FN), FN, 3)
    expect(d.visits).toHaveLength(2)
    expect(d.visits.every((v) => v.changes.length === 0)).toBe(true)
  })
})
