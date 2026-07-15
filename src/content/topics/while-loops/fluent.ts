import type { Level } from '../../types'

export const fluent: Level = {
  level: 3,
  blurb: 'break, continue, and the while True sentinel loop.',
  concept: {
    body: `Two words that move where the loop's exits are.

- \`break\` — leave the loop **now**. Don't finish the body, don't test again.
- \`continue\` — skip the rest of the body, jump straight back to the test.

\`continue\` is loaded. Jump back to the test *without* running the change and
you've turned a working loop into a runaway:

\`\`\`python
while n < 10:
    if n == 3:
        continue      # n never grows again. Stuck at 3 forever.
    n = n + 1
\`\`\`

And \`break\` unlocks the shape you'll use most:

\`\`\`python
while True:
    ...
    if done:
        break
\`\`\`

\`True\` is never false, so the \`break\` is the **only** way out. That's the point:
it says out loud that the exit is an *event*, not a count.`,
    aiFraming: `\`while True:\` + \`break\` is the agent loop. Every one of them. Call the
model, look at what came back, break if it's done — otherwise go round again.
Token generation is the same shape: keep emitting until the stop token shows up.

Which is also why every real agent loop carries a step budget:

\`\`\`python
if steps > 50:
    break
\`\`\`

\`while True\` with a bug in the exit isn't a hang. It's an invoice. The budget
isn't defensive programming, it's the second \`break\` you always write.`,
  },
  watch: {
    code: `nums = [4, 7, 2, 9, 5]
i = 0
while True:
    if nums[i] > 8:
        break
    print(nums[i])
    i = i + 1
print("stopped at", i)`,
    notes: {
      3: `\`True\` is never false, so this test can never end the loop. Read \`while True:\` as
"the exit is somewhere in the body" — and then go find it, because if there isn't one, this
runs forever.`,
      4: `The real test, living inside the body instead of at the top. \`break\` leaves
immediately: the \`print\` below never runs on this pass, and the loop does not test again.

Watch the trace — nothing after line 5 executes once the 9 shows up.`,
    },
  },
  predict: {
    code: `n = 0
total = 0
while n < 6:
    n = n + 1
    if n % 2 == 0:
        continue
    total = total + n
print(total)`,
    question: 'What does this print?',
    choices: ['9', '21', '12', '6'],
    answerIndex: 0,
    explain: `\`9\`. \`continue\` skips the rest of the body — the \`total = total + n\`
line — and goes straight back to the test. So only the odd \`n\` get added:
1 + 3 + 5 = 9.

Now look at **where the change is**: \`n = n + 1\` sits at the top, above the
\`continue\`. That's deliberate. Move it below and the first even \`n\` jumps back
to the test with \`n\` unchanged, forever — same value, same skip, same jump. The
loop hangs.

That's the \`continue\` trap in one sentence: **anything below a \`continue\` might
not run, so never put the change there.**`,
  },
  fix: {
    task: `\`0\` is the end-of-list marker. This should print the scores up to it — \`8\`
and \`5\` — and then stop reading entirely. Instead it skips the \`0\` and carries
on, printing \`7\` and \`3\` too. Fix it.`,
    brokenCode: `scores = [8, 5, 0, 7, 3]
i = 0
while i < len(scores):
    score = scores[i]
    i = i + 1
    if score == 0:
        continue
    print(score)`,
    check: {
      kind: 'asserts',
      code: `lines = __stdout__.strip().split("\\n")
assert lines != ["8", "5", "7", "3"], "The 7 and the 3 are still coming out. The 0 isn't a value to skip past — it's the signal to stop. Does your keyword end this pass, or end the loop?"
assert lines == ["8", "5"], f"It printed {lines}. Expected ['8', '5'] — nothing after the 0 should ever be read."`,
    },
    hints: [
      '`continue` and `break` sound similar and do opposite-sized jobs. One ends this pass. The other ends the loop.',
      "Read the task again: the `0` means *stop reading*. Right now the loop treats it as *ignore this one and keep going* — so the 7 and the 3 still get through.",
      '`if score == 0:` then `    break`. `break` leaves the loop on the spot; `continue` would only move on to the next score.',
    ],
    solution: `scores = [8, 5, 0, 7, 3]
i = 0
while i < len(scores):
    score = scores[i]
    i = i + 1
    if score == 0:
        break
    print(score)`,
  },
  stretch: {
    title: 'Two ways out, one place',
    body: `The loop you just fixed has two exits in two different shapes: a test at the
top (ran out of scores) and a \`break\` in the middle (hit the marker). \`while
True\` lets you put both in the same place:

\`\`\`python
while True:
    if i >= len(scores) or scores[i] == 0:
        break
    print(scores[i])
    i = i + 1
\`\`\`

Read the \`or\` as: **any of these ends the loop.** Add a third reason to stop and
it goes in the same line, not in a new shape somewhere else.

This is why \`while True\` isn't the cop-out it looks like. A \`while\` header can
only hold one test, evaluated at one moment — the top. Real loops stop for
several reasons, and often for reasons you can only check *after* you've done
some of the work. \`while True\` + \`break\` is how you say that honestly.

The price is that you're now solely responsible for the exit. There is no test at
the top quietly covering for you.`,
    code: `scores = [8, 5, 0, 7, 3]
i = 0
while True:
    if i >= len(scores) or scores[i] == 0:
        break
    print(scores[i])
    i = i + 1`,
  },
}
