import type { Level } from '../../types'

export const working: Level = {
  level: 2,
  blurb: 'with open(...) — the block that closes the file for you.',
  concept: {
    body: `\`.close()\` is the line everyone forgets. So Python gave you a block that
can't forget:

\`\`\`python
with open("scores.txt", "w") as f:
    f.write("90\\n")
# file is closed here — automatically
\`\`\`

When the indented block ends, the file is closed. **Even if the code inside
crashes.** That's the real reason \`with\` exists: an error halfway through your
writing still leaves a properly closed file behind.

Why care? Because \`write\` doesn't go straight to disk — it lands in a buffer,
and closing is what empties the buffer out. Forget to close and your text can
quietly never arrive.

Reading has a matching shape, and it goes one line at a time:

\`\`\`python
with open("scores.txt") as f:
    for line in f:
        print(line.strip())
\`\`\``,
    aiFraming: `\`for line in f\` is the shape every real data tool is built on.
The file is handed to you a line at a time rather than all at once, which is what
lets you read a 40GB log on a laptop with 16GB of memory.

And \`with\` is the same promise every connection, every session, every open
resource makes: it gets cleaned up whether or not your code goes well. You'll see
it again the first time you open a database or a model checkpoint. Same block,
same reason.`,
  },
  watch: {
    code: `with open("scores.txt", "w") as f:
    f.write("90\\n")
    f.write("85\\n")

with open("scores.txt") as f:
    for line in f:
        print(line.strip())`,
    notes: {
      1: `Open the file and call it \`f\` **for the length of this block only**. When the
indentation ends, Python closes it for you — including if something in the block raises.`,
      5: `No mode means read. Same block, same promise: closed on the way out.`,
      6: `Ask a file for its lines and it hands them over one at a time — it never has to
hold the whole file in memory. This works on a two-line file and on a 40GB one, unchanged.`,
      7: `Each \`line\` still has its \`\\n\` on the end, because that's literally what's in
the file. \`.strip()\` takes it off. If you print without stripping, you get blank lines
between everything.`,
    },
  },
  predict: {
    code: `f = open("data.txt", "w")
f.write("hello")
print(repr(open("data.txt").read()))`,
    question: 'What does this print?',
    choices: ["''", "'hello'", "'hello\\n'", 'FileNotFoundError'],
    answerIndex: 0,
    explain: `\`''\` — an empty string. The file exists, and it's empty.

\`f.write("hello")\` didn't put \`hello\` on the disk. It put it in a **buffer** in
memory, because writing to disk one small piece at a time is slow. The buffer is
emptied out when the file is closed — and nothing here ever closes it.

Not \`FileNotFoundError\`: \`open(..., "w")\` creates the file immediately. It's
there. It's just empty, which is worse, because it looks like it worked.

This is exactly the bug \`with\` exists to make impossible.`,
  },
  fix: {
    task: `This should leave \`out.txt\` holding \`done\`, but the file comes out empty.
Fix it — and use a \`with\` block, so it can't happen again.`,
    brokenCode: `f = open("out.txt", "w")
f.write("done")
print("wrote it")`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
saved = open("out.txt").read()
assert saved == "done", f"out.txt holds {saved!r}, not 'done'. write() puts the text in a buffer first — what has to happen before the buffer reaches the file?"
assert any(isinstance(n, ast.With) for n in ast.walk(tree)), "The content is right now. But is closing the file something you want to depend on remembering? There's a block form that does it for you."
assert __stdout__.strip() == "wrote it", f"It should still print 'wrote it', but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      "`f.write(...)` doesn't reach the file straight away — it sits in a buffer. The buffer is emptied when the file is closed, and nothing here closes it.",
      "You could add `f.close()` at the end. It would work — and it's the exact line people forget, and it gets skipped entirely if anything raises before it. Python has a block form that closes for you no matter what.",
      '`with open("out.txt", "w") as f:` and indent the `write` underneath it. When the block ends — normally or by crashing — the file is closed.',
    ],
    solution: `with open("out.txt", "w") as f:
    f.write("done")
print("wrote it")`,
  },
  stretch: {
    title: 'Even when it crashes',
    body: `The buffer argument is the easy half. Here's the real one:

\`\`\`python
with open("t.txt", "w") as f:
    f.write("saved anyway")
    raise ValueError("boom")
\`\`\`

The code blows up on the second line inside the block. \`f.close()\` — if you'd
written it after the block — would never run. But the text is still in the file.

That's what \`with\` guarantees: leaving the block **by any route at all**, error
included, closes the file. A hand-written \`close()\` only covers the route where
nothing went wrong, which is the one route you didn't need protecting.`,
    code: `try:
    with open("t.txt", "w") as f:
        f.write("saved anyway")
        raise ValueError("boom")
except ValueError:
    pass
print(open("t.txt").read())`,
  },
}
