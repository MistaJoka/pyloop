import type { Level } from '../../types'

export const master: Level = {
  level: 5,
  blurb: 'Output is data, not decoration — printing is the last step, not the result.',
  concept: {
    body: `A field width turns text into a column:

\`\`\`python
f"{item:<8}{qty:>4}"     # 'kiwi      12'  — always 12 characters wide
\`\`\`

\`<8\` means left-aligned, padded to 8. \`>4\` means right-aligned in 4. Whatever
the value, the width is fixed — so stack two of them and they line up. That's a
table.

But notice what that expression **is**: a \`str\`. A value. You can store it,
measure it, compare it, put it in a list. \`print\` doesn't make it — \`print\` only
sends it to a screen.

That gap matters, because \`print\` is a dead end. Text on a screen can't be
tested, summed, or passed on. The moment your program's answer only exists as
something you printed, it isn't an answer any more — it's a photograph of one.`,
    aiFraming: `This is why \`print\` debugging stops scaling, and why the fix isn't
"print better".

Scatter prints through a script and you get a wall of text that you, personally,
have to read. Every question ("which rows failed?", "how many?") means editing
the code and running it again. Compare that to holding the answer as a value:
you filter it, count it, chart it, and never touch the program.

It's the same reason a notebook cell shows you the last **expression** rather
than what you printed, and the same reason a pipeline stage **returns** a
dataframe instead of printing one. Downstream code consumes values. Humans
consume text.

So: compute the value, keep the value, and format it once at the very edge,
where a human is standing. Print is I/O, not output.`,
  },
  watch: {
    code: `header = f"{'item':<8}{'qty':>4}"
row1 = f"{'apple':<8}{3:>4}"
row2 = f"{'kiwi':<8}{12:>4}"
print(header)
print(row1)
print(row2)
print(len(header), len(row1), len(row2))`,
    notes: {
      1: `Two windows, both with a width. \`:<8\` pads \`'item'\` out to 8 characters on the left,
\`:>4\` pushes \`'qty'\` to the right of a 4-wide space.

The single quotes inside the double-quoted f-string are just how you put a literal string
in a window — Python needs the two kinds of quote to not collide.`,
      3: `Same widths, a much shorter word and a longer number — and it still comes out 12
characters. That's the whole point of a field width: the shape is fixed by the format, not
by the data.`,
      7: `The proof. Three different rows, three identical lengths — which is *why* they line
up on screen.

And look at what's in the variables panel: three strings, sitting there as values, before
anything got printed. The table existed before the screen did.`,
    },
  },
  predict: {
    code: `price = 1.5
label = f"\${price:.2f}"
print(label + label, len(label))`,
    question: 'What does this print?',
    choices: ['$1.50$1.50 5', '$1.50$1.50 10', '$1.5$1.5 4', '3.0 5'],
    answerIndex: 0,
    explain: `\`$1.50$1.50 5\`. The f-string produced \`"$1.50"\` — a 5-character string —
and \`label\` is holding it like any other value.

So \`label + label\` joins text (\`$1.50$1.50\`), and \`len(label)\` is 5, not 10:
\`len\` is measuring \`label\` itself, not the joined copy.

The move worth noticing: formatting happened on line 2, and then line 3 did
ordinary string work on the result. Nothing about \`f\` is print-only. It builds a
value, and values are things you can keep working with.`,
  },
  fix: {
    task: `This should build one receipt row — the item padded to 8 characters, the quantity
right-aligned in 4 — store it in \`row\`, and print it. It should print
\`kiwi      12\` (12 characters wide). It prints \`kiwi 12\` instead.`,
    brokenCode: `item = "kiwi"
qty = 12
row = item + " " + str(qty)
print(row)`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
assert 'row' in dir(), "There's no variable called row anymore — the row has to exist as a value, not just as something printed."
assert isinstance(row, str), f"row is {row!r} — a row of a table is text, laid out."
assert any(isinstance(n, ast.JoinedStr) for n in ast.walk(tree)), "The padding looks typed in by hand. Count the spaces for an item called 'watermelon' and you'll see why that doesn't hold. What syntax says 'this value, padded to 8'?"
assert len(row) == 12, f"row is {row!r} — that's {len(row)} characters. Rows only line up if every row is the same width no matter what's in it. 8 for the item plus 4 for the quantity is how many?"
assert row == "kiwi      12", f"row is {row!r}, expected 'kiwi      12' — the item left-aligned in 8, then the quantity right-aligned in 4."
assert __stdout__.strip() == "kiwi      12", f"It should print the row, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      'Joining with a single space is what makes this fragile: the width now depends on how long the word happens to be. A column needs a width that does not care.',
      'An f-string window takes a width after the `:` — `{item:<8}` is left-aligned in 8, `{qty:>4}` is right-aligned in 4. Note you also stop needing `str()`; a window converts for you.',
      '`row = f"{item:<8}{qty:>4}"` — the two windows sit right next to each other, no separator needed, because the padding *is* the separator.',
    ],
    solution: `item = "kiwi"
qty = 12
row = f"{item:<8}{qty:>4}"
print(row)`,
  },
  stretch: {
    title: 'The whole ladder, in one habit',
    body: `Look back at what changed. Level 1: text goes out, text comes in. Level 5: the
text was never the point — the value was, and text is just what you make at the
last moment for the human standing there.

That's why the widths go in the format and not in the data. The \`row\` you built
is presentation; \`item\` and \`qty\` are the facts. Keep the facts.

\`\`\`python
# printing: the answer exists for one second, on your screen
print(f"{item:<8}{qty:>4}")

# returning: the answer exists, full stop
rows = [(item, qty), ("apple", 3)]      # the data
"\\n".join(f"{i:<8}{q:>4}" for i, q in rows)   # the picture of it
\`\`\`

Real pipelines look like the second one all the way down, and only the very last
stage — a notebook cell, a log line, a chart axis — ever renders. \`pandas\`
follows this exactly: \`df.head()\` **returns** a dataframe and the notebook
happens to display it. It never printed anything.

Widths worth knowing: \`^\` centres, \`{n:>8,}\` adds thousands separators,
\`{p:>6.1%}\` formats a proportion as a percentage.`,
    code: `n = 1234567
p = 0.0873
print(f"{'total':^12}|")
print(f"{n:>12,}|")
print(f"{p:>12.1%}|")`,
  },
}
