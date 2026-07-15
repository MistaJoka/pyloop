import type { Level } from '../../types'

export const master: Level = {
  level: 5,
  blurb: 'Convergence — repeat until the answer stops moving.',
  concept: {
    body: `Here's the loop that runs the field you're heading into:

\`\`\`python
while change > tolerance:
    take a step
    change = how much things moved
\`\`\`

Nobody knows how many passes that takes. Not you, not Python, not the person who
wrote the tolerance. It stops when the answer stops moving. That's a
**convergence loop**, and it is literally the shape of model training: nudge the
weights, measure how much the loss improved, stop when it stops improving.

And it's the one loop shape that never vectorizes away.

\`arr.sum()\` can do a million adds at once because no add depends on the one
before it — that's a **pile**. Pass N of a convergence loop depends entirely on
what pass N−1 produced. That's a **chain**, and you cannot do a chain all at
once. \`while\` survives because it's the loop where the steps need each other.`,
    aiFraming: `You've spent this whole topic and the last one watching loops get
deleted: loop → built-in → vectorized, \`total = total + n\` → \`arr.sum()\`. This
is where that stops.

The training loop is a \`while\`. Sometimes it's wearing a costume —
\`for epoch in range(100)\` with a \`break\` when the loss plateaus is a
convergence loop that's been handed a budget — but underneath, every epoch is
built from the weights the last one produced, and no amount of hardware collapses
that into one step.

It's also why training is slow and inference is fast. A batch of predictions is a
pile: run them all at once. Epochs are a chain: run them in order, one at a time,
and wait. That distinction is most of what makes ML engineering expensive, and
you're looking at it in five lines.`,
  },
  watch: {
    code: `guess = 8.0
target = 100.0
steps = 0
while abs(guess * guess - target) > 0.01:
    guess = (guess + target / guess) / 2
    steps = steps + 1
print(round(guess, 4), steps)`,
    notes: {
      4: `Not a count — a **distance**. \`abs(guess * guess - target)\` is how far off the
guess currently is, and the loop runs while that's still too big.

Read it as "am I close enough yet?". Nothing here knows how many passes that will take, and
that's not a gap in the code — it's the point.`,
      5: `The step. Each pass starts from the guess the **last** pass produced.

That chain is the whole reason this can't be handed to numpy: you can't compute pass 3
until pass 2 has told you where it landed. Watch \`guess\` in the panel — 8, then 10.25,
then 10.003. Each one is built out of the one above it.`,
    },
  },
  predict: {
    code: `x = 1.0
n = 0
while x > 0.1:
    x = x / 2
    n = n + 1
print(n)`,
    question: 'What does this print?',
    choices: ['4', '3', '5', '10'],
    answerIndex: 0,
    explain: `\`4\`. \`x\` goes 0.5, 0.25, 0.125, 0.0625.

The one to catch is 0.125 — still above 0.1, so the loop takes one more pass and
lands well under. Four passes.

Now the real point: **you could not read that 4 off the code.** You had to know
how fast \`x\` shrinks. Change the starting value, or the halving to a third, or
the tolerance, and it's a different number. The pass count of a convergence loop
is an *output*, not an input — which is exactly why it can't be a \`for\`.`,
  },
  fix: {
    task: `This should refine \`guess\` until it's within \`0.01\` of the square root of 9,
then print \`3.0\`. Instead it does nothing at all and prints \`1.0\`. Fix it.`,
    brokenCode: `guess = 1.0
target = 9.0
while abs(guess * guess - target) < 0.01:
    guess = (guess + target / guess) / 2
print(round(guess, 3))`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
assert any(isinstance(n, ast.While) for n in ast.walk(tree)), "The while loop is gone. The job is to let the loop converge on the answer, not to hand it the answer."
assert round(guess, 3) == 3.0, f"guess ended at {guess}. It should converge to 3.0. Does the body run even once — is the test true on the very first check?"
assert __stdout__.strip() == "3.0", f"It should print 3.0, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      "Nothing happens. The body never runs, not once — so the test must already be false the first time Python looks at it.",
      "Read the test as English: 'keep looping while the guess is *already* close enough.' That's backwards. When do you want to keep working — when you're close, or when you're far?",
      '`while abs(guess * guess - target) > 0.01:` — keep going while the distance is still **big**, and stop once it gets small.',
    ],
    solution: `guess = 1.0
target = 9.0
while abs(guess * guess - target) > 0.01:
    guess = (guess + target / guess) / 2
print(round(guess, 3))`,
  },
  stretch: {
    title: 'The count is an output',
    body: `Same loop, counting its own passes:

\`\`\`python
guess = 1.0
steps = 0
while abs(guess * guess - 9.0) > 0.0001:
    guess = (guess + 9.0 / guess) / 2
    steps = steps + 1
print(steps, round(guess, 6))
\`\`\`

Five. Not because anyone chose five. Start at \`1000.0\` and it's more. Tighten
the tolerance and it's more. **The count fell out of the loop; it didn't go in.**

That's the whole difference between the two loops, in one sentence:

- \`for\` — *I know how many. Do it that many times.*
- \`while\` — *I know what done looks like. Tell me when we get there.*

And that's where this topic has been going the whole time. \`for loops\` ended
with the loop disappearing into \`arr * 2\`, because a pile of independent work
can always be handed off. This one ends with the loop that stays: convergence is
a chain, chains have to be walked in order, and the thing walking them is a
\`while\`.

Every model you will ever train was trained by one.`,
    code: `guess = 1.0
steps = 0
while abs(guess * guess - 9.0) > 0.0001:
    guess = (guess + 9.0 / guess) / 2
    steps = steps + 1
print(steps, round(guess, 6))`,
  },
}
