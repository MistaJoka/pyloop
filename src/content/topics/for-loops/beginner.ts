import type { Level } from '../../types'

export const beginner: Level = {
  level: 1,
  blurb: 'The accumulator — build a value up as you go.',
  concept: {
    body: `A \`for\` loop does the same thing to every item in a collection.

\`\`\`python
for n in [10, 20, 30]:
    print(n)
\`\`\`

Python takes the first item, calls it \`n\`, runs the indented block. Then the
second item. Then the third. Then it stops — no counter to manage, no
off-by-one to get wrong.

The two things worth watching: \`n\` is **reassigned** each pass, and anything
you build up outside the loop (like a running total) **survives** between
passes. That's the whole idea.`,
    aiFraming: `Almost every loop you write in this course is something you'll later
delete. \`total = total + n\` over a list becomes \`arr.sum()\` in numpy — one
line, no loop, hundreds of times faster.

That's not a reason to skip loops. It's the reason to learn them properly now:
you can't recognize what a vectorized operation is *doing* until you've written
the loop it replaces by hand.`,
  },
  watch: {
    code: `total = 0
nums = [10, 20, 30]
for n in nums:
    total = total + n
    print(n, total)`,
    notes: {
      1: `Set up the accumulator **before** the loop. It has to exist first, and it has to
live outside — a variable made inside the loop would be rebuilt from scratch every pass.`,
      3: `Take the next item out of \`nums\`, call it \`n\`, run the indented block. Then come
back and take the next one. When there's nothing left, stop.

\`n\` is a new name each pass — it doesn't remember the last one.`,
      4: `The accumulator step. Read the right side first: \`total + n\` works out the new
value, *then* \`=\` stores it back into \`total\`.

That's why \`total\` appears on both sides. It's not a contradiction — it's "take what you
had, add to it, keep it".`,
    },
  },
  predict: {
    code: `count = 0
for word in ["a", "bb", "ccc"]:
    count = count + len(word)
print(count)`,
    question: 'What does this print?',
    choices: ['3', '6', '1 2 3', 'ccc'],
    answerIndex: 1,
    explain: `\`6\`. The loop adds each word's *length* to \`count\`: 1 + 2 + 3 = 6.

The \`print\` sits **outside** the loop (not indented), so it runs once at the
end — not once per word. If it were indented you'd get 1, then 3, then 6 on
separate lines. Indentation is the whole difference.`,
  },
  fix: {
    task: `This should print the total of all the prices — \`60\` — but it prints \`30\`.
Fix it.`,
    brokenCode: `prices = [10, 20, 30]
total = 0
for p in prices:
    total = p
print(total)`,
    check: {
      kind: 'asserts',
      code: `assert 'total' in dir(), "There's no variable called total anymore — keep it."
assert total == 60, f"total came out as {total}, but the prices add up to 60. Are you adding to total, or replacing it?"
assert __stdout__.strip() == "60", f"It should print 60, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      '`total = p` throws away whatever `total` was. Each pass overwrites the last one, so you end up with just the final price.',
      "You want to *add* to `total`, not replace it. What's on the left of the `=` should also appear on the right.",
      '`total = total + p` — take what `total` already is, add `p`, store it back. (`total += p` is the shorthand.)',
    ],
    solution: `prices = [10, 20, 30]
total = 0
for p in prices:
    total = total + p
print(total)`,
  },
  stretch: {
    title: 'The loop you just wrote already has a name',
    body: `Summing a list is so common Python has it built in:

\`\`\`python
total = sum(prices)
\`\`\`

Same answer, one line. And when you get to numpy, the same idea again:

\`\`\`python
import numpy as np
arr = np.array([10, 20, 30])
arr.sum()
\`\`\`

Why bother? \`arr.sum()\` runs as one machine-level operation over the whole
array instead of stepping through it in Python one item at a time. On three
prices it doesn't matter. On three million rows of training data, the loop
takes minutes and the numpy call takes milliseconds.

**That's the pattern to notice**: loop → built-in → vectorized. You're on the
first rung. Getting it right here is what makes the other two make sense.`,
    code: `prices = [10, 20, 30]
print(sum(prices))`,
  },
}
