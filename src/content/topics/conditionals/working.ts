import type { Level } from '../../types'

export const working: Level = {
  level: 2,
  blurb: 'else and elif — exactly one branch wins, and order decides which.',
  concept: {
    body: `One \`if\` gives you a gate. A chain gives you a **choice**.

\`\`\`python
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
else:
    grade = "C"
\`\`\`

Python goes down the chain and stops at the **first** true test. Exactly one
branch runs — never two, never zero (if there's an \`else\`).

That "first" is the whole level. An \`elif\` is only ever asked because everything
above it was false. So a test that's too broad, sitting too high, **swallows**
the ones below it:

\`\`\`python
if score >= 50:      # 95 stops here
    label = "pass"
elif score >= 90:    # never asked. ever.
    label = "top"
\`\`\`

Nothing crashes. You just quietly never get \`"top"\`. **Narrowest test first.**`,
    aiFraming: `A dead branch is the bug that survives code review, because there's
nothing to see: no error, no warning, just an outcome that never happens.

This is the same failure mode as a rule that never fires in a pipeline, or a
label no example ever gets assigned. The way you catch it isn't reading harder —
it's asking "which inputs land in each branch?" and finding one where the
answer is *none*. Coverage thinking, on four lines instead of four thousand.`,
  },
  watch: {
    code: `score = 85
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
else:
    grade = "C"
print(grade)`,
    notes: {
      4: `An \`elif\` is asked **only because line 2 was false**. That's the rule the whole
level turns on — it isn't a fresh question, it's "and if that wasn't it, how about this?"

Step through it and watch line 3 get skipped without a word.`,
      8: `Outside the chain, so it runs no matter which branch won. \`grade\` exists here
because exactly one of the three branches set it — that's what \`else\` guarantees.`,
    },
  },
  predict: {
    code: `n = 95
if n > 50:
    label = "big"
elif n > 90:
    label = "huge"
print(label)`,
    question: 'What does this print?',
    choices: ['huge', 'big', 'big huge', '95'],
    answerIndex: 1,
    explain: `\`big\`. \`95 > 50\` is true, so Python stops right there — the \`elif\` is
**never asked**.

Both tests are true for 95. That doesn't matter; only the first one gets to run.
Which means \`"huge"\` is unreachable for *every* number, not just this one. Any
\`n\` big enough to be huge is already big enough to be big.

Swap the two tests and it prints \`huge\`. Same code, same values, different order.`,
  },
  fix: {
    task: `\`101\` is clearly hot, but this prints \`warm\`. All three outcomes are
correct — the chain just can't reach one of them. Fix it so it prints \`hot\`.`,
    brokenCode: `temp = 101
if temp > 97:
    status = "warm"
elif temp > 100:
    status = "hot"
else:
    status = "cold"
print(status)`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
ifs = [n for n in ast.walk(tree) if isinstance(n, ast.If)]
assert len(ifs) >= 2, "The chain collapsed. Keep all three outcomes — warm, hot and cold — and just ask them in an order that can actually reach hot."
assert status == "hot", f"status came out as {status!r}. 101 is over 100, so which test got asked first — and did the other one ever get a turn?"
assert __stdout__.strip() == "hot", f"It should print hot, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      'Nothing here is wrong on its own. `temp > 97` is true for 101 — and being true is enough to end the chain.',
      'Ask yourself which temperatures could ever reach the `hot` branch. Anything over 100 is also over 97, so it gets caught one line earlier. The branch is dead.',
      'Test for `> 100` **first**, then `> 97`. Narrowest test at the top, broadest at the bottom — the `else` is the broadest of all.',
    ],
    solution: `temp = 101
if temp > 100:
    status = "hot"
elif temp > 97:
    status = "warm"
else:
    status = "cold"
print(status)`,
  },
  stretch: {
    title: 'Why the order rule works',
    body: `Picture each branch as a net across a stream, and the values flowing down.
The first net catches everything it can. The second net only ever sees what got
through the first one.

So an \`elif\` doesn't really mean \`temp > 97\`. It means:

\`\`\`text
temp > 97   AND NOT (temp > 100)
\`\`\`

The conditions above it are silently part of every condition below it. That's
why \`> 100\` under \`> 97\` is impossible — you'd be asking for a number that is
over 100 and not over 100.

Reading a chain as "each test also carries every test above it, negated" turns
dead branches from something you spot by luck into something you spot by
reading.`,
  },
}
