import type { Level } from '../../types'

export const advanced: Level = {
  level: 4,
  blurb: 'A loop inside a loop — where most people fall over.',
  concept: {
    body: `When your items are themselves collections, one loop isn't enough.

\`\`\`python
for group in groups:      # each group is a list
    for n in group:       # each n is a number
        total = total + n
\`\`\`

The outer loop runs once per group. For **each** of those passes, the inner loop
runs all the way through that group. Two groups of two items = four visits to
the inner body.

The trap: \`group\` is a *list*, not a number. Try to add it to \`total\` and
Python stops you. That error is the signal you're one level too shallow.

Watch the trace on this one. Seeing the inner loop finish and the outer loop
tick over once is worth more than any explanation of it.`,
    aiFraming: `Nested loops over rows and columns are a 2D array — an image, a
spreadsheet, a batch of samples. Every one of them is this shape.

And this is exactly where hand-written loops stop being viable. A 1000×1000
image is a million inner-loop passes in Python. \`arr.sum()\` on the same data is
one call into compiled code. The nested loop is how you *understand* the array;
it is not how you'd ever process one.`,
  },
  watch: {
    code: `groups = [[1, 2], [3, 4]]
total = 0
for group in groups:
    for n in group:
        total = total + n
print(total)`,
    notes: {
      1: `A list whose items are themselves lists. \`groups[0]\` isn't a number — it's
\`[1, 2]\`. That's the fact the whole level turns on.`,
      3: `The **outer** loop. Each \`group\` it hands you is a *list*, not a number — check
the variables panel and you'll see \`group = [1, 2]\`.

Try to add that to \`total\` and Python stops you. That error means you're one level too
shallow.`,
      4: `The **inner** loop, and where the numbers finally appear. It runs all the way
through for every single pass of the outer loop.

Step through it: the inner loop finishes completely, *then* the outer one ticks over once.`,
    },
  },
  predict: {
    code: `count = 0
for i in [1, 2, 3]:
    for j in ["a", "b"]:
        count = count + 1
print(count)`,
    question: 'What does this print?',
    choices: ['5', '6', '3', '2'],
    answerIndex: 1,
    explain: `\`6\`. Not 5.

The inner loop runs **completely** for every single pass of the outer one:
3 outer passes × 2 inner passes = 6 visits to \`count = count + 1\`.

Nested loops multiply, they don't add. That's why a nested loop over a big list
gets expensive so fast — 1,000 items in each loop is a million passes.`,
  },
  fix: {
    task: `Each cart is a list of item prices. This should total everything across all
carts — \`29\` — but it crashes. Fix it.`,
    brokenCode: `carts = [[5, 5], [10], [2, 3, 4]]
total = 0
for cart in carts:
    total = total + cart
print(total)`,
    check: {
      kind: 'asserts',
      code: `assert total == 29, f"total came out as {total}, expected 29 (5+5+10+2+3+4)."
assert __stdout__.strip() == "29", f"It should print 29, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      "Read the error. `cart` isn't a number — it's a list, like `[5, 5]`. Python won't add a list to a number.",
      'You need to go one level deeper: for each cart, walk the items *inside* it.',
      'Put a second `for` inside the first: `for cart in carts:` then `    for item in cart:` then `        total = total + item`.',
    ],
    solution: `carts = [[5, 5], [10], [2, 3, 4]]
total = 0
for cart in carts:
    for item in cart:
        total = total + item
print(total)`,
  },
  stretch: {
    title: 'Flatten, then sum',
    body: `Python can nest the loops inside a comprehension too:

\`\`\`python
total = sum(item for cart in carts for item in cart)
\`\`\`

The two \`for\`s read in the same order you'd write them nested — outer first,
inner second. That ordering trips up almost everyone the first time, because it
looks like it should be backwards.

If it doesn't read naturally to you yet, use the nested version. A loop you can
read beats a one-liner you can't.`,
    code: `carts = [[5, 5], [10], [2, 3, 4]]
print(sum(item for cart in carts for item in cart))`,
  },
}
