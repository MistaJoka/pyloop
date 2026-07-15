import type { Level } from '../../types'

export const advanced: Level = {
  level: 4,
  blurb: 'Parse a CSV by hand — strip the newline, split on the comma.',
  concept: {
    body: `A text file has no rows and no columns. It has **characters**, and some of
them are \`\\n\`. "Lines" is an agreement, not a fact.

So reading real data is always the same three moves:

\`\`\`python
for line in f:                          # "ana,90\\n"
    parts = line.strip().split(",")     # ["ana", "90"]
    rows.append({"name": parts[0], "score": int(parts[1])})
\`\`\`

1. **\`.strip()\`** — take the \`\\n\` off. It's still there. Reading never removes
   it, and the last field on every line carries it.
2. **\`.split(",")\`** — cut the line into fields. You get a list of **strings**.
3. **\`int(...)\`** — \`"90"\` is not \`90\`. The file has no idea what a number is.

Miss step 1 and your last column is \`"90\\n"\`. Miss step 3 and \`"9"\` sorts
after \`"85"\`, because that's how text compares.`,
    aiFraming: `This is the loop \`pandas.read_csv\` runs for you, and it is genuinely
about a thousand lines long — because every one of those three steps has a dozen
edge cases. What if a field *contains* a comma? What if the first line is a
header? What if the file was saved on Windows and every line ends \`\\r\\n\`?

You'll use \`read_csv\` for the rest of your life and you should. But when it hands
back a column of strings where you expected numbers, or a first row full of
column names, you'll know exactly which of these three steps it made a different
guess about than you did. That's the whole reason to write it once by hand.`,
  },
  watch: {
    code: `with open("people.csv", "w") as f:
    f.write("ana,90\\n")
    f.write("bo,85\\n")

rows = []
with open("people.csv") as f:
    for line in f:
        parts = line.strip().split(",")
        rows.append({"name": parts[0], "score": int(parts[1])})
print(rows)`,
    notes: {
      7: `Watch \`line\` in the variables panel: it's \`'ana,90\\n'\`. The newline is part of
the string — it's what made this a line in the first place.`,
      8: `Two jobs, right to left. \`.strip()\` removes the \`\\n\` (and any stray spaces)
from both ends; \`.split(",")\` cuts what's left into \`['ana', '90']\`.

Both of those are **strings**. \`split\` doesn't know what a number is.`,
      9: `\`int(parts[1])\` is the step that turns text into a number. Skip it and \`score\`
is \`'90'\` — which prints identically and behaves nothing alike.`,
    },
  },
  predict: {
    code: `with open("n.txt", "w") as f:
    f.write("10\\n")
    f.write("20\\n")
lines = open("n.txt").readlines()
print(lines)`,
    question: 'What does this print?',
    choices: ["['10\\n', '20\\n']", "['10', '20']", '[10, 20]', "['10\\n20\\n']"],
    answerIndex: 0,
    explain: `\`['10\\n', '20\\n']\`. The newlines are **still there**.

\`.readlines()\` splits the file into lines — but it splits *after* each \`\\n\`, it
doesn't remove them. Every string in that list still ends in one.

And they're strings, not numbers: \`'10'\`, not \`10\`. A file is characters. It
has no opinion about types.

This is why \`.strip()\` shows up in every parsing loop you will ever read. The
newline is the thing that got you here and it doesn't leave on its own.`,
  },
  fix: {
    task: `This should read the file back into a list of dicts —
\`[{'name': 'ana', 'score': 90}, {'name': 'bo', 'score': 85}]\` — with the scores
as real numbers. It's close, but the dicts come out wrong. Fix it.`,
    brokenCode: `with open("scores.csv", "w") as f:
    f.write("ana,90\\n")
    f.write("bo,85\\n")

rows = []
with open("scores.csv") as f:
    for line in f:
        parts = line.split(",")
        rows.append({"name": parts[0], "score": parts[1]})
print(rows)`,
    check: {
      kind: 'asserts',
      code: `assert isinstance(rows, list), f"rows should be a list of dicts, but it's a {type(rows).__name__}."
assert len(rows) == 2, f"rows has {len(rows)} item(s), expected 2 — one dict per line of the file."
assert rows == [{"name": "ana", "score": 90}, {"name": "bo", "score": 85}], f"rows came out as {rows!r}. Look hard at the score values: what type are they, and is there a character stuck on the end that came from the file?"
assert __stdout__.strip() == "[{'name': 'ana', 'score': 90}, {'name': 'bo', 'score': 85}]", f"It should print the list of dicts, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      'Print one `line` on its own before you split it. Every line the file hands you still has its `\\n` on the end — reading never takes it off, so it ends up inside the last field.',
      '`.strip()` removes that newline from the ends of the line. And `parts[1]` is text: `\'90\'` is a string, not the number `90`.',
      '`parts = line.strip().split(",")` to clean the line first, then `int(parts[1])` for the score.',
    ],
    solution: `with open("scores.csv", "w") as f:
    f.write("ana,90\\n")
    f.write("bo,85\\n")

rows = []
with open("scores.csv") as f:
    for line in f:
        parts = line.strip().split(",")
        rows.append({"name": parts[0], "score": int(parts[1])})
print(rows)`,
  },
  stretch: {
    title: 'The stdlib already did this',
    body: `Python ships a \`csv\` module, and \`DictReader\` does the whole loop — reads
the header row, strips the newline, splits on the comma, and hands you a dict per
row with the column names already as keys:

\`\`\`python
import csv
with open("s.csv") as f:
    for row in csv.DictReader(f):
        print(row["name"], row["score"])
\`\`\`

Note what it *doesn't* do: \`row["score"]\` is still the string \`'90'\`. Even the
stdlib won't guess at your types.

That last part is the one \`pandas.read_csv\` does take on — it looks at the column
and decides it's numeric. Which is wonderful, right up until it meets a column of
zip codes and helpfully deletes the leading zeros.`,
    code: `import csv
with open("s.csv", "w") as f:
    f.write("name,score\\n")
    f.write("ana,90\\n")
with open("s.csv") as f:
    for row in csv.DictReader(f):
        print(row["name"], row["score"])`,
  },
}
