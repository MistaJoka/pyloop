import type { Level } from '../../types'

export const working: Level = {
  level: 2,
  blurb: 'Decide per item — an if inside the loop.',
  concept: {
    body: `You don't have to act on every item. An \`if\` inside the loop decides
each time around.

\`\`\`python
for p in prices:
    if p > 15:
        total = total + p
\`\`\`

Read the indentation as the answer to "how often does this run?"

- indented under \`for\` → **every** pass
- indented under \`if\` → only the passes where the condition is true

That's it. The loop still visits all three prices; the \`if\` just decides which
ones count.`,
    aiFraming: `You're describing a **filter**, and filtering is most of data work —
drop the bad rows, keep the ones over a threshold, count the ones that match.

In numpy the same idea loses the loop entirely:

\`\`\`python
arr[arr > 15].sum()
\`\`\`

\`arr > 15\` builds a mask of True/False, and the mask selects. Same decision
you're making per item here, made for the whole array at once.`,
  },
  watch: {
    code: `total = 0
prices = [10, 20, 30]
for p in prices:
    if p > 15:
        total = total + p
print(total)`,
    notes: {
      4: `Asked fresh on every pass. \`p > 15\` is either true or false for *this* item, and
only decides what happens to *this* item.`,
      5: `Indented under the \`if\`, so it only runs on the passes where the condition held.

The indentation is the rule. One level in = every pass. Two levels in = only when the
\`if\` is true.`,
      6: `Not indented at all, so it isn't part of the loop. It runs once, after the loop is
completely finished.`,
    },
  },
  predict: {
    code: `kept = 0
for n in [5, 12, 8, 20]:
    if n > 10:
        kept = kept + 1
print(kept)`,
    question: 'What does this print?',
    choices: ['4', '2', '32', '1'],
    answerIndex: 1,
    explain: `\`2\`. The loop visits all four numbers, but \`kept\` only goes up when
\`n > 10\` — that's 12 and 20.

Note it counts **1 per match**, it doesn't add the numbers. \`kept = kept + 1\`
counts; \`kept = kept + n\` would total. Easy to mix up when you're skimming.`,
  },
  fix: {
    task: `This totals **every** price and prints \`53\`. It should only total the prices
over 10 — that's \`18 + 22\`, so \`40\`. Add the condition.`,
    brokenCode: `prices = [4, 18, 9, 22]
total = 0
for p in prices:
    total = total + p
print(total)`,
    check: {
      kind: 'asserts',
      code: `assert total == 40, f"total came out as {total}. Expected 40 — only 18 and 22 are over 10. If you got 53, every price is still being added."
assert __stdout__.strip() == "40", f"It should print 40, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      'Right now every price gets added. You want to add only some of them.',
      'An `if` inside the loop decides per item. Whatever you indent under the `if` only happens when the condition is true.',
      '`for p in prices:` then `    if p > 10:` then `        total = total + p` — the deeper indent is what makes the adding conditional.',
    ],
    solution: `prices = [4, 18, 9, 22]
total = 0
for p in prices:
    if p > 10:
        total = total + p
print(total)`,
  },
  stretch: {
    title: 'Same filter, fewer lines',
    body: `Once the loop only exists to filter and total, Python has a shorter way to
say it:

\`\`\`python
total = sum(p for p in prices if p > 10)
\`\`\`

Read it right to left: take \`prices\`, keep the ones over 10, sum them. Same
three ideas — loop, condition, accumulate — packed into one line.

Don't reach for this until the long version is automatic. The one-liner is
easier to *write* and harder to *debug*.`,
    code: `prices = [4, 18, 9, 22]
print(sum(p for p in prices if p > 10))`,
  },
}
