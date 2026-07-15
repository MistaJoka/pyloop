import type { Level } from '../../types'

export const beginner: Level = {
  level: 1,
  blurb: 'open, write, close — and write does not add a newline.',
  concept: {
    body: `A file on disk is text you can put down and pick back up later.

\`\`\`python
f = open("note.txt", "w")
f.write("hello")
f.close()
\`\`\`

Three steps. \`open\` with \`"w"\` makes the file (and hands you a **file object**,
not the text). \`.write\` puts characters into it. \`.close\` finishes the job.

To read it back, \`open\` with no mode and \`.read()\`:

\`\`\`python
text = open("note.txt").read()
\`\`\`

The one thing that surprises everyone: **\`write\` does not add a newline.**
\`print\` does that for you silently. \`write\` puts down exactly the characters
you hand it and nothing else — so two writes land side by side on one line.`,
    aiFraming: `The first step of every data project is reading a file you didn't
write. Not a list you typed out — a file some other system produced, with its own
ideas about spacing and line endings.

That's where the time actually goes. Not the model, not the maths: a stray
newline on the end of every value. You're looking at the raw material of that
problem right now, from the other side — you're the one putting the characters
down, so you can see exactly what does and doesn't get added for you.`,
  },
  watch: {
    code: `f = open("note.txt", "w")
f.write("hello")
f.write("world")
f.close()
text = open("note.txt").read()
print(text)`,
    notes: {
      1: `\`"w"\` means write mode: create \`note.txt\`, empty. What comes back is a **file
object**, not the text — \`f\` is a handle you write through, more like an open drawer than
a value.`,
      2: `Puts down exactly \`hello\`. No newline, no space, nothing you didn't ask for.
That's the difference from \`print\`.`,
      4: `Closes the drawer. Until this happens, what you wrote may still be sitting in a
buffer in memory rather than in the file.`,
      5: `\`open\` with no mode means read. \`.read()\` hands back the whole file as one
string — and \`hello\` and \`world\` are stuck together, because nothing ever put a line
break between them.`,
    },
  },
  predict: {
    code: `f = open("log.txt", "w")
f.write("a")
f.write("b")
f.write("c")
f.close()
print(open("log.txt").read())`,
    question: 'What does this print?',
    choices: ['abc', 'a\nb\nc', 'c', 'a b c'],
    answerIndex: 0,
    explain: `\`abc\`. Three writes, one line.

\`write\` isn't \`print\`. It doesn't add a newline, it doesn't add a space, it
doesn't add anything — it puts down the characters you gave it and stops.

Not \`c\` either: each \`write\` carries on from where the last one finished. It's
one long stream of characters, and you decide where the lines break by putting
\`\\n\` in yourself.`,
  },
  fix: {
    task: `This should leave \`pets.txt\` holding two lines — \`cat\`, then \`dog\`. Instead
the file comes out as \`catdog\` on one line. Fix it.`,
    brokenCode: `f = open("pets.txt", "w")
f.write("cat")
f.write("dog")
f.close()
print(open("pets.txt").read())`,
    check: {
      kind: 'asserts',
      code: `contents = open("pets.txt").read()
assert contents.startswith("cat\\n"), f"pets.txt holds {contents!r}. print() ends a line for you; write() puts down exactly what you hand it. So what character has to be in there for a line to end?"
assert contents.rstrip("\\n") == "cat\\ndog", f"pets.txt holds {contents!r}, but it should be the line 'cat' followed by the line 'dog'."`,
    },
    hints: [
      '`print` ends the line for you. `write` does not — it puts down exactly the characters you hand it and nothing more.',
      'Two lines means there is a line-break character sitting between them. In Python that character is `\\n`.',
      '`f.write("cat\\n")` and `f.write("dog\\n")` — you supply the newline yourself, as part of the text.',
    ],
    solution: `f = open("pets.txt", "w")
f.write("cat\\n")
f.write("dog\\n")
f.close()
print(open("pets.txt").read())`,
  },
  stretch: {
    title: 'write hands you something back',
    body: `\`write\` returns the number of characters it put down:

\`\`\`python
n = f.write("hello")   # n is 5
\`\`\`

Nobody uses that day to day, but it's a useful thing to see once, because it
tells you what \`write\` thinks its job is: **characters in, count out.** Five
characters asked for, five characters written. Not six. There is no newline
hiding in there.

If you ever doubt what actually landed in a file, this is the honest answer.`,
    code: `f = open("n.txt", "w")
print(f.write("hello"))
f.close()`,
  },
}
