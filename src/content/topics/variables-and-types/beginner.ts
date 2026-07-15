import type { Level } from '../../types'

export const beginner: Level = {
  level: 1,
  blurb: 'A name for a value — and why = does not mean equals.',
  concept: {
    body: `A variable is a **name** you hang on a value so you can use it later.

\`\`\`python
score = 10
score = score + 5
\`\`\`

That second line looks like a lie in maths. It isn't, because \`=\` doesn't mean
"is equal to". It means **store this**.

Read every \`=\` right to left:

1. work out the right side (\`score + 5\` → \`15\`)
2. store the answer in the name on the left

So \`score\` is 15. The old 10 is gone — a name holds one value at a time, and
assigning again replaces it. Nothing is remembered unless you store it.`,
    aiFraming: `Sounds too basic to matter. It's the bug you'll actually ship.

\`df.dropna()\` hands you a cleaned dataframe — it doesn't clean the one you had.
Write \`df.dropna()\` on a line by itself and you get no error, no warning, and a
dataframe with the nulls still in it, feeding your model. Same with
\`sorted(x)\`, \`x.strip()\`, most of numpy.

The rule that saves you is this one: if the result isn't stored, it didn't
happen.`,
  },
  watch: {
    code: `score = 10
print(score)
score = score + 5
print(score)
score = "done"
print(score)`,
    notes: {
      3: `Right side first: \`score + 5\` is worked out using the *current* score (10), giving
15. **Then** \`=\` stores 15 back under the name \`score\`.

That's why \`score\` can appear on both sides without contradiction. The two sides happen at
different moments.`,
      5: `The same name, now holding a string. Python lets you do this — the name isn't glued
to a kind of value, it just points at whatever you last stored.

Watch the variables panel: \`score\` stops being a number here.`,
    },
  },
  predict: {
    code: `x = 2
y = x
x = 10
print(y)`,
    question: 'What does this print?',
    choices: ['2', '10', '12', '20'],
    answerIndex: 0,
    explain: `\`2\`. Line 2 copies the **value** \`x\` had at that moment into \`y\`. It
does not tie \`y\` to \`x\` forever.

So when line 3 restores \`x\` to 10, \`y\` doesn't care — it's been holding 2 since
line 2 and nothing has touched it since.

An \`=\` is a one-time event, not a rule that keeps holding. (Level 4 is where
that intuition bites back — hold onto this one.)`,
  },
  fix: {
    task: `This should add 15 to the total and print \`25\`. It prints \`10\`. Fix it.`,
    brokenCode: `total = 10
total + 15
print(total)`,
    check: {
      kind: 'asserts',
      code: `assert 'total' in dir(), "There's no variable called total anymore — keep it."
assert total == 25, f"total came out as {total}, expected 25. Line 2 works out 10 + 15 just fine — so where does that 15 go afterwards?"
assert __stdout__.strip() == "25", f"It should print 25, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      "Line 2 isn't broken — Python really does work out `10 + 15`. It just throws the answer away the instant it has it.",
      'A value only sticks around if you store it under a name. What does storing look like?',
      '`total = total + 15` — work out the right side, then `=` puts the answer back into `total`. (`total += 15` is the shorthand for exactly this.)',
    ],
    solution: `total = 10
total = total + 15
print(total)`,
  },
  stretch: {
    title: 'So how do you ask "is it equal"?',
    body: `\`=\` stores. \`==\` **asks**.

\`\`\`python
score = 10       # store 10 in score
score == 10      # is score 10?  ->  True
\`\`\`

One is a command, the other is a question. Mixing them up is the single most
common first-month error, and Python is unusually kind about it: writing \`=\`
where you meant \`==\` is a **SyntaxError**, so it fails loudly instead of quietly
doing the wrong thing.

Also worth having now: \`total += 15\` is just shorthand for
\`total = total + 15\`. Same thing, less typing. \`-=\`, \`*=\` and \`/=\` all work
the same way.`,
    code: `score = 10
print(score == 10)
score += 15
print(score)`,
  },
}
