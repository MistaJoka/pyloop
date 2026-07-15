import type { Level } from '../../types'

export const fluent: Level = {
  level: 3,
  blurb: 'Strings are immutable — methods return a new string, they never change yours.',
  concept: {
    body: `A string, once made, **can never be changed**. Not renamed, not edited, not
one character swapped out. This is real:

\`\`\`python
s = "hello"
s[0] = "H"     # TypeError. Always.
\`\`\`

So what does \`s.upper()\` do? It **builds a brand new string** and hands it back.
Your original is untouched:

\`\`\`python
s = "hello"
s.upper()      # makes "HELLO"... and throws it away
print(s)       # hello
\`\`\`

That line looks like it did something. It did — it just dropped the result on the
floor, because nothing caught it.

\`\`\`python
s = s.upper()  # NOW s is "HELLO"
\`\`\`

You've met this rule before: **if the result isn't stored, it didn't happen.**
Here it applies to every string method there is — \`.upper()\`, \`.strip()\`,
\`.replace()\`, all of them. They return. They never modify.`,
    aiFraming: `This is the bug you will write, and the one you'll spend an hour not
finding, because there's no error message. A cleaning step like
\`text.strip()\` sitting on its own line runs perfectly, changes nothing, and your
"cleaned" data goes into the model still filthy.

No traceback, no warning, no red. The pipeline succeeds and the results are just
quietly worse. When a data-cleaning step seems to have done nothing, this is the
first thing to check — did you *store* it?`,
  },
  watch: {
    code: `s = "hello"
s.upper()
print(s)
louder = s.upper()
print(louder)
print(s)`,
    notes: {
      2: `This runs. It really does build \`"HELLO"\`. And then the line ends, nobody caught
the result, and it's gone forever.

No error, no warning — Python is happy to compute something and throw it away. Watch \`s\`
in the panel: it doesn't flinch.`,
      4: `Same call, but now the answer is **caught** in a name. That's the entire
difference between line 2 and line 4.

And notice \`s\` is *still* \`"hello"\` afterwards. \`.upper()\` didn't touch it — it built a
second, separate string and handed it over.`,
    },
  },
  predict: {
    code: `name = "ana"
name.upper()
print(name)`,
    question: 'What does this print?',
    choices: ['ana', 'ANA', 'None', 'Ana'],
    answerIndex: 0,
    explain: `\`ana\`. Unchanged.

\`name.upper()\` did its job — it made the string \`"ANA"\`. But that value was
never assigned to anything, so it vanished the instant the line finished.
\`name\` was never in the conversation; strings can't be edited in place, so
\`.upper()\` had no way to touch it even if it wanted to.

If you expected \`ANA\`, you're reading \`.upper()\` as a **command** — "go
uppercase this thing". It isn't. It's a **question** — "what would this look like
uppercased?" — and the answer is worthless unless you write it down.`,
  },
  fix: {
    task: `This should print \`HELLO\` — but it prints \`hello\`. The \`.upper()\` call is
right there and it runs. Work out why nothing changed, and fix it.`,
    brokenCode: `greeting = "hello"
greeting.upper()
print(greeting)`,
    check: {
      kind: 'asserts',
      code: `assert __stdout__.strip() == "HELLO", f"It printed {__stdout__.strip()!r}. Line 2 definitely built the string 'HELLO' — so where did it go? Who caught it?"`,
    },
    hints: [
      '`greeting.upper()` on line 2 is not a command. It computes an answer and returns it — and then the line ends. Where did that answer go?',
      "Strings can't be modified, so `.upper()` had no way to change `greeting`. It made a *second* string. If you want to keep it, you have to catch it in a name.",
      '`greeting = greeting.upper()` — take what came back and store it. (Printing `greeting.upper()` directly works too: same rule, you just caught it with `print` instead of a name.)',
    ],
    solution: `greeting = "hello"
greeting = greeting.upper()
print(greeting)`,
  },
  stretch: {
    title: 'What the TypeError actually says',
    body: `Try to edit a string in place and Python is blunt about it:

\`\`\`python
s = "hello"
s[0] = "H"
# TypeError: 'str' object does not support item assignment
\`\`\`

"Does not support item assignment" is Python for *this thing is read-only,
forever*.

That sounds like a limitation. It's a feature you'll be grateful for: because a
string can never change under your feet, it's safe to hand the same one to twenty
different functions, and safe to use as a dictionary key. A list can't be a
dict key for exactly this reason — someone could edit it and the key would go
stale.

The move, when you want a "changed" string, is always the same: build a new one
and rebind the name. \`s = s.replace("l", "L")\`. The old string isn't edited —
it's abandoned.`,
    code: `s = "hello"
try:
    s[0] = "H"
except TypeError as e:
    print("TypeError:", e)
print(s.replace("l", "L"))`,
  },
}
