import type { Level } from '../../types'

export const fluent: Level = {
  level: 3,
  blurb: 'and, or, not — and what Python quietly counts as true.',
  concept: {
    body: `Two conditions, one gate.

- \`and\` → true only when **both** sides are true
- \`or\` → true when **either** side is true
- \`not\` → flips it

\`\`\`python
if age >= 18 and age < 65:
\`\`\`

And because that shape is so common, Python lets you **chain** it like maths:

\`\`\`python
if 18 <= age < 65:
\`\`\`

Same meaning, and \`age\` is only worked out once.

Now the part that surprises people. \`if\` doesn't need \`True\` — it takes
anything and asks "is this *truthy*?" These are all **falsy**:

\`\`\`text
0    0.0    ""    []    {}    None    False
\`\`\`

Everything else is truthy. So \`if items:\` means "if the list has anything in
it". Handy — and the reason \`"0"\` (a string, not empty) is **true**.`,
    aiFraming: `Truthiness is where real data bites. A missing value is \`None\`, an
empty result is \`[]\`, and a measured zero is \`0\` — and \`if value:\` treats all
three as the same thing.

"No reading was taken" and "the reading was zero" are not the same fact, but
that one line collapses them. This is a genuine source of quiet data bugs, and
it's why you'll see \`if value is not None:\` written out longhand in careful
code. Longer, and it means what it says.`,
  },
  watch: {
    code: `age = 25
income = 0
if 18 <= age < 65:
    print("working age")
if not income:
    print("no income on file")`,
    notes: {
      3: `A **chained comparison**. It reads like maths and it means what it looks like:
\`18 <= age and age < 65\`.

Python works \`age\` out once and checks both ends. In most languages this line is a syntax
error — in Python it's the idiomatic way to say "between".`,
      5: `\`income\` is \`0\`, and \`0\` is **falsy** — so \`not income\` is \`True\` and the block
runs.

Read what that actually claims, though. It fires for \`0\`, but it would also fire for
\`None\` and for \`""\`. "Earns nothing" and "we never asked" look identical to this line.`,
    },
  },
  predict: {
    code: `x = 0
y = "0"
if x or y:
    print("yes")
else:
    print("no")`,
    question: 'What does this print?',
    choices: ['yes', 'no', '0', 'True'],
    answerIndex: 0,
    explain: `\`yes\`. Take the two sides separately:

- \`x\` is \`0\` → falsy
- \`y\` is \`"0"\` → a string with a character in it → **truthy**

\`or\` only needs one side, and \`y\` delivers.

The trap is that \`"0"\` *looks* like zero. Python isn't reading it — it only asks
"is this string empty?" It isn't. The only falsy string is \`""\`.`,
  },
  fix: {
    task: `A valid score is between 0 and 100 inclusive — so out of \`[55, 120, -3, 90]\`
only \`55\` and \`90\` count, and this should print \`2\`. It prints \`4\`. Fix the
condition.`,
    brokenCode: `scores = [55, 120, -3, 90]
valid = 0
for s in scores:
    if s >= 0 or s <= 100:
        valid = valid + 1
print(valid)`,
    check: {
      kind: 'asserts',
      code: `assert valid == 2, f"valid came out as {valid}. Only 55 and 90 are inside 0..100 — so if you got 4, is there any number at all that could fail 's >= 0 or s <= 100'?"
assert __stdout__.strip() == "2", f"It should print 2, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      'Try the condition on `120` by hand. Is `120 >= 0` true? Then stop — `or` has already got what it needs, and the second half never mattered.',
      'You want both halves to hold **at the same time**, not either one on its own.',
      '`if s >= 0 and s <= 100:` — or say it the Python way: `if 0 <= s <= 100:`.',
    ],
    solution: `scores = [55, 120, -3, 90]
valid = 0
for s in scores:
    if 0 <= s <= 100:
        valid = valid + 1
print(valid)`,
  },
  stretch: {
    title: 'or gives you back a value, not True',
    body: `\`or\` doesn't return \`True\`. It returns the first truthy operand it finds:

\`\`\`python
print(0 or "fallback")     # fallback
print("real" or "fallback")  # real
\`\`\`

Which is why you'll see this everywhere:

\`\`\`python
name = given_name or "anonymous"
\`\`\`

"Use \`given_name\`, unless it's empty." Neat — and it carries the truthiness trap
with it. If \`given_name\` is \`0\`, or \`""\`, or \`None\`, you get \`"anonymous"\`,
and \`0\` might have been a perfectly good answer.

Use it for strings you'd never want blank. Reach for \`is None\` the moment zero
is a legal value.`,
    code: `print(0 or "fallback")
print("real" or "fallback")`,
  },
}
