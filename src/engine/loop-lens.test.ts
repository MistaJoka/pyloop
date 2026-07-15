import { beforeAll, describe, expect, it } from 'vitest'
import { loadPyodide } from 'pyodide'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { forHeaders, loopLenses, splitReprItems } from './loop-lens'
import type { TraceResult } from './types'

let trace: (code: string) => string
beforeAll(async () => {
  const py = await loadPyodide()
  py.runPython(readFileSync(fileURLToPath(new URL('./tracer.py', import.meta.url)), 'utf8'))
  trace = py.globals.get('trace')
}, 120_000)
const T = (code: string) => JSON.parse(trace(code)) as TraceResult

describe('splitReprItems', () => {
  it('splits a flat list', () => {
    expect(splitReprItems('[10, 20, 30]')).toEqual(['10', '20', '30'])
  })

  it('keeps nested lists whole', () => {
    // Splitting on ", " would give four bogus items.
    expect(splitReprItems('[[1, 2], [3, 4]]')).toEqual(['[1, 2]', '[3, 4]'])
  })

  it('does not split inside quoted strings', () => {
    expect(splitReprItems("['a,b', 'c']")).toEqual(["'a,b'", "'c'"])
  })

  it('handles escaped quotes', () => {
    expect(splitReprItems("['it\\'s', 'x']")).toEqual(["'it\\'s'", "'x'"])
  })

  it('handles dicts and tuples as items', () => {
    expect(splitReprItems("[{'a': 1, 'b': 2}, (3, 4)]")).toEqual(["{'a': 1, 'b': 2}", '(3, 4)'])
  })

  it('handles an empty list and a single item', () => {
    expect(splitReprItems('[]')).toEqual([])
    expect(splitReprItems('[42]')).toEqual(['42'])
  })

  it('returns null for things that are not lists', () => {
    expect(splitReprItems('30')).toBeNull()
    expect(splitReprItems("'hello'")).toBeNull()
    expect(splitReprItems("{'a': 1}")).toBeNull()
  })

  it('surfaces a truncated repr honestly', () => {
    expect(splitReprItems('[0, 1, 2, ...]')).toEqual(['0', '1', '2', '...'])
  })
})

describe('forHeaders', () => {
  it('finds loops that walk a named list', () => {
    expect(forHeaders('for n in nums:\n    pass')).toEqual(new Map([[1, 'nums']]))
  })

  it('ignores loops that walk indices or a generator', () => {
    // These don't consume a named list, so a cursor over one would be a lie.
    expect(forHeaders('for i in range(len(names)):').size).toBe(0)
    expect(forHeaders('for a, b in zip(x, y):').size).toBe(0)
    expect(forHeaders('for n in [1, 2, 3]:').size).toBe(0)
  })

  it('finds both headers of a nested loop', () => {
    const code = `for group in groups:
    for n in group:
        pass`
    expect(forHeaders(code)).toEqual(new Map([[1, 'groups'], [2, 'group']]))
  })
})

describe('loopLenses', () => {
  const LOOP = `total = 0
nums = [10, 20, 30]
for n in nums:
    total = total + n`

  it('walks the cursor one item per pass', () => {
    const r = T(LOOP)
    const seen = r.steps.map((_, i) => {
      const l = loopLenses(r, LOOP, i).nums
      return l ? `${l.cursor}` : '-'
    })
    // before the loop: no lens (nums not yet defined, then defined but pass 0)
    expect(seen.filter((s) => s !== '-')).toContain('0')
    expect(seen).toContain('1')
    expect(seen).toContain('2')
    expect(seen.at(-1)).toBe('-1') // exhausted
  })

  it('reports pass N of total', () => {
    const r = T(LOOP)
    const atBody = r.steps.findIndex((s) => s.line === 4)
    const l = loopLenses(r, LOOP, atBody).nums
    expect(l).toMatchObject({ pass: 1, total: 3, cursor: 0, items: ['10', '20', '30'] })
  })

  it('counts passes rather than matching values, so duplicates do not fool it', () => {
    // Value-matching would put pass 2's cursor back on index 0.
    const code = `xs = [1, 1, 2]
for n in xs:
    y = n`
    const r = T(code)
    const bodySteps = r.steps.map((s, i) => [s, i] as const).filter(([s]) => s.line === 3)
    const cursors = bodySteps.map(([, i]) => loopLenses(r, code, i).xs.cursor)
    expect(cursors).toEqual([0, 1, 2])
  })

  it('gives nested loops independent cursors', () => {
    const code = `groups = [[1, 2], [3, 4]]
for group in groups:
    for n in group:
        y = n`
    const r = T(code)
    // Every visit to the inner BODY, in order. Across both outer passes the
    // inner cursor must read 0,1 then 0,1 again — the inner loop restarts when
    // the outer hands it a new list.
    const bodies = r.steps.map((s, i) => [s, i] as const).filter(([s]) => s.line === 4)
    const seen = bodies.map(([, i]) => {
      const l = loopLenses(r, code, i)
      return `groups:${l.groups.cursor} group:${l.group.cursor}`
    })
    expect(seen).toEqual([
      'groups:0 group:0',
      'groups:0 group:1',
      'groups:1 group:0',
      'groups:1 group:1',
    ])
  })

  it('restarts the inner loop counter when the outer rebinds its list', () => {
    // The counter used to accumulate across outer passes, so the second group
    // read "nothing left" from its very first item.
    const code = `groups = [[1, 2], [3, 4]]
for group in groups:
    for n in group:
        y = n`
    const r = T(code)
    const last = r.steps.map((s, i) => [s, i] as const).filter(([s]) => s.line === 4).at(-1)!
    const l = loopLenses(r, code, last[1])
    expect(l.group).toMatchObject({ items: ['3', '4'], pass: 2, total: 2, cursor: 1 })
  })

  it('has no lens for a loop over indices', () => {
    const code = `names = ["a", "b"]
for i in range(len(names)):
    print(names[i])`
    const r = T(code)
    expect(loopLenses(r, code, r.steps.length - 1)).toEqual({})
  })
})
