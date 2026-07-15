import type { Level } from '../../types'

export const beginner: Level = {
  level: 1,
  blurb: 'A string is a sequence of characters — and it counts from zero.',
  concept: {
    body: `A string isn't one blob of text. It's a **row of characters**, each one
sitting at a numbered position.

\`\`\`python
word = "python"
#       012345
\`\`\`

\`len(word)\` tells you how many there are — \`6\`. And you reach for any single
one with square brackets:

\`\`\`python
word[0]   # "p"  ← the FIRST one
word[1]   # "y"
\`\`\`

The counting starts at **zero**. So the last character of a 6-letter word is at
position \`5\`, not \`6\`. That's the whole tax you pay for zero-based counting,
and Python hands you a refund: **negative indexes count back from the end**.

\`\`\`python
word[-1]  # "n"  ← the LAST one, whatever the length
\`\`\`

\`word[-1]\` is the one to burn in. You will use it constantly.`,
    aiFraming: `Zero-based indexing isn't a Python quirk — it's the convention
everywhere you're headed. Row 0 is the first row of a dataset. Token 0 is the
first token of a prompt. Layer 0 is the input layer.

The habit worth building now is reading \`[0]\` as "first" and \`[-1]\` as "last"
without doing arithmetic in your head. \`output[-1]\` — the last token the model
produced — is a line you will write more times than you can count.`,
  },
  watch: {
    code: `word = "python"
n = len(word)
first = word[0]
last = word[-1]
print(n, first, last)`,
    notes: {
      3: `Square brackets pull out **one character** by position. \`0\` is the first one — not
the zeroth-ish, not "one before the first". Literally the first.

The character that comes back is itself a string, just a one-character one.`,
      4: `A **negative index** counts backwards from the end. \`-1\` is the last character,
\`-2\` the one before it.

Why this exists: the last character of a 6-letter word is at \`5\`, and working that out
every time is where bugs live. \`word[-1]\` is "the last one" no matter how long the word is.`,
    },
  },
  predict: {
    code: `word = "hello"
print(word[1], word[-2])`,
    question: 'What does this print?',
    choices: ['e l', 'h l', 'e o', 'h o'],
    answerIndex: 0,
    explain: `\`e l\`. Lay the word out and number it:

\`\`\`text
h  e  l  l  o
0  1  2  3  4
-5 -4 -3 -2 -1
\`\`\`

\`word[1]\` is \`"e"\` — position 1 is the **second** character, because position 0
was the first. And \`word[-2]\` is the second-from-last, which is \`"l"\`.

If you said \`h l\`, you read \`[1]\` as "the first one". That's the single most
common beginner slip in Python, and it's worth being wrong about once, here,
instead of in a loop at 2am.`,
  },
  fix: {
    task: `This should print the first and last letter of the word — \`p n\`. Instead it
prints \`y o\`. Both indexes are off by one. Fix them.`,
    brokenCode: `word = "python"
first = word[1]
last = word[-2]
print(first, last)`,
    check: {
      kind: 'asserts',
      code: `assert first == "p", f"first came out as {first!r}. If 'p' is the first character, what number is it sitting at?"
assert last == "n", f"last came out as {last!r}. Which negative index means 'the very last one' — is it -1 or -2?"
assert __stdout__.strip() == "p n", f"It should print 'p n', but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      'Write the word out and number the letters underneath, starting at 0. Where does `p` actually land?',
      '`word[1]` skips the first character, because counting starts at 0. And `-1` is the last position, so `-2` is one short of it.',
      '`first = word[0]` and `last = word[-1]`. Zero for the front, minus one for the back.',
    ],
    solution: `word = "python"
first = word[0]
last = word[-1]
print(first, last)`,
  },
  stretch: {
    title: 'A string is a collection, so a for loop just works',
    body: `You already know how to loop over a list. A string is a sequence too, so
Python hands you one character at a time with no extra ceremony:

\`\`\`python
for ch in "hi":
    print(ch)
\`\`\`

No \`len\`, no index, no \`range\`. Which is also the answer to "how do I count the
letter *a* in this word?" — it's the accumulator loop you already wrote, with a
string instead of a list.

And the other half of the trick: \`word[-1]\` is really just shorthand for
\`word[len(word) - 1]\`. Python does the subtraction so you don't have to get it
wrong.`,
    code: `for ch in "hi":
    print(ch)`,
  },
}
