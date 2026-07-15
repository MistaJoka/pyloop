import type { Level } from '../../types'

export const advanced: Level = {
  level: 4,
  blurb: 'split, join, strip, replace, in — turning a line of text into data.',
  concept: {
    body: `Five tools. Together they are most of what you'll ever do to text.

\`\`\`python
"a,b,c".split(",")      # ['a', 'b', 'c']   string  → list
"-".join(["a","b"])     # 'a-b'             list    → string
"  hi  ".strip()        # 'hi'              trims the ENDS only
"a-b".replace("-", " ") # 'a b'
"b" in "abc"            # True
\`\`\`

\`.split()\` and \`.join()\` are opposites. And \`.join()\` **reads backwards to
everyone** the first time, so read it out loud once:

> \`"-".join(parts)\` = "glue, please stitch these parts together with yourself
> in between."

The separator goes first because the separator is the one doing the joining. It's
weird. It's also permanent, so make peace with it now.

The canonical job — a line of text into clean fields:

\`\`\`python
fields = line.strip().split(",")
\`\`\`

Left to right: trim the ends, then cut on commas. Methods return strings, so you
can chain them like that.`,
    aiFraming: `This is the entire first hour of every data project. Real data
arrives as text — a CSV row, a log line, a scraped page — and it is **not data
yet**. It's text that has to be cleaned into data, and \`.strip()\` and
\`.split()\` do the bulk of that cleaning.

The reason to care about a stray space: to a language model, \`" cat"\` and
\`"cat"\` are **different tokens**, with different ids. Not similar — different.
Leave the space on and you've handed the model a token it barely knows instead of
one it has seen a billion times. One invisible character, measurably worse
results. \`.strip()\` is not tidying. It's correctness.`,
  },
  watch: {
    code: `line = "  ana, 90, math  "
fields = line.strip().split(",")
print(fields)
clean = []
for f in fields:
    clean.append(f.strip())
print(clean)
print(" | ".join(clean))`,
    notes: {
      2: `Two calls, left to right. \`.strip()\` cuts the whitespace off **each end** of the
whole line (never the middle), and hands back a new string — then \`.split(",")\` cuts *that*
on every comma and hands back a **list**.

Chaining works because each method returns a string for the next one to act on.`,
      6: `\`.strip()\` on the line only trimmed the two outer ends. The spaces after each
comma are still glued to the fields — look at \`fields\` in the panel: \`' 90'\`, not \`'90'\`.

So every field gets stripped individually. This loop is the single most-written loop in
data work.`,
      8: `\`.join()\` read backwards: the **separator** is the string you call it on, and the
list goes inside. \`" | ".join(clean)\` = "stitch these together with ' | ' between them".

It only works on a list of strings. One number in there and it raises TypeError.`,
    },
  },
  predict: {
    code: `parts = "a,b,c".split(",")
print("-".join(parts))`,
    question: 'What does this print?',
    choices: ['a-b-c', '-a-b-c', 'abc', "['a', 'b', 'c']"],
    answerIndex: 0,
    explain: `\`a-b-c\`. Two steps that undo each other with a different glue.

\`split(",")\` cuts \`"a,b,c"\` into \`['a', 'b', 'c']\` — the commas are **consumed**,
they don't survive into the pieces. Then \`"-".join(parts)\` stitches those three
back into one string, putting \`-\` **between** them.

Between, note — not before each one. Three items, two gaps, two dashes. Which is
why the answer isn't \`-a-b-c\`.`,
  },
  fix: {
    task: `This should turn the row into clean fields and print \`ana|90|math\`. Instead it
prints \` ana | 90 | math \` — every field still wearing spaces. Fix it.`,
    brokenCode: `row = " ana , 90 , math "
fields = row.split(",")
print("|".join(fields))`,
    check: {
      kind: 'asserts',
      code: `assert __stdout__.strip() == "ana|90|math", f"It printed {__stdout__.strip()!r}. Splitting on ',' cuts at the commas and nothing else — so the spaces around each field went into the field. What has to happen to each one before you join?"`,
    },
    hints: [
      "`row.split(\",\")` cuts on commas only. Look at what each piece actually contains — the spaces didn't go anywhere, they just moved inside the fields.",
      'You need `.strip()` on *every field*, not on the row. Loop over `fields`, strip each one, build a new list — then join that.',
      'Build it up: `clean = []`, then `for f in fields: clean.append(f.strip())`, then `print("|".join(clean))`.',
    ],
    solution: `row = " ana , 90 , math "
fields = row.split(",")
clean = []
for f in fields:
    clean.append(f.strip())
print("|".join(clean))`,
  },
  stretch: {
    title: 'split() with nothing in it is a different function',
    body: `\`.split(" ")\` and \`.split()\` look like the same call with a default. They are
not remotely the same:

\`\`\`python
messy = "  ana   bo  "
messy.split()      # ['ana', 'bo']
messy.split(" ")   # ['', '', 'ana', '', '', 'bo', '', '']
\`\`\`

With **no argument**, \`.split()\` cuts on any run of whitespace — spaces, tabs,
newlines, however many in a row — and throws away the empties. With \`" "\`, it
cuts on *every single space*, and every gap between two adjacent spaces becomes
an empty string \`''\`.

For messy human-typed text, bare \`.split()\` is almost always the one you want.
For structured data with a real delimiter — \`.split(",")\` — you want the strict
version, because there an empty field is **information**: it means the column was
blank, and silently dropping it would shift every field after it by one.`,
    code: `messy = "  ana   bo  "
print(messy.split())
print(messy.split(" "))`,
  },
}
