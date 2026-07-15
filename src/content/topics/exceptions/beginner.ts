import type { Level } from '../../types'

export const beginner: Level = {
  level: 1,
  blurb: 'An error is a message, not a telling-off. Read the type, the message, the line.',
  concept: {
    body: `When Python hits something it can't do, it stops and tells you why. That
message is not a scolding. It's the most useful output your program produces all
day, and it has exactly three parts:

\`\`\`text
  File "<snippet>", line 4        ← WHERE it gave up
ValueError: invalid literal for int() with base 10: 'n/a'
↑ the TYPE                        ↑ the MESSAGE
\`\`\`

**Read it bottom-up.** The last line is the point; everything above it is the
path Python took to get there.

Three you have already met, without being told their names:

- **NameError** — a name Python has never heard of. A typo, or you used it
  before you made it.
- **TypeError** — right name, *wrong kind of thing*. \`"3" + 4\`.
- **ValueError** — right kind of thing, *wrong value*. \`int("n/a")\` — it **is**
  a string, just not one that spells a number.

Type vs Value is the distinction to actually keep.`,
    aiFraming: `That last distinction is worth more than it looks. **TypeError** means
the *shape* is wrong; **ValueError** means the *contents* are wrong — and those
are the two ways real data breaks a pipeline.

A column that arrived as text when your code expected numbers is a TypeError
kind of problem: one bug, one fix, everything after it works. A column that's
numbers except for the 12 rows where somebody typed "n/a" is a ValueError kind
of problem: the code is right and the *data* is dirty, and no amount of fixing
the code will help.

Reading which one you got tells you where to go looking. Guessing wastes the
afternoon.`,
  },
  watch: {
    code: `readings = ["12", "7", "n/a"]
total = 0
for r in readings:
    total = total + int(r)
print("total:", total)`,
    expectError: 'ValueError',
    notes: {
      4: `\`int(r)\` asks: "read this string as a whole number." For \`"12"\` and \`"7"\` that's
easy. For \`"n/a"\` there is no honest answer — and Python will not invent one. It won't
guess \`0\`, it won't skip it, it won't quietly carry on. It stops.

That refusal is a **feature**. A language that guessed here would hand you a total that
looked fine and was wrong.

And notice what it costs: line 5 never runs. The bad reading doesn't just get skipped —
it ends the **whole program**, including the answer you actually wanted.`,
    },
  },
  predict: {
    code: `readings = ["4", "6", "six"]
print("checking", len(readings), "readings")
total = 0
for r in readings:
    total = total + int(r)
print("total", total)`,
    expectError: 'ValueError',
    question: 'This stops with a ValueError on line 5 — int("six") is impossible. What has it printed by then?',
    choices: [
      'checking 3 readings',
      'total 10',
      'checking 3 readings, then total 10',
      'nothing — the error cancels the whole run',
    ],
    answerIndex: 0,
    explain: `\`checking 3 readings\`.

Two separate things are true, and it's worth holding both:

**The output already out is real.** Line 2 printed before anything went wrong, and
an error later cannot reach back and un-print it. Errors don't roll anything back.

**The output not yet out never happens.** Line 6 is the answer you wanted, and it
never runs — the program ended on line 5. \`total\` got as far as \`10\` and froze
there.

So "how far did it get?" is a real question with a real answer, and the printed
output is the evidence. That's the whole reason people scatter \`print\` around a
program that's crashing.`,
  },
  fix: {
    task: `This crashes with \`TypeError: can only concatenate str (not "int") to str\` on
line 3. Don't guess — read what it's telling you, then make it print \`total is 60\`.`,
    brokenCode: `count = 3
price = 20
print("total is " + price * count)`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
assert not any(isinstance(n, ast.Constant) and n.value in (60, "60", "total is 60") for n in ast.walk(tree)), "Typing the 60 in by hand prints the right answer without fixing the error. Line 3 should still work it out from price and count."
assert __stdout__.strip() == "total is 60", f"It should print 'total is 60', but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      'Read the type first. `TypeError` — the wrong *kind* of thing, not the wrong number. So the arithmetic is fine and `60` is fine. What two kinds is line 3 trying to join together?',
      '`price * count` is an `int`. `"total is "` is a `str`. `+` glues two strings, and it adds two numbers — but between a string and an int it refuses, because it genuinely cannot tell which of those two you meant. That ambiguity is the whole error.',
      '`print("total is " + str(price * count))` — `str()` turns the `60` into `"60"`, so now `+` has two strings and knows what to do. (`print("total is", price * count)` works too: the comma never needed the types to match.)',
    ],
    solution: `count = 3
price = 20
print("total is " + str(price * count))`,
  },
  stretch: {
    title: 'Why the useful line is at the bottom',
    body: `A real error is taller than the one you just read, and the shape confuses
everyone once:

\`\`\`text
Traceback (most recent call last):
  File "app.py", line 40, in <module>
    main()
  File "app.py", line 22, in main
    total = add_up(rows)
  File "app.py", line 9, in add_up
    return total + int(r)
ValueError: invalid literal for int() with base 10: 'n/a'
\`\`\`

"Most recent call **last**" is Python telling you exactly how to read it. The
stack is printed oldest-first, so the frames scroll past in the order they were
called and **the place it actually broke is the last one** — line 9, closest to
the bottom.

So: read the bottom line for *what* went wrong. Read the frame just above it for
*where*. Only if that isn't enough do you walk further up to see who called it
and with what.

Almost everyone reads the top first, sees a filename they don't recognise, and
panics. The answer was two inches lower.`,
  },
}
