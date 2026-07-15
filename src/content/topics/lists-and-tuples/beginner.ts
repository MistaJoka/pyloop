import type { Level } from '../../types'

export const beginner: Level = {
  level: 1,
  blurb: 'Build it, index it — and the wall at the end of the list.',
  concept: {
    body: `A list is one name holding many values, in order.

\`\`\`python
scores = []
scores.append(90)
\`\`\`

\`append\` adds to the **end**. \`len(scores)\` says how many are in there. And you
reach in by **position**:

\`\`\`python
scores[0]    # the first
scores[-1]   # the last
\`\`\`

Positions start at **0**, so a 3-item list has positions 0, 1, 2 — and \`scores[3]\`
is one past the end. Python raises \`IndexError\` there.

That error isn't Python being difficult. It's Python saying *you asked for slot 3
and I only have three slots, ending at 2*. Read it that way and it stops being a
mystery.`,
    aiFraming: `Every dataset you ever load arrives as a list of something — rows,
tokens, image paths, predictions. Before you can vectorize anything, someone has
to build that list and reach into it.

\`-1\` in particular follows you forever. \`output[-1]\` is the last token a model
produced; \`layers[-1]\` is the output layer. In numpy it goes further —
\`arr[-1]\` is the last row, and \`arr.shape[-1]\` is the size of the last dimension,
which is the single most-typed piece of debugging in the field. Learn it here on
three scores and it's free later.`,
  },
  watch: {
    code: `scores = []
scores.append(90)
scores.append(85)
print(scores)
print(len(scores))
print(scores[0], scores[-1])`,
    notes: {
      2: `\`append\` sticks one item on the **end** of the list. It changes \`scores\` itself —
watch the variables panel grow.

The list has to exist first. That's what line 1 is for: \`[]\` is an empty list, ready to
be filled.`,
      6: `Two ways of pointing at a slot. \`scores[0]\` counts **forward** from the start —
0 is the first, not the second.

\`scores[-1]\` counts **backward** from the end, so it's always the last item however long
the list gets. You never have to work out \`len(scores) - 1\` yourself.`,
    },
  },
  predict: {
    code: `xs = [10, 20, 30]
print(xs[1], xs[-1], len(xs))`,
    question: 'What does this print?',
    choices: ['10 30 3', '20 30 3', '20 20 3', '10 20 30'],
    answerIndex: 1,
    explain: `\`20 30 3\`.

\`xs[1]\` is **20**, not 10 — counting starts at 0, so slot 1 is the *second*
item. This is the single most common off-by-one in the language and it never
fully stops catching people.

\`xs[-1]\` is **30**, the last item. \`len(xs)\` is **3**, the count — which is also
why \`xs[3]\` would raise \`IndexError\`: the count and the last position are never
the same number.`,
  },
  fix: {
    task: `This should print the last score — \`78\` — but it crashes with \`IndexError\`.
Fix it.`,
    brokenCode: `scores = [90, 85, 78]
print(scores[len(scores)])`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
assert scores == [90, 85, 78], f"scores came out as {scores!r} — the list itself shouldn't change, only the way you reach into it."
assert any(isinstance(n, ast.Subscript) for n in ast.walk(tree)), "It prints 78, but nothing in there reaches into the list — a hand-typed 78 would still say 78 after the scores change. Can you ask scores for its last item instead?"
assert __stdout__.strip() == "78", f"It should print the last score, 78, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      '`len(scores)` is 3. But the three items live at positions 0, 1 and 2 — so position 3 is one past the end. That is exactly what `IndexError` is telling you.',
      "You could ask for `scores[len(scores) - 1]`, and it would work. There's a shorter way that never mentions `len` at all.",
      '`print(scores[-1])` — negative positions count back from the end, so `-1` is the last item no matter how long the list is.',
    ],
    solution: `scores = [90, 85, 78]
print(scores[-1])`,
  },
  stretch: {
    title: 'Why there is no scores[-0]',
    body: `Both of these get the last item:

\`\`\`python
xs[len(xs) - 1]
xs[-1]
\`\`\`

The second one is shorter, and it can't go wrong when the list changes length.

But notice the asymmetry: the **front** is \`0\` and the **back** is \`-1\`. Not
\`-0\`. There's no negative zero in Python — \`-0\` is just \`0\`, which is the
*first* item. So the two ends aren't mirror images, and \`xs[-0]\` is a silent
trap: it runs, it returns something, and it's the wrong end.

Run it and watch \`xs[-0]\` quietly hand back \`10\`.`,
    code: `xs = [10, 20, 30]
print(xs[-1], xs[len(xs) - 1])
print(xs[-0])`,
  },
}
