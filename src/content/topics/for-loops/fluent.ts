import type { Level } from '../../types'

export const fluent: Level = {
  level: 3,
  blurb: 'Position vs value — range, len, and the classic mix-up.',
  concept: {
    body: `Sometimes you need to know **where** you are, not just what you're
looking at.

\`\`\`python
for i in range(len(names)):
    print(i, names[i])
\`\`\`

\`len(names)\` is how many there are. \`range(3)\` produces 0, 1, 2 — the valid
positions. So \`i\` is a **position**, and \`names[i]\` is the **item** at that
position.

This is the single most common confusion in the whole topic: \`i\` is not your
data. \`i\` is where your data lives. If you find yourself testing \`i\` when you
meant to test the value, you've hit it.

You mostly won't need this — \`for name in names\` is better when you don't care
about position. Reach for the index only when you actually need the number.`,
    aiFraming: `Index-based loops are how you keep two lists lined up: sample \`i\`'s
features with sample \`i\`'s label. Get the index wrong and your model trains on
mismatched pairs — which doesn't crash, it just quietly produces garbage.

This is why the AI world moved to \`zip\` and to dataframes where the pairing is
structural instead of something you maintain by hand. You'll meet \`zip\` at
Master.`,
  },
  watch: {
    code: `names = ["ana", "bo", "cy"]
for i in range(len(names)):
    print(i, names[i])`,
    notes: {
      2: `Read it inside out. \`len(names)\` is 3. \`range(3)\` produces 0, 1, 2 — the valid
positions. So \`i\` is a **position**, not a name.

Watch the variables panel: \`i\` goes 0, 1, 2. It is never "ana".`,
      3: `\`names[i]\` is the lookup: give me whatever lives at position \`i\`.

This is the line that turns a position back into your data. If you ever test \`i\` when you
meant to test \`names[i]\`, you've hit the classic bug in this whole topic.`,
    },
  },
  predict: {
    code: `letters = ["a", "b", "c", "d"]
count = 0
for i in range(len(letters)):
    if i % 2 == 0:
        count = count + 1
print(count)`,
    question: 'What does this print?',
    choices: ['2', '4', '3', '1'],
    answerIndex: 0,
    explain: `\`2\`. \`range(len(letters))\` is 0, 1, 2, 3 — and two of those are even
(0 and 2).

Read what's being tested: \`i % 2\`, not \`letters[i]\`. This counts **positions**,
and it never looks at the letters at all. The list could have been
\`["x", "y", "z", "w"]\` and the answer would be identical.`,
  },
  fix: {
    task: `This should count how many **numbers** are even — that's \`4\`, \`2\` and \`8\`,
so \`3\`. It prints \`4\`. Fix it.`,
    brokenCode: `nums = [4, 3, 9, 7, 2, 11, 8]
evens = 0
for i in range(len(nums)):
    if i % 2 == 0:
        evens = evens + 1
print(evens)`,
    check: {
      kind: 'asserts',
      code: `assert evens == 3, f"evens came out as {evens}. Expected 3 — the even numbers are 4, 2 and 8. If you got 4, you're still testing the position instead of the number."
assert __stdout__.strip() == "3", f"It should print 3, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      "`i` is the position — 0, 1, 2, 3… — not the number in the list. Right now the `if` is asking whether the *position* is even.",
      '`nums[i]` is how you get the number sitting at position `i`.',
      '`if nums[i] % 2 == 0:` — test the number, not where it lives.',
    ],
    solution: `nums = [4, 3, 9, 7, 2, 11, 8]
evens = 0
for i in range(len(nums)):
    if nums[i] % 2 == 0:
        evens = evens + 1
print(evens)`,
  },
  stretch: {
    title: "You didn't need the index at all",
    body: `Look at the fixed version. \`i\` is used for exactly one thing: fetching
\`nums[i]\`. That's a tell — if the position is only there to get the item, drop
the position:

\`\`\`python
for n in nums:
    if n % 2 == 0:
        evens = evens + 1
\`\`\`

Shorter, and the bug you just fixed becomes **impossible to write** — there's no
\`i\` to confuse with the value.

That's worth more than the brevity. The best fix for a class of bug is a style
where the bug can't be expressed.`,
    code: `nums = [4, 3, 9, 7, 2, 11, 8]
evens = 0
for n in nums:
    if n % 2 == 0:
        evens = evens + 1
print(evens)`,
  },
}
