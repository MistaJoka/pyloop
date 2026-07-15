import type { Level } from '../../types'

export const master: Level = {
  level: 5,
  blurb: 'divmod, // as the operator that keeps an index legal, and + meaning two things at once.',
  concept: {
    body: `\`//\` and \`%\` are two halves of one division, and Python will do both at once:

\`\`\`python
divmod(17, 5)     # (3, 2)  — the whole part and the leftover
17 // 5, 17 % 5   # (3, 2)  — the same thing, twice the work
\`\`\`

Now the reason \`//\` earns its own operator instead of being \`int(a / b)\`:

\`\`\`python
items = [10, 20, 30, 40]
items[len(items) / 2]     # TypeError — 2.0 is not an index
items[len(items) // 2]    # 30        — 2 is
\`\`\`

An index has to be an \`int\`. Not "a number that happens to be whole" — an
\`int\`. \`len(items) / 2\` is \`2.0\`, and \`2.0\` cannot index a list, ever, no matter
how round it looks.

So \`//\` isn't a rounding convenience. It's the operator that keeps the **type**
right, which is what makes midpoints, chunking and pagination work at all.`,
    aiFraming: `Here's the thread, all the way out.

\`+\` on two Python lists concatenates: \`[1,2] + [3,4]\` is \`[1,2,3,4]\`. \`+\` on two
numpy arrays adds **elementwise**: \`np.array([1,2]) + np.array([3,4])\` is
\`array([4,6])\`. Same symbol. Same-looking data. Opposite meanings, chosen by the
type underneath.

That's not numpy being clever for its own sake — elementwise-by-default is the
entire reason you can write \`(x - mean) / std\` over a million rows and have it
run at C speed. It's also why \`list(x) + list(y)\` in the wrong place silently
doubles your dataset instead of summing it, and why mixing a list and an array
gives a *third* behaviour again.

You cannot read an expression and know what it does. You have to know the types.
That was true at \`6 / 3\` on the first screen, and it's the same fact at the top:
the operator is the request; the type is the answer.`,
  },
  watch: {
    code: `print(divmod(17, 5))
print(17 // 5, 17 % 5)
items = [10, 20, 30, 40]
mid = len(items) // 2
print(mid)
print(items[mid])
print(len(items) / 2)`,
    notes: {
      1: `\`divmod(a, b)\` hands back **both** results of one division at once: \`(a // b, a % b)\`.

The brackets in the output mean it's a tuple — two values travelling together.`,
      4: `\`//\` here isn't about rounding. It's about **type**: \`len(items)\` is an int, \`// 2\`
keeps it an int, and only an int can go inside \`[]\`.

Swap it for \`/\` and line 6 dies.`,
      7: `Proof. Same numbers, \`/\` instead of \`//\`, and out comes \`2.0\` — a float.

\`items[2.0]\` would raise TypeError. Not because 2.0 is the wrong *value*, but because it's
the wrong *type*.`,
    },
  },
  predict: {
    code: `items = [10, 20, 30, 40]
half = len(items) / 2
print(half, type(half).__name__)`,
    question: 'What does this print?',
    choices: ['2.0 float', '2 int', '2.0 int', '2 float'],
    answerIndex: 0,
    explain: `\`2.0 float\`. \`len(items)\` is \`4\`, an int. \`2\` is an int. And \`/\` hands
back a float anyway — because that is all \`/\` has ever done.

The value is right. The type isn't, and \`items[half]\` would raise
\`TypeError: list indices must be integers or slices, not float\`.

This is the Beginner level's \`6 / 3\` → \`2.0\`, four rungs later, now actually
costing you something. The operator was a request. The type answered. Nothing in
between checked whether you meant it.`,
  },
  fix: {
    task: `137 seconds is 2 minutes and 17 seconds, so this should print \`2 17\`. It
prints \`2.2833333333333332 17\`. The seconds half is already right — fix the
minutes.`,
    brokenCode: `total = 137
minutes = total / 60
seconds = total % 60
print(minutes, seconds)`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
names = {n.id for n in ast.walk(tree) if isinstance(n, ast.Name)}
assert 'total' in names, "Is total still doing the work? The answer should come out of the arithmetic, not be typed in."
assert total == 137, f"total is {total!r} now. 137 was never the problem."
assert seconds == 17, f"seconds came out as {seconds!r}, expected 17. % was already doing its half of the job correctly — it didn't need touching."
assert minutes == 2, f"minutes came out as {minutes!r}. 137 seconds is 2 whole minutes and a bit; which division keeps only the whole part and drops the bit?"
assert isinstance(minutes, int), f"minutes is a {type(minutes).__name__} holding {minutes!r}. Right value, wrong type — 2.0 is still a float. Is there a division that hands back an int directly, without rounding afterwards?"
assert __stdout__.strip() == "2 17", f"It should print 2 17, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      'Look at the two lines side by side. `%` gave you the leftover seconds perfectly. Its partner on line 2 is the one being asked the wrong question.',
      '`/` keeps the fraction and hands back a float. You want the whole minutes only, still as an `int`.',
      '`minutes = total // 60` fixes it. Better: `minutes, seconds = divmod(total, 60)` replaces both lines — one division, both answers.',
    ],
    solution: `total = 137
minutes, seconds = divmod(total, 60)
print(minutes, seconds)`,
  },
  stretch: {
    title: 'One symbol, two meanings',
    body: `Run this and watch \`+\` concatenate:

\`\`\`python
a = [1, 2, 3]
b = [10, 20, 30]
a + b        # [1, 2, 3, 10, 20, 30]
\`\`\`

Now the same expression, one import later:

\`\`\`python
import numpy as np
a = np.array([1, 2, 3])
b = np.array([10, 20, 30])
a + b        # array([11, 22, 33])   — elementwise
a * 2        # array([2, 4, 6])      — NOT [1,2,3,1,2,3]
a * b        # array([10, 40, 90])   — elementwise again
\`\`\`

Every symbol is the same. Every result is different. Nothing in the expression
tells you which you're getting — only \`type(a)\` does.

That's what the whole ladder was for. \`6 / 3\` giving \`2.0\` was the first, tiny,
harmless instance of a rule that never stops applying: **you cannot read an
operator and know what it does.** You have to know what's underneath it.

The version of this that costs you a week: \`a * b\` on two numpy arrays is
elementwise, but on two *matrices* you probably wanted \`a @ b\`. Both run. Both
give you an array of numbers. Only one is matrix multiplication.`,
    code: `a = [1, 2, 3]
b = [10, 20, 30]
print(a + b)
print(a * 2)`,
  },
}
