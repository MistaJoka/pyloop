import type { Level } from '../../types'

export const fluent: Level = {
  level: 3,
  blurb: 'f-strings: drop values into text, and round money with :.2f.',
  concept: {
    body: `An \`f\` before the quote turns \`{ }\` into a window onto a value.

\`\`\`python
f"{name} owes {price}"      # Andrae owes 3.5
\`\`\`

Without the \`f\`, that's just braces — printed literally. With it, Python works
out whatever is inside each \`{ }\` and drops the result in.

After a \`:\` you can say **how** it should look:

\`\`\`python
f"\${price:.2f}"     # $3.50  — exactly 2 decimal places
\`\`\`

\`.2f\` means "as a decimal number, 2 places". It rounds, and it *pads* — \`3.5\`
becomes \`3.50\`, which is what money has to look like.

And \`print\` has two dials of its own: \`sep=\` changes what goes **between**
arguments (default: a space), \`end=\` changes what goes **after** (default: a
newline).`,
    aiFraming: `\`f"{x}"\` is a one-way door: a value goes in, text comes out, and the
value is gone.

That's the right move at the very end — a log line, a chart label, a message to
a human. It's the wrong move anywhere else, because \`f"{0.1+0.2:.2f}"\` gives you
\`"0.30"\`, a string, and you cannot do arithmetic on it. Round for display, never
for storage.

The habit to build: keep full-precision numbers in your variables, and format
them at the exact moment they become something a person reads. Every "why is my
total off by a cent" bug is someone who formatted too early.`,
  },
  watch: {
    code: `name = input("Name? ")
price = 3.5
print("{name} owes {price}")
print(f"{name} owes {price}")
print(f"{name} owes \${price:.2f}")
print("a", "b", "c", sep="-")
print("no", end=" ")
print("newline")`,
    stdin: 'Andrae\n',
    notes: {
      3: `No \`f\`, so nothing is special: the braces and the words inside them are printed
exactly as typed. This is what a forgotten \`f\` looks like — no error, just literal
\`{name}\` on the screen.`,
      5: `\`\\$\` is just a dollar sign — it has no meaning to Python, it's plain text sitting
outside the braces. The formatting is the \`:.2f\` **inside** them.

\`3.5\` prints as \`3.50\`: \`.2f\` pads as well as rounds, so every price is the same shape.`,
      6: `\`sep=\` replaces the space \`print\` normally puts between arguments. It's a keyword
argument — it isn't one of the things being printed, it's an instruction about how to print
them.`,
      7: `\`end=\` replaces the newline \`print\` normally adds at the end, with a space here. So
the next \`print\` carries on the same line.`,
    },
  },
  predict: {
    code: `total = 7 / 3
print(f"{total:.2f}", f"{total:.0f}", sep=" | ")`,
    question: 'What does this print?',
    choices: ['2.33 | 2', '2.33 | 2.0', '2.333 | 2', '2.33 2'],
    answerIndex: 0,
    explain: `\`2.33 | 2\`. \`7 / 3\` is \`2.3333...\`; the two f-strings ask for the same
number at two precisions and \`.0f\` means zero decimal places — so \`2\`, rounded,
with no trailing \`.0\`.

Then \`sep=" | "\` replaces the automatic space between the two arguments.

Notice \`total\` itself never changed. It's still \`2.3333...\` in the variables
panel. Formatting made **new text** and left the number alone — which is exactly
the property you want.`,
  },
  fix: {
    task: `With \`Andrae\` typed in, this should print \`Name? Andrae owes $12.50\`. Right now
it prints the braces literally. Fix it.`,
    brokenCode: `name = input("Name? ")
total = 12.5
print("{name} owes \${total}")`,
    stdin: 'Andrae\n',
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
texts = [n.value for n in ast.walk(tree) if isinstance(n, ast.Constant) and isinstance(n.value, str)]
assert not any('Andrae' in t for t in texts), "Andrae is written into the code now — but the program can't know the name until it's typed at the prompt."
assert total == 12.5, f"total is {total!r} now. Leave the number at full precision — rounding the value is a different thing from displaying it rounded. What could change instead is how it gets printed?"
assert __stdout__.strip() == "Name? Andrae owes $12.50", f"Expected 'Name? Andrae owes $12.50' (the prompt prints too), but it was {__stdout__.strip()!r}. Two things are off: are the braces doing anything, and how many decimal places does 12.5 show by default?"`,
    },
    hints: [
      'Braces are only magic in one situation. On line 3 they are printing literally — so whatever makes them magic is missing.',
      'One letter, right before the opening quote. And once the braces work, `12.5` will print as `12.5` — money needs a second decimal place, which is what `:.2f` after the value is for.',
      '`print(f"{name} owes ${total:.2f}")` — the `f` switches the braces on, and `:.2f` shows `total` to exactly two places.',
    ],
    solution: `name = input("Name? ")
total = 12.5
print(f"{name} owes \${total:.2f}")`,
  },
  stretch: {
    title: 'The = trick, and why f-strings won',
    body: `Put \`=\` at the end of an f-string expression and it prints the code as
well as the value:

\`\`\`python
total = 12.5
print(f"{total=}")      # total=12.5
print(f"{total * 2=}")  # total * 2=25.0
\`\`\`

That is the fastest debug print in Python — no more \`print("total", total)\`
where you mislabel one and chase it for ten minutes.

You'll also meet two older ways in real code:

\`\`\`python
"%s owes %.2f" % (name, total)      # C-style, still all over logging
"{} owes {:.2f}".format(name, total)  # .format(), pre-3.6
\`\`\`

They still work and you should be able to read them. Write f-strings.`,
    code: `total = 12.5
print(f"{total=}")
print(f"{total * 2=}")`,
  },
}
