import type { Level } from '../../types'

export const beginner: Level = {
  level: 1,
  blurb: 'The three parts you own — initialise, test, change.',
  concept: {
    body: `A \`for\` loop knows when to stop. A \`while\` loop stops only when **you**
make it.

\`\`\`python
count = 3
while count > 0:
    print(count)
    count = count - 1
\`\`\`

Three parts, and all three are yours:

1. **initialise** — \`count = 3\`, before the loop.
2. **test** — \`count > 0\`, checked before *every* pass, including the first.
3. **change** — \`count = count - 1\`, inside the body.

\`for\` gave you all three for free. Here, forget the change and the test never
changes its mind. The loop runs forever.`,
    aiFraming: `\`while\` is the loop for when nobody knows the count in advance.

Retry an API call until it succeeds. Generate tokens until the model emits a
stop. Train until the loss stops improving. None of those have a number you
could put in \`range()\` — you find out how many passes it took by running it.

That's the trade. \`for\` is a promise the language keeps for you. \`while\` is a
promise you have to keep yourself.`,
  },
  watch: {
    code: `count = 3
while count > 0:
    print(count)
    count = count - 1
print("go")`,
    notes: {
      2: `The test, asked **before every pass** — including the very first one. If it's
already false when the loop is reached, the body never runs at all. Not once.

Nothing here says how many passes there will be. That's decided entirely by what the body
does to \`count\`.`,
      4: `The change, and the only reason this loop ever ends. Delete this line and \`count\`
stays 3, \`count > 0\` stays true, and the loop never stops.

A \`for\` loop does this step for you invisibly. A \`while\` loop makes it your job.`,
    },
  },
  predict: {
    code: `n = 1
while n < 20:
    n = n * 3
print(n)`,
    question: 'What does this print?',
    choices: ['27', '9', '20', '81'],
    answerIndex: 0,
    explain: `\`27\`. \`n\` goes 1 → 3 → 9 → 27.

The catch is 9. \`9 < 20\` is true, so the loop takes **one more pass**, and that
pass lands on 27 — way past 20. Then \`27 < 20\` is false and it stops.

A \`while\` loop doesn't stop *at* the boundary. It stops the first time it looks
and the test has already gone false. Overshooting is normal.`,
  },
  fix: {
    task: `This should count down \`4\`, \`3\`, \`2\`, \`1\` and then print \`sold out\`. It
prints \`sold out\` and nothing else. Fix it.`,
    brokenCode: `tickets = 0
while tickets > 0:
    print(tickets)
    tickets = tickets - 1
print("sold out")`,
    check: {
      kind: 'asserts',
      code: `lines = __stdout__.strip().split("\\n")
assert lines != ["sold out"], "Still nothing but 'sold out' — the body never runs once. A while loop checks its test BEFORE the first pass. What is tickets when that first check happens?"
assert lines == ["4", "3", "2", "1", "sold out"], f"It printed {lines}. Expected ['4', '3', '2', '1', 'sold out'] — where does the countdown need to start?"`,
    },
    hints: [
      'The body never runs. Not even once — that\'s the clue. A `while` checks its test *before* the first pass, not after.',
      'Walk that first check by hand. `tickets` is 0, so the test asks `0 > 0`. What does Python say to that?',
      '`tickets = 0` should be `tickets = 4`. The initialise step decides where the countdown starts; the test and the change are already correct.',
    ],
    solution: `tickets = 4
while tickets > 0:
    print(tickets)
    tickets = tickets - 1
print("sold out")`,
  },
  stretch: {
    title: 'The one you must not write',
    body: `Take the change out of the countdown and look at what's left:

\`\`\`python
count = 3
while count > 0:
    print(count)
\`\`\`

\`count\` is 3. It stays 3. \`3 > 0\` is true, and it is true again, and again, and
it will still be true tomorrow. This prints \`3\` until you kill it.

Nothing is broken here in the way a typo is broken. Python is doing exactly what
it was told. That's what makes it the signature \`while\` bug: **there's no error
message, because there's no error.**

Two habits that kill it before it starts:

- Write the change line **at the same time** you write the \`while\` line. Not
  after. Not "in a second".
- Before you run it, point at the thing in the test and ask: *what in the body
  moves this?* If you can't point at a line, you have an infinite loop.

(This app traps it for you — it caps at 10,000 steps and tells you the trace is
truncated. Your terminal will not be that kind. That's Ctrl-C.)`,
  },
}
