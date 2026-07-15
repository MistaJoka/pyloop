import { beforeAll, describe, expect, it } from 'vitest'
import { loadPyodide } from 'pyodide'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Real Pyodide — the tracer's whole job is to behave correctly under it.
let trace: (code: string, stdin?: string) => string
let runAsserts: (code: string, checks: string) => string

beforeAll(async () => {
  const py = await loadPyodide()
  py.runPython(readFileSync(fileURLToPath(new URL('./tracer.py', import.meta.url)), 'utf8'))
  trace = py.globals.get('trace')
  runAsserts = py.globals.get('run_with_asserts')
}, 120_000)

const T = (code: string) => JSON.parse(trace(code))

describe('locals snapshots', () => {
  it('records each step independently — a mutated list grows across steps', () => {
    const { steps } = T('acc = []\nfor i in range(3):\n    acc.append(i)')
    const seen = steps.filter((s: any) => 'acc' in s.locals).map((s: any) => s.locals.acc.repr)
    expect(new Set(seen)).toEqual(new Set(['[]', '[0]', '[0, 1]', '[0, 1, 2]']))
  })

  it('a line event is the state BEFORE that line runs', () => {
    // The contract the whole WATCH stage depends on. If this flips, every
    // line's explanation becomes an off-by-one lie.
    const { steps } = T('x = 1\nx = 2')
    const atLine2 = steps.find((s: any) => s.line === 2 && s.event === 'line')
    expect(atLine2.locals.x.repr).toBe('1') // NOT 2 — line 2 hasn't run yet
  })
})

describe('step cap', () => {
  it('caps a runaway loop', () => {
    const r = T('while True:\n    x = 1')
    expect(r.capped).toBe(true)
    expect(r.steps.length).toBe(10000)
  })

  it('cannot be swallowed by the user\'s own except (regression)', () => {
    // As an Exception this was caught by user code; tracing then switched off
    // and the loop ran to completion untraced, reporting capped=false with a
    // truncated trace — i.e. silently wrong output.
    const r = T(`
try:
    n = 0
    while True:
        n += 1
        if n > 300000:
            break
except Exception:
    pass
print('escaped', n)
`)
    expect(r.capped).toBe(true)
    expect(r.stdout).not.toContain('escaped')
  })

  it('still reports capped when a bare except: swallows the raise', () => {
    // Nothing in Python survives `except:` — it catches BaseException too. So
    // the snippet does run on (untraced) and its print lands. What we DO
    // guarantee is that we never report such a run as complete: capped stays
    // true, recorded outside the exception system.
    const r = T('try:\n    while True:\n        x = 1\nexcept:\n    print("caught")')
    expect(r.capped).toBe(true)
    expect(r.error).toBeNull()
  })
})

describe('payload size', () => {
  it('stays bounded when a snippet prints a lot', () => {
    // Cumulative stdout per step made this ~94MB.
    const raw = trace("for i in range(3000):\n    print('line', i)")
    expect(raw.length).toBeLessThan(2_000_000)
    const r = JSON.parse(raw)
    expect(r.stdout).toContain('line 2999')
  })

  it('handles a big list without choking', () => {
    // repr() built the full string then truncated; reprlib truncates while
    // building. The 10s worker timeout depends on this staying quick.
    const t0 = Date.now()
    const r = T('xs = list(range(5000))\ntotal = 0\nfor x in xs:\n    total += x')
    expect(Date.now() - t0).toBeLessThan(8000)
    expect(r.error).toBeNull()
    const xs = r.steps.find((s: any) => 'xs' in s.locals).locals.xs.repr
    expect(xs.length).toBeLessThan(300) // truncated, not a 5000-item string
  })
})

describe('errors', () => {
  it('reports type, message AND line number', () => {
    const r = T('x = 1\ny = x / 0')
    expect(r.error).toMatchObject({ type: 'ZeroDivisionError', line: 2 })
  })

  it('returns the partial trace so the crash can be watched', () => {
    const r = T('carts = [[5], [10]]\ntotal = 0\nfor c in carts:\n    total = total + c')
    expect(r.error.type).toBe('TypeError')
    expect(r.error.line).toBe(4)
    expect(r.steps.some((s: any) => s.event === 'exception')).toBe(true)
    expect(r.steps.at(-1).locals.total.repr).toBe('0') // state frozen at the crash
  })

  it('reports a syntax error with its line instead of throwing', () => {
    const r = T('x = 1\nfor i in range(3)\n    print(i)')
    expect(r.error.type).toBe('SyntaxError')
    expect(r.error.line).toBe(2)
  })

  it('restores sys.stdout after a crash', () => {
    T('raise ValueError("boom")')
    const after = T('print("still works")')
    expect(after.stdout).toBe('still works\n')
  })
})

