import type { Level } from '../../types'

export const fluent: Level = {
  level: 3,
  blurb: 'w truncates, a appends, r is the default — and w destroys.',
  concept: {
    body: `The second argument to \`open\` is the **mode**, and it decides what happens
to a file that already exists.

- \`"r"\` — read. The default. Raises \`FileNotFoundError\` if the file isn't there.
- \`"w"\` — write. Creates the file, and **empties it if it already exists**.
- \`"a"\` — append. Creates the file, and adds to the end if it already exists.

Read that \`"w"\` line again. It doesn't mean "write". It means **start over from
empty**, and it does that the instant you open — before you've written a single
character.

So this destroys the file:

\`\`\`python
f = open("homework.txt", "w")   # gone. all of it.
\`\`\`

Opening with \`"w"\` to "have a look at" a file is the mistake that eats
homework. If you want to look, \`"r"\`. If you want to keep what's there, \`"a"\`.`,
    aiFraming: `Every dataset you ever touch is a file you didn't write and can't
get back. Opening it \`"w"\` by reflex — because \`"w"\` sounds like "work with it" —
truncates it to zero bytes with no warning and no undo.

That's the whole argument for read-only-by-default, and it's why \`"r"\` is the
mode you get when you don't ask for one. Python's default is the safe one. The
damage only happens when you type something.`,
  },
  watch: {
    code: `with open("log.txt", "w") as f:
    f.write("first\\n")
with open("log.txt", "a") as f:
    f.write("second\\n")
with open("log.txt", "w") as f:
    f.write("third\\n")
print(open("log.txt").read())`,
    notes: {
      1: `\`"w"\` on a file that doesn't exist yet: create it, empty. Nothing to destroy —
this is the harmless case, and it's the one that lulls you.`,
      3: `\`"a"\` — append. \`first\` stays put; \`second\` lands after it. The file now has
two lines.`,
      5: `\`"w"\` again, on a file with two lines in it. Both are gone **the moment this
line runs** — before \`write\` is even called. Only \`third\` survives.`,
    },
  },
  predict: {
    code: `with open("log.txt", "a") as f:
    f.write("one\\n")
with open("log.txt", "w") as f:
    f.write("two\\n")
with open("log.txt", "a") as f:
    f.write("three\\n")
print(open("log.txt").read().strip())`,
    question: 'What does this print?',
    choices: ['two\nthree', 'one\ntwo\nthree', 'three', 'one\nthree'],
    answerIndex: 0,
    explain: `\`two\` then \`three\`. \`one\` is gone.

Walk the modes:

- \`"a"\` on a missing file → creates it, writes \`one\`
- \`"w"\` on that file → **wipes it**, then writes \`two\`
- \`"a"\` again → keeps \`two\`, adds \`three\`

The middle line is the one that did the damage, and it looks exactly like the
other two. That's the whole problem with \`"w"\`: it reads like "write" and it
behaves like "delete, then write".`,
  },
  fix: {
    task: `This should write all three entries into \`log.txt\` and print them —
\`boot\`, \`load\`, \`ready\`. Only \`ready\` makes it. Fix it.`,
    brokenCode: `entries = ["boot", "load", "ready"]
for e in entries:
    with open("log.txt", "w") as f:
        f.write(e + "\\n")
print(open("log.txt").read())`,
    check: {
      kind: 'asserts',
      code: `saved = open("log.txt").read()
assert saved == "boot\\nload\\nready\\n", f"log.txt holds {saved!r}. If only the last entry survived, what did opening with \\"w\\" do to the two that were already in there?"
assert __stdout__.strip() == "boot\\nload\\nready", f"It should print all three entries, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      '`"w"` doesn\'t mean "write". It means "empty this file out first" — and the loop opens the file three separate times.',
      'Three passes, three fresh starts. You want the second and third writes to land *after* what\'s already in there, not on top of it.',
      '`open("log.txt", "a")` — append mode. It keeps what\'s there and adds to the end, and it still creates the file on the first pass when nothing exists yet.',
    ],
    solution: `entries = ["boot", "load", "ready"]
for e in entries:
    with open("log.txt", "a") as f:
        f.write(e + "\\n")
print(open("log.txt").read())`,
  },
  stretch: {
    title: 'The mode that refuses',
    body: `There's a fourth mode, and it exists entirely because \`"w"\` is dangerous:

\`\`\`python
open("once.txt", "x")   # create — but only if it isn't there
\`\`\`

\`"x"\` is exclusive creation. If the file already exists it raises
\`FileExistsError\` and touches nothing. Where \`"w"\` shrugs and destroys, \`"x"\`
stops and tells you.

Use it whenever you're writing a result you'd hate to overwrite — a trained
model, an export, a day's scraped data. The crash is the feature. A loud failure
now is worth more than a silently empty file discovered on Thursday.`,
    code: `with open("once.txt", "x") as f:
    f.write("first time\\n")
try:
    with open("once.txt", "x") as f:
        f.write("again\\n")
except FileExistsError:
    print("refused to clobber it")
print(open("once.txt").read().strip())`,
  },
}
