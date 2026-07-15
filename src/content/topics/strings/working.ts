import type { Level } from '../../types'

export const working: Level = {
  level: 2,
  blurb: 'Slicing: start is included, stop is not. The off-by-one everyone hits.',
  concept: {
    body: `One index gives you one character. **Two** gives you a whole run of them.

\`\`\`python
s = "python"
s[1:4]    # "yth"
\`\`\`

Read it as \`s[start:stop]\`. And here is the rule the entire topic hangs on:

> **start is included. stop is NOT.**

\`s[1:4]\` gives you positions 1, 2, 3 — and stops *before* 4. So the length of a
slice is always \`stop - start\`. \`4 - 1 = 3\` characters. Every time.

Leave a side off and Python fills in "as far as it goes":

\`\`\`python
s[:3]     # "pyt"   from the start
s[3:]     # "hon"   to the end
\`\`\`

Which means \`s[:3] + s[3:]\` rebuilds the original **exactly** — no character
duplicated, none lost. That only works because 3 is excluded from the first half
and included in the second. The rule isn't an annoyance; it's what makes the two
pieces fit.`,
    aiFraming: `Every split you'll ever do lives on this rule. \`data[:800]\` is your
training set and \`data[800:]\` is your test set, and the reason no row lands in
both — and no row goes missing — is that stop-excluded boundary.

Get it backwards and row 800 is in your training data *and* your test data. Your
model then scores brilliantly on a row it has already seen. That's called
leakage, it's one of the most common ways a result turns out to be fiction, and
it starts as a single off-by-one right here.`,
  },
  watch: {
    code: `s = "python"
head = s[:3]
tail = s[3:]
print(head, tail)
print(head + tail == s)`,
    notes: {
      2: `No number before the colon means "start at the beginning". So this is positions
0, 1, 2 — and it **stops before** 3.

\`s[:3]\` and \`s[0:3]\` are the same thing. The short form is what you'll see in the wild.`,
      3: `No number after the colon means "run to the end". This starts **at** 3 and takes
everything left.

Look at what just happened: position 3 was excluded from \`head\` and included in \`tail\`.
It appears exactly once across the two. That's the stop-excluded rule paying for itself.`,
    },
  },
  predict: {
    code: `s = "abcdef"
print(s[1:4])`,
    question: 'What does this print?',
    choices: ['bcd', 'bcde', 'abcd', 'cd'],
    answerIndex: 0,
    explain: `\`bcd\`. Start at 1, stop **before** 4:

\`\`\`text
a  b  c  d  e  f
0  1  2  3  4  5
   ^^^^^^^^     ← 1, 2, 3 — and 4 is the wall, not a brick
\`\`\`

If you said \`bcde\` you included the stop. It's the natural reading and it's
wrong — and the fastest way to stop making it is the length trick:
\`stop - start\` = \`4 - 1\` = **3 characters**. If your answer has 4, it's out.`,
  },
  fix: {
    task: `Product codes look like \`"PY-2024"\`. This should pull the year out — \`2024\` —
but it prints \`202\`. Fix the slice.`,
    brokenCode: `code = "PY-2024"
year = code[3:6]
print(year)`,
    check: {
      kind: 'asserts',
      code: `assert year == "2024", f"year came out as {year!r}, which is {len(year)} characters. A slice is always stop - start long — so what stop do you need to get 4?"
assert __stdout__.strip() == "2024", f"It should print 2024, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      'Number the characters: `P`=0, `Y`=1, `-`=2, `2`=3... which position is the final `4` sitting at?',
      'The stop is excluded, so a stop of 6 gives you positions 3, 4 and 5 — three characters. You want four.',
      '`code[3:7]` — or, since the year runs to the end of the string, just `code[3:]` and let Python work it out.',
    ],
    solution: `code = "PY-2024"
year = code[3:]
print(year)`,
  },
  stretch: {
    title: 'The third number, and the reversal trick',
    body: `A slice takes an optional **step**: \`s[start:stop:step]\`.

\`\`\`python
s = "abcdef"
s[::2]     # "ace"   every second character
s[::-1]    # "fedcba"  ← backwards
\`\`\`

\`s[::-1]\` is the idiomatic Python way to reverse a string, and it's worth
recognising on sight because it looks like line noise the first time. No start,
no stop, step of -1: "walk the whole thing, backwards".

Also handy: slices **never** raise \`IndexError\`. \`s[0]\` on an empty string
explodes; \`s[0:5]\` on a 2-character string quietly hands you those 2 characters.
That forgiveness is lovely right up until it hides a bug from you.`,
    code: `s = "abcdef"
print(s[::2])
print(s[::-1])
print("ab"[0:5])`,
  },
}
