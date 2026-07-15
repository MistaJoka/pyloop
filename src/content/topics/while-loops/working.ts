import type { Level } from '../../types'

export const working: Level = {
  level: 2,
  blurb: 'Off-by-one, runaways, and knowing when for is the better tool.',
  concept: {
    body: `Two bugs live in every \`while\` loop. Learn to spot both by eye.

**Off-by-one.** \`<\` and \`<=\` differ by exactly one pass:

\`\`\`python
n = 1
while n <= 3:      # 1, 2, 3
    print(n)
    n = n + 1
\`\`\`

Change that \`<=\` to \`<\` and you print 1, 2. One character, one missing pass.

**The runaway.** Nothing in the body moves the thing in the test → forever. No
error message, because nothing is wrong; Python is doing what you said.

**So when do you even want \`while\`?**

- Count known up front → **\`for\`**. \`for n in range(1, 4)\` cannot run away and
  cannot be off by one.
- Count unknown → **\`while\`**. That's the whole reason it exists.`,
    aiFraming: `The professional habit here is small and boring: if you *can* write it
as a \`for\`, write it as a \`for\`. Both of the bugs above stop being possible —
not less likely, impossible.

Which sounds like it makes \`while\` the loser, and it doesn't. It means that
when you *do* reach for \`while\`, it should be because there is genuinely no
count to be had: retry until the request goes through, keep sampling until the
answer is good enough, keep training until it stops getting better. Those are
the ones worth your attention, and they're the ones you'll write in AI work.`,
  },
  watch: {
    code: `n = 1
while n <= 3:
    print(n)
    n = n + 1
print("done", n)`,
    notes: {
      2: `\`<=\` lets the pass where \`n\` is exactly 3 through. \`<\` would not.

That single character is the whole off-by-one bug. When a loop is one pass short or one
pass long, this is the first place to look.`,
      5: `\`n\` is still here after the loop, and it is **4** — one past the last value that
passed the test.

That's not a bug, it's how it has to work: the loop only stops once it finds a value the
test rejects, so the leftover \`n\` is always the value that failed.`,
    },
  },
  predict: {
    code: `n = 1
while n < 3:
    print(n)
    n = n + 1
print(n)`,
    question: 'What does this print?',
    choices: ['1\n2\n3', '1\n2\n2', '1\n2', '1\n2\n3\n4'],
    answerIndex: 0,
    explain: `\`1\`, \`2\`, \`3\` — but not for the reason it looks like.

The **loop** only prints 1 and 2. When \`n\` reaches 3, \`3 < 3\` is false and the
loop is over — the third pass never happens.

That last \`3\` comes from the \`print(n)\` **outside** the loop. It's printing the
value that *failed* the test. Two different lines, and only one of them is in
the loop.`,
  },
  fix: {
    task: `This should print the numbers \`1\` through \`5\`, one per line. It stops at
\`4\`. Fix it.`,
    brokenCode: `n = 1
while n < 5:
    print(n)
    n = n + 1`,
    check: {
      kind: 'asserts',
      code: `lines = __stdout__.strip().split("\\n")
assert lines == ["1", "2", "3", "4", "5"], f"It printed {lines}. Expected 1 through 5 — when n is 5, does the test let that pass happen?"
assert n == 6, f"The numbers are right, but n ended at {n}. If the loop had printed the 5 on a pass of its own, where would the counter have to end up?"`,
    },
    hints: [
      "It prints 1, 2, 3, 4 — four passes where you wanted five. Exactly one short is always the same family of bug.",
      'Walk the pass that never happened. `n` is 5, and the test asks `5 < 5`. What does Python answer?',
      '`while n <= 5:` — `<=` lets the pass where `n` is exactly 5 through. (`while n < 6:` does the same job; pick whichever you can read.)',
    ],
    solution: `n = 1
while n <= 5:
    print(n)
    n = n + 1`,
  },
  stretch: {
    title: 'That loop should not have been a while',
    body: `Look at what you just fixed. You wrote three parts — a counter, a test, an
increment — to produce the numbers 1 to 5. You know how many there are. You knew
before you ran it.

\`\`\`python
for n in range(1, 6):
    print(n)
\`\`\`

Same output. No counter to initialise, no test to get backwards, no increment to
forget. **The bug you just fixed cannot be written here** — there's no \`<\` to
be a \`<=\`.

That's the actual lesson of this level, and it's worth more than the fix itself:
the best defence against a class of bug is a shape where the bug can't be
expressed. You met this idea in \`for\` loops — dropping the index killed the
\`i\`-versus-\`nums[i]\` mix-up. Same move, one topic later.

So: **known count → \`for\`. Unknown count → \`while\`.** If you're writing
\`while\` with a counter in it, stop and ask which one you're actually in.`,
    code: `for n in range(1, 6):
    print(n)`,
  },
}
