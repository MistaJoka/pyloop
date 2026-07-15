import type { Level } from '../../types'

export const master: Level = {
  level: 5,
  blurb: 'A file is a stream, not a value — read it twice and get nothing.',
  concept: {
    body: `A file isn't a string sitting in a variable. It's a **stream**, and an open
file remembers **where it got to**.

\`\`\`python
f = open("data.txt")
first = f.read()    # everything
second = f.read()   # ''
\`\`\`

Not a bug. \`.read()\` consumed the file and left the position at the end. There's
nothing after the end, so the second read is empty. \`f.tell()\` shows you the
position; \`f.seek(0)\` rewinds it.

That position is also what makes this cheap:

\`\`\`python
for line in f:      # one line in memory at a time
\`\`\`

\`.read()\` pulls the entire file into memory at once — fine for 2KB, fatal for
2GB. \`for line in f\` reads to the next \`\\n\`, hands it over, and forgets it.
The file can be bigger than your RAM and it simply doesn't matter.

**One pass. Do everything you need in it.**`,
    aiFraming: `\`df = pd.read_csv("data.csv")\` is one line that hides every single
thing in this topic: the open, the mode, the stream, the newline, the split, the
type guess, the close. That's the deal — and it's a good deal, right up until it
isn't.

The moment it breaks — memory error on a big file, a column of strings where you
wanted numbers, a header row that turned into data — you're back here, at
\`for line in f\`. You'll reach for \`read_csv\` every time. You'll debug it with
what's on this page.`,
  },
  watch: {
    code: `with open("data.txt", "w") as f:
    f.write("alpha\\nbeta\\n")

f = open("data.txt")
first = f.read()
second = f.read()
print(repr(first))
print(repr(second))
print(f.tell())
f.close()`,
    notes: {
      5: `Reads the whole file and moves the position to the end. \`first\` now holds every
character — including both \`\\n\`s.`,
      6: `The **exact same call**, and it comes back empty. The position is at the end of
the file and there is nothing after the end.

This is the surprise worth carrying: a file is a stream you walk through once, not a value
you can ask for twice.`,
      9: `\`.tell()\` is the position, in characters, counting from 0. \`11\` is the end —
that's the whole file behind us. \`f.seek(0)\` would put it back to the start and let you
read it all again.`,
    },
  },
  predict: {
    code: `with open("d.txt", "w") as f:
    f.write("a\\nb\\n")
f = open("d.txt")
print(len(f.readlines()))
print(len(f.readlines()))
f.close()`,
    question: 'What does this print?',
    choices: ['2\n0', '2\n2', '0\n0', '4'],
    answerIndex: 0,
    explain: `\`2\`, then \`0\`.

The first \`.readlines()\` walks the file to the end and hands back both lines. The
second one starts from where the first one stopped — which is the end. Nothing
left. Empty list. Length 0.

No error, no warning. Just an empty result that looks exactly like an empty file.

This is the bug that gets written as "my second loop over the file never runs".
It ran. There was nothing in front of it. \`f.seek(0)\` rewinds, or better: **make
one pass do the work**.`,
  },
  fix: {
    task: `This should count the numbers in \`nums.txt\` and total them — \`3 60\`. It
prints \`3 0\`. Fix it.`,
    brokenCode: `with open("nums.txt", "w") as f:
    f.write("10\\n20\\n30\\n")

f = open("nums.txt")
count = len(f.readlines())
total = 0
for line in f:
    total = total + int(line)
f.close()
print(count, total)`,
    check: {
      kind: 'asserts',
      code: `assert count == 3, f"count came out as {count}, expected 3 — one per line."
assert total == 60, f"total came out as {total}, expected 60 (10+20+30). If it's 0 the loop body never ran once: by the time the 'for' started, where in the file was the read position?"
assert __stdout__.strip() == "3 60", f"It should print '3 60', but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      "`f.readlines()` didn't copy the file — it *consumed* it. The read position is now at the end, and `for line in f` picks up from wherever the position is. There's nothing in front of it.",
      "You could add `f.seek(0)` to rewind and get a second pass. But you don't need two passes at all: one walk over the lines can count *and* total at the same time.",
      'Drop the `readlines()` entirely. Start `count = 0` and `total = 0`, then inside `for line in f:` do both jobs: `count = count + 1` and `total = total + int(line)`.',
    ],
    solution: `with open("nums.txt", "w") as f:
    f.write("10\\n20\\n30\\n")

count = 0
total = 0
with open("nums.txt") as f:
    for line in f:
        count = count + 1
        total = total + int(line)
print(count, total)`,
  },
  stretch: {
    title: 'And then it becomes one line',
    body: `Here's the whole topic, collapsed:

\`\`\`python
import pandas as pd
df = pd.read_csv("scores.csv")
print(df["score"].sum())
\`\`\`

Three lines. No \`open\`, no mode, no \`\\n\`, no \`split\`, no \`int\`, no \`close\`,
no read position. It does all of it, and it does it better than you would — it
handles quoted commas, Windows line endings, missing values and a dozen encodings
you've never heard of.

So why did you just spend five levels doing it by hand?

Because \`read_csv\` makes **guesses**, and when a guess is wrong it doesn't crash
— it hands you data that's subtly not what you asked for. A score column that's
strings. A header row parsed as a record. A zip code with the leading zero
stripped off. Every one of those is a decision one of these five levels made
explicitly and \`read_csv\` made for you.

You can't debug a guess you don't know is being made. That's what Master means
here: not that you'll ever parse a CSV by hand again — that when \`read_csv\`
lies to you, you'll know exactly where to look.`,
  },
}