describe('run_with_asserts', () => {
  it('passes a correct solution and exposes __stdout__', () => {
    const r = JSON.parse(
      runAsserts('total = 60\nprint(total)', 'assert total == 60\nassert __stdout__.strip() == "60"'),
    )
    expect(r.passed).toBe(true)
  })

  it('surfaces the assertion message on failure', () => {
    const r = JSON.parse(runAsserts('total = 30', 'assert total == 60, "not 60 yet"'))
    expect(r.passed).toBe(false)
    expect(r.error.msg).toBe('not 60 yet')
  })

  it('exposes __source__ for ast-based structural checks', () => {
    const checks = `
import ast
assert any(isinstance(n, ast.ListComp) for n in ast.walk(ast.parse(__source__))), "use a comprehension"
`
    expect(JSON.parse(runAsserts('d = [x*2 for x in [1,2]]', checks)).passed).toBe(true)
    expect(JSON.parse(runAsserts('d = []\nfor x in [1,2]:\n    d.append(x*2)', checks)).passed).toBe(false)
  })
})

describe('frames', () => {
  const FN = `def double(x):
    result = x * 2
    return result

total = 0
for n in [1, 2]:
    total = total + double(n)
print(total)`

  it('labels every step with its function and depth', () => {
    const { steps } = T(FN)
    const module = steps.filter((s: any) => s.depth === 0)
    const inside = steps.filter((s: any) => s.depth === 1)
    expect(module.every((s: any) => s.fn === '<module>')).toBe(true)
    expect(inside.length).toBeGreaterThan(0)
    expect(inside.every((s: any) => s.fn === 'double')).toBe(true)
  })

  it('shows the callee has its own locals, not the caller\'s', () => {
    const { steps } = T(FN)
    const inDouble = steps.find((s: any) => s.depth === 1 && s.line === 3)
    expect(Object.keys(inDouble.locals).sort()).toEqual(['result', 'x'])
    expect(inDouble.locals.total).toBeUndefined() // caller's vars are NOT here
  })

  it('tracks depth through recursion', () => {
    const rec = `def down(n):
    if n > 0:
        down(n - 1)
    return n
down(2)`
    const { steps } = T(rec)
    expect(Math.max(...steps.map((s: any) => s.depth))).toBe(3)
  })
})

describe('stdin', () => {
  it('input() raises EOFError when nothing is supplied', () => {
    const r = T('name = input("who? ")')
    expect(r.error).toMatchObject({ type: 'EOFError' })
  })

  it('feeds supplied stdin to input()', () => {
    const r = JSON.parse(trace('name = input("who? ")\nprint("hi", name)', 'Andrae\n'))
    expect(r.error).toBeNull()
    expect(r.stdout).toBe('who? hi Andrae\n')
  })

  it('feeds multiple lines in order', () => {
    const r = JSON.parse(trace('a = input()\nb = input()\nprint(b, a)', 'first\nsecond\n'))
    expect(r.stdout).toBe('second first\n')
  })
})

describe('untraced paths are still capped', () => {
  // verify-content runs these in Node with no worker and no timeout, so an
  // infinite fix.brokenCode would hang the build forever rather than fail it.
  it('run_with_asserts caps a runaway instead of hanging', () => {
    const t0 = Date.now()
    const r = JSON.parse(runAsserts('while True:\n    x = 1', 'assert x == 1'))
    expect(Date.now() - t0).toBeLessThan(15_000)
    expect(r.passed).toBe(false)
    expect(r.error).toMatchObject({ type: 'Runaway' })
  })

  it('still passes normal code', () => {
    const r = JSON.parse(runAsserts('x = 41 + 1', 'assert x == 42'))
    expect(r.passed).toBe(true)
  })
})

describe('filesystem isolation', () => {
  // Pyodide's FS persists for the life of the worker, so without a sandbox a
  // file written by one lesson is still there for the next: appends double up
  // and a "this file doesn't exist yet" lesson silently finds one.
  it('writes and reads a file within a run', () => {
    const r = T('with open("n.txt", "w") as f:\n    f.write("hi")\nprint(open("n.txt").read())')
    expect(r.error).toBeNull()
    expect(r.stdout).toBe('hi\n')
  })

  it('does not leak files between runs', () => {
    T('with open("leak.txt", "w") as f:\n    f.write("x")')
    const r = T('import os\nprint(os.path.exists("leak.txt"))')
    expect(r.stdout.trim()).toBe('False')
  })

  it('lets a check read a file the submission wrote', () => {
    const r = JSON.parse(
      runAsserts('with open("o.txt", "w") as f:\n    f.write("42")', 'assert open("o.txt").read() == "42"'),
    )
    expect(r.passed).toBe(true)
  })

  it('does not leak a file from a check into a later run', () => {
    const r = T('import os\nprint(os.path.exists("o.txt"))')
    expect(r.stdout.trim()).toBe('False')
  })
})

describe('caught vs fatal exceptions', () => {
  it('a caught exception traces and the run continues', () => {
    const r = T('try:\n    x = int("abc")\nexcept ValueError as e:\n    print("caught")\nprint("on")')
    expect(r.error).toBeNull() // caught — the run did NOT crash
    expect(r.steps.some((s: any) => s.event === 'exception')).toBe(true)
    expect(r.stdout).toBe('caught\non\n')
  })

  it('an uncaught exception sets error', () => {
    const r = T('x = int("abc")')
    expect(r.error).toMatchObject({ type: 'ValueError', line: 1 })
  })
})
