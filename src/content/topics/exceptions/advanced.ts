import type { Level } from '../../types'

export const advanced: Level = {
  level: 4,
  blurb: 'else, finally, and how wide to make the try.',
  concept: {
    body: `Two more clauses, both about keeping the \`try\` honest:

\`\`\`python
try:
    f = open("data.csv")
except FileNotFoundError:
    print("no file")
else:
    print("opened fine")    # only if the try raised NOTHING
finally:
    print("done looking")   # always. crash or no crash.
\`\`\`

**\`else\`** is the rest of the happy path, deliberately kept *outside* the
\`try\` — so it isn't accidentally protected.

**\`finally\`** runs no matter what: success, caught error, uncaught error, even a
\`return\`. It's for cleanup that has to happen either way.

And the thing they're both really teaching:

**A \`try\` protects everything inside it, and nothing else.** So a wide \`try\` is
a blunt \`try\` — it catches errors you never meant to catch, from lines you never
thought were risky. Wrap the *line* that can fail, not the whole paragraph.`,
    aiFraming: `Here's the shape you'll write more than any other:

\`\`\`python
for row in rows:
    try:
        clean.append(parse(row))
    except ValueError:
        bad = bad + 1
\`\`\`

Loop, try each one, count the failures, keep going. That's data cleaning. That's
the loader in front of every model you'll ever train.

**The count is not bookkeeping — it's the output.** 3 bad rows out of 1000 is a
cleaning job you finish and forget. 700 bad rows out of 1000 is a broken export,
or the wrong file, or a schema that changed under you last Tuesday. The code is
*identical* in both cases and finishes happily in both cases. The only thing that
tells you which world you're in is the number you counted.

Drop the count and you've built a machine that turns catastrophes into small,
clean, plausible datasets.`,
  },
  watch: {
    code: `raw = ["10", "abc", "30"]
good = []
bad = 0
for r in raw:
    try:
        n = int(r)
    except ValueError:
        bad = bad + 1
    else:
        good.append(n)
print(good, "kept,", bad, "rejected")`,
    notes: {
      6: `The only risky line, and the only line in the \`try\`. That's the discipline.

Watch it three times: fine, **raised here — caught below**, fine. The loop never
notices.`,
      8: `Runs once, on \`"abc"\` only. \`bad\` goes 0 → 1 and the pass ends there —
\`good.append\` is skipped for this one item, not for the rest of the loop.`,
      10: `This is the \`else\` body: it runs **only** when the \`try\` raised nothing.

Why not just put it in the \`try\`? Because \`good.append(n)\` can fail too, and if it
ever did, that \`except ValueError\` would catch it and quietly count it as a bad row —
a bug in your storage misfiled as bad data. Out here it's unprotected, which is exactly
what you want: only \`int(r)\` was ever supposed to be forgiven.`,
    },
  },
  predict: {
    code: `def load(text):
    try:
        return int(text)
    except ValueError:
        return -1
    finally:
        note.append(text)

note = []
print(load("5"), load("x"), note)`,
    question: 'What does this print?',
    choices: ["5 -1 ['5', 'x']", '5 -1 []', "5 -1 ['5']", "5 -1 ['x']"],
    answerIndex: 0,
    explain: `\`5 -1 ['5', 'x']\`.

The surprise is that \`finally\` runs **after a \`return\`**. Line 3 says "return
now" — and Python still will not leave that function without running the
\`finally\` first. Same on the error path: line 5 returns \`-1\`, and \`finally\`
still fires.

There is genuinely no way out of a \`try\` that skips its \`finally\`. Not
\`return\`, not an exception, not a caught one, not \`break\`. That's the entire
guarantee, and it's why \`finally\` is where you close files and release things —
the one place you can be sure runs.

So both calls appended, in call order: \`['5', 'x']\`.`,
  },
  fix: {
    task: `Out of \`["10", "n/a", "30"]\` this should keep \`[10, 30]\` and count \`1\`
rejection — it should print \`[10, 30] 1\`.

It prints \`[10] 1\`. The \`30\` is real, readable, and missing: the first bad row
took the rest of the loop down with it. The \`try\` is in the wrong place.`,
    brokenCode: `rows = ["10", "n/a", "30"]
kept = []
bad = 0
try:
    for r in rows:
        kept.append(int(r))
except ValueError:
    bad = bad + 1
print(kept, bad)`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
tries = [n for n in ast.walk(tree) if isinstance(n, ast.Try)]
assert tries, "The try/except is gone — 'n/a' is still unreadable and still has to be survivable."
assert not any(isinstance(a, ast.For) for t in tries for a in ast.walk(t)), "The whole for loop is still inside the try, so the first bad row still ends the loop. Which one should be inside the other?"
assert kept == [10, 30], f"kept came out as {kept}, expected [10, 30]. If 30 is missing, the loop stopped at 'n/a' instead of stepping over it — 30 was never even looked at."
assert bad == 1, f"bad came out as {bad}, expected 1 — exactly one row of the three is unreadable."
assert __stdout__.strip() == "[10, 30] 1", f"It should print '[10, 30] 1', but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      'Follow `"n/a"` by hand. It raises on line 6, inside the loop — and the `except` that catches it is on line 7, *outside* the loop. Once Python has jumped out there, is there any way back into the loop?',
      "A `try` protects what's inside it, and right now what's inside it is the entire loop. So the first failure doesn't cost you one row — it costs you every row after it too. You want the `try` protecting **one pass**, not all of them.",
      'Turn it inside out: `for` on the outside, `try`/`except` within, wrapped around just `kept.append(int(r))`. Each row gets its own attempt, and a bad one costs you only itself.',
    ],
    solution: `rows = ["10", "n/a", "30"]
kept = []
bad = 0
for r in rows:
    try:
        kept.append(int(r))
    except ValueError:
        bad = bad + 1
print(kept, bad)`,
  },
  stretch: {
    title: 'You already used finally without writing it',
    body: `From the files topic:

\`\`\`python
with open("data.csv") as f:
    rows = f.readlines()
\`\`\`

\`with\` is a \`finally\` you don't have to write. It's the same guarantee — the
file gets closed on the way out whatever happens, including when \`readlines()\`
raises halfway through — with the bookkeeping moved into the object itself.

Longhand, that block is:

\`\`\`python
f = open("data.csv")
try:
    rows = f.readlines()
finally:
    f.close()
\`\`\`

Same behaviour, five lines, and one of them is easy to forget on the day it
matters. That's why \`with\` exists and why it's the version you should reach for.

The pattern to carry away: when cleanup **must** happen, don't rely on reaching
the line that does it. Put it somewhere that runs whether you get there or not.`,
    code: `with open("notes.txt", "w") as f:
    f.write("closed on the way out, no matter what\\n")
with open("notes.txt") as f:
    print(f.read().strip())`,
  },
}
