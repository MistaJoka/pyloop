import type { Level } from '../../types'

export const fluent: Level = {
  level: 3,
  blurb: 'Precedence — Python does not read left to right, and brackets beat memorising the table.',
  concept: {
    body: `\`2 + 3 * 4\` is \`14\`, not \`20\`. Python doesn't read left to right — some
operators **bind tighter** and go first.

The order you actually need:

\`\`\`text
**          first
-x          unary minus
* / // %
+ -         last
\`\`\`

Two consequences worth more than the table itself.

**The average bug.** This looks fine and is wrong:

\`\`\`python
a + b / 2      # 4 + (6 / 2) = 7.0
(a + b) / 2    # 10 / 2      = 5.0
\`\`\`

**Exponent beats unary minus.** This surprises everyone:

\`\`\`python
-2 ** 2        # -4   — it's -(2 ** 2)
(-2) ** 2      #  4
\`\`\`

The minus isn't part of the number. It's an operator, and a weaker one than
\`**\`.

Don't memorise the table. Bracket anything you'd have to think about — the
brackets cost nothing and they're read by the next person too.`,
    aiFraming: `Precedence bugs don't crash. That's the whole problem with them.

\`a + b / 2\` returns a number. It's the *wrong* number, and it flows onward
looking exactly like a right one — into a normalisation step, a loss value, a
threshold. You find it three days later, from an output that's off by an amount
nobody can explain.

This is the class of bug where reading the code is useless, because the code
reads as English and English has no precedence rules. The only reliable defence
is not writing the ambiguous version in the first place. Brackets are how you
put the meaning in the source instead of in your head.`,
  },
  watch: {
    code: `print(2 + 3 * 4)
print((2 + 3) * 4)
a = 4
b = 6
print(a + b / 2)
print((a + b) / 2)
print(-2 ** 2)`,
    notes: {
      1: `\`*\` binds tighter than \`+\`, so Python does \`3 * 4\` first and *then* adds 2. 14.

Left to right is a guess that happens to be right often enough to fool you.`,
      5: `The average bug, live. This is \`a + (b / 2)\` — divide 6 by 2, then add 4. 7.0.

No error, no warning. Just a plausible-looking wrong number.`,
      7: `\`**\` binds tighter than the minus sign, so this is \`-(2 ** 2)\` — square it,
*then* negate. -4.

The \`-\` never belonged to the 2. It's an operator waiting its turn.`,
    },
  },
  predict: {
    code: `print(-3 ** 2)`,
    question: 'What does this print?',
    choices: ['-9', '9', '-6', '6'],
    answerIndex: 0,
    explain: `\`-9\`. Everyone reads this as "minus three, squared" — and squaring a
negative gives a positive, so \`9\` feels obviously right.

But there is no "minus three" here. There's a \`3\`, a \`**\`, and a \`-\` operator
sitting outside. \`**\` goes first, so Python computes \`3 ** 2\` → \`9\`, then
applies the minus → \`-9\`.

\`(-3) ** 2\` is \`9\`. The brackets are what make the minus part of the number, and
they're the only thing that does.`,
  },
  fix: {
    task: `The average of 4 and 6 is \`5.0\`. This prints \`7.0\`. The numbers are right —
fix the expression.`,
    brokenCode: `a = 4
b = 6
average = a + b / 2
print(average)`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
names = {n.id for n in ast.walk(tree) if isinstance(n, ast.Name)}
assert 'a' in names and 'b' in names, "Are a and b both still in the expression, or did 5.0 get typed in directly? It should still work if a and b change."
assert a == 4 and b == 6, f"a is {a!r} and b is {b!r} now. The values were never wrong — it's the order the operators run in."
assert average == 5.0, f"average came out as {average!r}. 7.0 is exactly what 4 + (6 / 2) gives — so which operation did Python do first, and which did you need first?"
assert __stdout__.strip() == "5.0", f"It should print 5.0, but it printed {__stdout__.strip()!r}. An average of two ints is a float — which division gives you that?"`,
    },
    hints: [
      "Nothing is misspelled and nothing crashed. Python did exactly what you wrote — it just isn't what you meant. Work out `a + b / 2` by hand, following the precedence rules.",
      '`/` binds tighter than `+`, so `b / 2` happens first and only *then* does `a` get added. You need the addition to happen first.',
      '`average = (a + b) / 2`. Brackets are the only way to override precedence, and they cost nothing.',
    ],
    solution: `a = 4
b = 6
average = (a + b) / 2
print(average)`,
  },
  stretch: {
    title: 'The one operator that goes right to left',
    body: `Nearly everything groups left to right: \`10 - 3 - 2\` is \`(10 - 3) - 2\` =
\`5\`, not \`10 - (3 - 2)\` = \`9\`.

\`**\` is the exception. It groups **right** to left:

\`\`\`python
2 ** 3 ** 2      # 2 ** (3 ** 2) = 2 ** 9 = 512
(2 ** 3) ** 2    # 8 ** 2        = 64
\`\`\`

That's not Python being quirky — it's how the maths notation works, where the
exponent of an exponent stacks upward.

The point isn't to memorise it. It's that "precedence" is really two questions,
and you've only been asking one:

- which operator goes first? (\`*\` before \`+\`)
- when two are equally tight, which end do we start from? (**associativity**)

Both have answers you can look up, and neither is worth carrying in your head
when a bracket settles it permanently.`,
    code: `print(2 ** 3 ** 2)
print((2 ** 3) ** 2)
print(10 - 3 - 2)`,
  },
}
