import type { Level } from '../../types'

export const working: Level = {
  level: 2,
  blurb: 'int, float, str, bool — and why adding 5 and 5 can give 55.',
  concept: {
    body: `Every value has a **type**, and the type decides what the operators mean.

- \`int\` — a whole number: \`5\`
- \`float\` — a number with a decimal point: \`5.0\`
- \`str\` — text: \`"5"\`
- \`bool\` — yes or no: \`True\`

\`type(x)\` tells you which one you've got.

The quotes are the whole story. \`5\` is a number, \`"5"\` is a character that
happens to look like one — as far as Python cares, \`"5"\` is no more numeric than
\`"cat"\`.

So \`+\` does two different jobs:

- numbers → **add**: \`5 + 5\` is \`10\`
- strings → **join**: \`"5" + "5"\` is \`"55"\`

Same symbol, different meaning, decided entirely by the type.`,
    aiFraming: `Everything that arrives from outside your program arrives as text. CSV
files, JSON, web forms, scraped pages — all str, every time.

So a column of numbers you read from a file is a column of *strings* until
something converts it, and a "sum" over it will silently glue them end to end
instead of adding them. No crash. Just a nonsense number in a report.

This is why \`pandas\` prints \`dtype: object\` at you and why everyone learns to
read that line. \`object\` usually means "these are still strings and you thought
they were numbers".`,
  },
  watch: {
    code: `a = 5
b = "5"
print(type(a))
print(type(b))
print(a + a)
print(b + b)`,
    notes: {
      3: `\`type()\` asks Python what kind of value this is. It prints \`<class 'int'>\` — the
formal way of saying "whole number".

Two values that look identical on screen can be different types. This is how you check
instead of guess.`,
      6: `Same \`+\` as line 5, completely different job. On strings it **joins** rather than
adds, so you get \`"55"\` — and note the quotes in the output, they're Python telling you
this is text.

Nothing went wrong here. Python did exactly what \`+\` means for strings.`,
    },
  },
  predict: {
    code: `a = "3"
b = 4
print(a * b)`,
    question: 'What does this print?',
    choices: ['12', '3333', '34', '81'],
    answerIndex: 1,
    explain: `\`3333\`. \`*\` on a string and a number means **repeat**, not multiply —
so \`"3"\` gets written out 4 times.

It doesn't crash, which is the interesting part. Python found a perfectly valid
meaning for \`str * int\` and used it. You get a wrong-looking answer instead of
an error, and wrong-looking answers are much harder to find than errors.

\`"ab" * 3\` is \`"ababab"\` for the same reason.`,
  },
  fix: {
    task: `These two values should add up to \`8\`. The program prints \`53\` instead. Fix
it.`,
    brokenCode: `a = "5"
b = "3"
total = a + b
print(total)`,
    check: {
      kind: 'asserts',
      code: `assert 'total' in dir(), "There's no variable called total anymore — keep it."
assert isinstance(total, int), f"total is {total!r} — that's a str, not a number. Python joined them instead of adding them. What is it about how 5 and 3 are written that makes them text?"
assert total == 8, f"total came out as {total}, expected 8."
assert __stdout__.strip() == "8", f"It should print 8, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      'Nothing is wrong with line 3. `+` did exactly what it means for the types it was handed — look at what `a` and `b` actually *are*.',
      '`"5"` is text that looks like a number. Text joined to text gives longer text. What would make Python treat these as numbers?',
      'Drop the quotes: `a = 5` and `b = 3`. Now `+` adds, because now they\'re ints.',
    ],
    solution: `a = 5
b = 3
total = a + b
print(total)`,
  },
  stretch: {
    title: 'bool is secretly an int',
    body: `\`True\` and \`False\` aren't just a separate little type off to the side —
Python builds them **on top of** \`int\`. \`True\` is 1 and \`False\` is 0, all the
way down:

\`\`\`python
True + True     # 2
sum([True, False, True])   # 2
\`\`\`

That looks like a curiosity. It's actually the most-used trick in data work:
a list of True/False is a list of 1s and 0s, so \`sum()\` over it **counts the
matches**. \`(arr > 15).sum()\` in numpy is exactly this — build a mask of
True/False, add it up, get a count.

One caution while you're here: \`5 == 5.0\` is \`True\` (equal values) even though
\`int\` and \`float\` are different types. Equality asks about values, not types.`,
    code: `flags = [True, False, True, True]
print(sum(flags))
print(5 == 5.0)`,
  },
}
