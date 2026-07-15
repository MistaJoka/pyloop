import type { Level } from '../../types'

export const master: Level = {
  level: 5,
  blurb: 'Float imprecision, fixed-width numbers, and why numpy makes you name a dtype.',
  concept: {
    body: `\`0.1 + 0.2\` is not \`0.3\`. It's \`0.30000000000000004\`, and that isn't a
bug in Python.

A \`float\` is stored in **binary**, in a fixed 64 bits. One tenth has no exact
binary form — same way one third has no exact decimal form, 0.3333… never
finishes. So \`0.1\` is stored as the nearest available value, and the tiny error
survives the addition.

The consequence you have to internalise:

\`\`\`python
0.1 + 0.2 == 0.3          # False
abs((0.1 + 0.2) - 0.3) < 1e-9   # True — ask "close enough?"
\`\`\`

**Never test floats with \`==\`.** Ask whether the gap is small enough.

Python's \`int\` is the odd one out here: it has no size limit at all, growing as
big as your memory allows. That's a luxury, and it's one you lose the moment you
leave pure Python.`,
    aiFraming: `Python hides types from you. Numpy hands them back, on purpose.

\`np.array([1, 2, 3])\` isn't a list of Python ints — it's 3 slots of \`int64\`,
each exactly 64 bits, laid out end to end. Fixed width is what makes the array
fast (the CPU can stride straight through it) and it's what makes \`dtype\` your
problem:

- \`int8\` holds up to 127. Add 1 and it **wraps to -128**. No error.
- \`float32\` is the default in most deep learning — half the memory of
  \`float64\`, twice the throughput, roughly 7 decimal digits of precision. Your
  model weights are trained in it, and increasingly in \`float16\` or \`bfloat16\`,
  where you've got about **3 digits**.

That's why quantisation works at all, and why "our loss went NaN" is so often a
dtype story rather than a maths story. The float error you just met at the 17th
decimal place is the same error, at digit 4, deciding whether your training run
converges.`,
  },
  watch: {
    code: `x = 0.1 + 0.2
print(x)
print(x == 0.3)
print(abs(x - 0.3) < 1e-9)
big = 2 ** 70
print(big)`,
    notes: {
      1: `Nothing exotic on this line — but look at what \`x\` becomes in the variables panel.
Not \`0.3\`.

\`0.1\` can't be written exactly in binary, so what's stored is the nearest 64-bit value to
it. Add two nearest-values and the error is still there, now visible.`,
      4: `The fix, and it's the whole point of the level. Don't ask *are these identical* —
ask *is the gap small enough to not care*.

\`1e-9\` is scientific notation for 0.000000001, the tolerance. Anything closer than that
counts as the same number.`,
      5: `\`**\` is "to the power of", so this is 2 to the 70th — vastly bigger than 64 bits
can hold. Python doesn't blink; its \`int\` just grows.

Hold that thought. Numpy's \`int64\` would overflow here, and the reason it isn't a
free lunch is the next screen.`,
    },
  },
  predict: {
    code: `total = 0.0
for _ in range(10):
    total = total + 0.1
print(total == 1.0)`,
    question: 'What does this print?',
    choices: ['True', 'False', '1.0', '0.9999999999999999'],
    answerIndex: 1,
    explain: `\`False\`. Adding a tenth ten times does not give you one — you get
\`0.9999999999999999\`.

Each \`+ 0.1\` adds a value that was already slightly off, and the errors
**accumulate**. Ten additions, ten small wrongnesses, and the result misses.

This is the version that actually turns up in real code: not the cute
\`0.1 + 0.2\` demo, but a total built in a loop that then fails an \`==\` check for
no visible reason. Money is the classic casualty — which is why financial code
uses \`Decimal\` or counts whole pennies as \`int\`, and never floats.`,
  },
  fix: {
    task: `\`a\` and \`b\` are the same amount to any precision that matters, so this should
print \`True\`. It prints \`False\`. Fix the **comparison** — leave the values alone.`,
    brokenCode: `a = 0.1 + 0.2
b = 0.3
print(a == b)`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
assert a == 0.1 + 0.2, f"a is {a!r} now. The arithmetic isn't the bug — 0.1 + 0.2 genuinely is what it is, and rounding it away hides the thing you're meant to be handling. What could change instead is the question you ask about a and b?"
assert b == 0.3, f"b is {b!r} now. The values aren't the problem; leave them as they were."
names = {n.id for n in ast.walk(tree) if isinstance(n, ast.Name)}
assert 'a' in names and 'b' in names, "Are a and b both still part of what gets printed, or did the answer get written in by hand?"
assert not any(isinstance(n, ast.Constant) and n.value is True for n in ast.walk(tree)), "Printing True isn't asking a question — it's just asserting one. What comparison between a and b should come out True?"
assert __stdout__.strip() == "True", f"It should print True, but it printed {__stdout__.strip()!r}. What does == mean for two floats that are close but not bit-identical?"`,
    },
    hints: [
      '`a` and `b` really are different numbers — `a` is 0.30000000000000004. `==` is answering correctly. The question is wrong, not the answer.',
      'Instead of "are these identical?", ask "how far apart are they?" and compare that gap to a tiny tolerance like `1e-9`.',
      '`print(abs(a - b) < 1e-9)` — the size of the difference, tested against a tolerance. (`math.isclose(a, b)` is the built-in version.)',
    ],
    solution: `a = 0.1 + 0.2
b = 0.3
print(abs(a - b) < 1e-9)`,
  },
  stretch: {
    title: 'The whole ladder, in one line of numpy',
    body: `Two tidier ways to say what you just wrote:

\`\`\`python
import math
math.isclose(0.1 + 0.2, 0.3)   # True — the built-in, use this
round(0.1 + 0.2, 2) == 0.3     # True — but only if you know the precision you want
\`\`\`

And then the reason this topic exists:

\`\`\`python
import numpy as np
np.array([1, 2, 3])              # dtype int64  — 8 bytes each, fixed
np.array([1, 2, 3], dtype=np.int8)   # 1 byte each. Max 127. Add 1 -> -128.
np.float32(0.1) + np.float32(0.2)    # off at digit 8, not digit 17
\`\`\`

Look at what you've climbed. Level 1: a name holds a value. Level 5: a name
holds a reference to 8 bytes of memory interpreted as a signed integer, and if
you pick 1 byte instead of 8 your data wraps around to negative without a word
of warning.

It's the same idea the whole way up. Python let you ignore the type; numpy
makes you name it, because at scale the type **is** the performance, the
memory, and the correctness. That's what Master means here — not that you've
memorised the float rules, but that you know why a library would bother making
you declare \`dtype\` at all.`,
    code: `import math
print(math.isclose(0.1 + 0.2, 0.3))
print(round(0.1 + 0.2, 2) == 0.3)`,
  },
}
