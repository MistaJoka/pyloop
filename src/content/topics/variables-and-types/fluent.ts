import type { Level } from '../../types'

export const fluent: Level = {
  level: 3,
  blurb: 'Converting between types, and the TypeError that tells you to.',
  concept: {
    body: `When the type is wrong, you convert:

\`\`\`python
int("30")     # 30    text -> whole number
float("2.5")  # 2.5   text -> decimal
str(30)       # "30"  number -> text
\`\`\`

Each one **builds a new value**. \`int(age)\` does not change \`age\` — \`age\` is
still a string afterwards. If you want the new value, store it.

Mixing types is where Python stops being clever:

\`\`\`python
"5" + 5   # TypeError: can only concatenate str (not "int") to str
\`\`\`

\`"5" + "5"\` joins and \`5 + 5\` adds — but for \`"5" + 5\` there's no sensible
answer, so Python refuses. **That error is a gift.** It's the failure that
happens at the line where the mistake is, instead of a wrong number three
screens later.

And every value can also answer yes/no: \`bool("")\` is \`False\`, \`bool("hi")\` is
\`True\`. Empty is false-ish, zero is false-ish, everything else is true-ish.`,
    aiFraming: `Half of "data cleaning" is this one page. Reading a CSV gives you
\`["5", "3", "9"]\` and you convert before you compute — that's what
\`df["age"].astype(int)\` is, done to a whole column at once.

The truthiness half bites harder. \`if not value:\` looks like "if the value is
missing", but \`0\` is false-ish too — so a row with a genuine measurement of
\`0\` gets treated as missing and silently thrown out of your dataset. It's a
real bug, it's common, and the model just quietly trains on less data.

When you mean "is it missing", say \`if value is None:\`. Say what you mean.`,
  },
  watch: {
    code: `age = "30"
print(age + " years")
n = int(age)
print(n + 5)
print(str(n) + "!")`,
    notes: {
      3: `\`int()\` doesn't convert \`age\` — it **reads** \`age\` and hands back a brand new
number, which we store as \`n\`.

Check the variables panel: \`age\` is still the string \`"30"\`. Both exist now, side by
side. That's why the result had to be stored.`,
      5: `The other direction. \`n + "!"\` would be a TypeError — you can't join a number to
text — so \`str(n)\` makes a text version of it first, and *then* \`+\` joins.

This is the standard move whenever you want a number inside a message.`,
    },
  },
  predict: {
    code: `print(bool("0"), bool(""), bool(0))`,
    question: 'What does this print?',
    choices: [
      'True False False',
      'False False False',
      'True True False',
      'False True False',
    ],
    answerIndex: 0,
    explain: `\`True False False\`. The one that surprises people is the first.

\`"0"\` is a **string with a character in it**. Truthiness for strings asks one
question — is it empty? — and this one isn't, so it's \`True\`. It never looks at
*what* the character is.

\`""\` is an empty string, so \`False\`. \`0\` is the number zero, so \`False\`.

Which means \`bool("False")\` is also \`True\`. Text is text.`,
  },
  fix: {
    task: `The answers come back from a form as text. This should total them — \`17\` —
but it crashes with a TypeError. Fix it **without** editing the data.`,
    brokenCode: `answers = ["5", "3", "9"]
total = 0
for a in answers:
    total = total + a
print(total)`,
    check: {
      kind: 'asserts',
      code: `assert answers == ["5", "3", "9"], f"answers is {answers!r} now. The data arriving as text isn't the bug — that's just how forms and files hand it to you. What could change is what you do with each item on the way in?"
assert total == 17, f"total came out as {total!r}, expected 17."
assert isinstance(total, int), f"total is {total!r} — still a str. Each item needs to become a number before it's added, not after."
assert __stdout__.strip() == "17", f"It should print 17, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      'Read the error: `total` is an int and `a` is a str, and Python has no meaning for adding those two. One of them is the wrong type for the job.',
      "You can't touch the list — so `a` arrives as a string every pass. Convert it at the moment you use it.",
      '`total = total + int(a)` — turn this pass\'s string into a number, then add.',
    ],
    solution: `answers = ["5", "3", "9"]
total = 0
for a in answers:
    total = total + int(a)
print(total)`,
  },
  stretch: {
    title: 'The conversions that lie, and the ones that shout',
    body: `Not every conversion behaves the way it looks:

\`\`\`python
int("3.5")    # ValueError — int() won't parse a decimal point
int(3.9)      # 3 — chops the decimal off. Does NOT round.
float("3.5")  # 3.5 — this is the one you wanted
round(3.9)    # 4 — this is rounding
\`\`\`

Two different failure modes in one place. \`int("3.5")\` **shouts**: you get a
ValueError and you fix it in thirty seconds.

\`int(3.9)\` **lies**: it gives you 3, no complaint, and every price in your
report is now up to a pound light. Losing 0.9 silently is a worse outcome than
crashing, and this is the general shape of type bugs — the loud ones are the
cheap ones.`,
    code: `print(int(3.9))
print(round(3.9))
print(float("3.5"))`,
  },
}
