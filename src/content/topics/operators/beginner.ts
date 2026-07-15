import type { Level } from '../../types'

export const beginner: Level = {
  level: 1,
  blurb: 'Arithmetic, and the two divisions — / always gives a float, // throws the remainder away.',
  concept: {
    body: `The arithmetic is the boring part: \`+\`, \`-\`, \`*\` do what you expect.

Division is where Python differs from the maths you were taught. There are
**two** of them:

\`\`\`python
7 / 2      # 3.5   — true division, always a float
7 // 2     # 3     — floor division, the whole part only
\`\`\`

The trap isn't \`7 / 2\`. It's this:

\`\`\`python
6 / 3      # 2.0   — NOT 2
\`\`\`

\`/\` gives you a **float every single time**, even when it divides evenly, even
when both sides are ints. It isn't rounding — it's a type change hiding inside
an operator.

\`//\` is the one that stays an int. Reach for it when the answer is a count of
whole things.`,
    aiFraming: `Here's the idea the whole topic is built on: **an operator is a
request, and the type decides what actually happens.**

You write \`/\`. Python looks at what's on either side and picks the machinery.
Two ints in, a float out — you never asked for that, and nothing warned you.

At \`6 / 3\` that's a curiosity. Later it's \`x[n / 2]\` refusing to run, or a
\`float64\` quietly creeping into a \`float32\` model and doubling your memory, or
an integer count arriving at a library as \`2.0\`. Same mechanism every time. The
operator was a request; the types answered it.`,
  },
  watch: {
    code: `a = 7
b = 2
print(a + b)
print(a * b)
print(a / b)
print(a // b)
print(6 / 3)`,
    notes: {
      5: `\`/\` is **true division**. It keeps the fraction, so 7 / 2 is 3.5.

Note the type it hands back: a float. It will do that no matter what you divide.`,
      6: `\`//\` is **floor division** — divide, then drop everything after the decimal
point. 3.5 becomes 3.

Not rounding: it always goes **down**, never to the nearest.`,
      7: `The one to remember. 6 divides into 3 exactly, both numbers are ints, and \`/\`
*still* hands back \`2.0\`.

There's no rule about "when it divides evenly". \`/\` gives a float. Always.`,
    },
  },
  predict: {
    code: `print(6 / 3, 6 // 3)`,
    question: 'What does this print?',
    choices: ['2.0 2', '2 2', '2 2.0', '2.0 2.0'],
    answerIndex: 0,
    explain: `\`2.0 2\`. Two ints went in and \`/\` handed back a float anyway.

This is the bit people get wrong, because "6 divided by 3 is 2" is obviously
true — and it is, the *value* is right. What changed is the **type**. Python
doesn't check whether the division came out even; \`/\` just means float division,
full stop.

\`//\` is the one that keeps ints as ints. So if the answer is a count — boxes,
pages, rows — \`//\` is what you meant.`,
  },
  fix: {
    task: `7 items, 2 per box. This should print how many **full boxes** you get — \`3\`.
It prints \`3.5\`. Fix it.`,
    brokenCode: `total_items = 7
per_box = 2
boxes = total_items / per_box
print(boxes)`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
names = {n.id for n in ast.walk(tree) if isinstance(n, ast.Name)}
assert 'total_items' in names and 'per_box' in names, "Are total_items and per_box still doing the work, or did the answer get typed in by hand? The numbers should still come from the division."
assert boxes == 3, f"boxes came out as {boxes!r}. There's no such thing as half a box — which of the two divisions throws the leftover away instead of turning it into a decimal?"
assert isinstance(boxes, int), f"boxes is a {type(boxes).__name__} holding {boxes!r}. Right number, wrong type — 3.0 is still a float. Is there a division that hands back an int in the first place?"
assert __stdout__.strip() == "3", f"It should print 3, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      "`3.5` is a perfectly correct answer to the question `/` was asked. It's just not the question you meant to ask — you wanted whole boxes.",
      'There are two division operators. One keeps the fraction; one drops it and stays an int. You want the second.',
      '`boxes = total_items // per_box` — floor division. 7 // 2 is 3, and it comes back as an `int`, not `3.0`.',
    ],
    solution: `total_items = 7
per_box = 2
boxes = total_items // per_box
print(boxes)`,
  },
  stretch: {
    title: '// floors — which is not the same as chopping',
    body: `"Drop the decimal part" is a close enough story until a negative number
turns up:

\`\`\`python
7 // 2      #  3
-7 // 2     # -4   — not -3
\`\`\`

\`//\` **floors**: it goes to the next whole number *downward on the number
line*, always. For positives, down and "chop off the decimals" are the same
direction, so you never notice. For negatives they point opposite ways, and
\`-3.5\` floors to \`-4\`.

If you genuinely want "chop toward zero", that's \`int(-7 / 2)\` → \`-3\`. Two
different operations that agree on every positive number you'll ever test with,
which is exactly why this one hides.`,
    code: `print(7 // 2)
print(-7 // 2)
print(int(-7 / 2))`,
  },
}
