import type { Level } from '../../types'

export const master: Level = {
  level: 5,
  blurb: 'Text is bytes with a story — encoding, decoding, and why an LLM miscounts letters.',
  concept: {
    body: `A Python string is characters. A file, a socket, an API — those are
**bytes**. The conversion is not free and it is not one-to-one.

\`\`\`python
word = "café"
len(word)                  # 4  characters
len(word.encode("utf-8"))  # 5  BYTES
\`\`\`

Four characters, five bytes. \`é\` needs two bytes in UTF-8; every ASCII character
needs one. So **length depends on what you're counting**.

Two methods, one breath:

- \`.encode()\` — string → bytes. *Leaving* Python.
- \`.decode()\` — bytes → string. *Arriving* in Python.

That's the whole mental model: characters on the inside, bytes on the wire.

And there's a third length. Models don't see characters at all — they see
**tokens**, chunks of text pulled from a fixed vocabulary. \`"strawberry"\` might
arrive as 3 tokens. Which is exactly why an LLM fumbles "how many r's in
strawberry?" — it was never shown the r's. It was shown three numbers.`,
    aiFraming: `This is the answer to the question everyone eventually asks: why
can't the model count letters?

Because there are no letters. By the time text reaches the model it's a list of
integers, and \`"strawberry"\` → \`[st][raw][berry]\` has no more r-ness in it than
\`[812, 1618, 19772]\` does. Asking it to count characters is asking it to
reconstruct information that was destroyed before it ever saw the prompt.

The same machinery explains the stray space from the last level. \`" cat"\` and
\`"cat"\` are separate entries in the vocabulary with separate ids — not near each
other, *different*. Tokenisation is where "it's just text" stops being true, and
knowing that turns a whole class of model weirdness from spooky into obvious.`,
  },
  watch: {
    code: `word = "café"
chars = len(word)
data = word.encode("utf-8")
byte_count = len(data)
print(chars, byte_count)
print(data)
back = data.decode("utf-8")
print(back == word)`,
    notes: {
      3: `\`.encode()\` turns the string into **bytes** — the form it takes to travel: to a
file, over a network, into another program.

It returns a new object (of course it does — strings are immutable), and that object prints
with a \`b\` in front of it. That \`b\` is how you tell bytes from a string at a glance.`,
      6: `Look at what printed: \`caf\\xc3\\xa9\`. The \`c\`, \`a\`, \`f\` are one byte each and
show as themselves. The \`é\` became **two** bytes, \`\\xc3\\xa9\`, because UTF-8 spends more
bytes on characters outside ASCII.

Four characters. Five bytes. Both numbers are true; they're just counting different things.`,
      7: `\`.decode()\` is the way back — bytes to string. Same encoding on both sides, and
you get exactly what you started with.

Different encoding on the two sides and you get mojibake (\`cafÃ©\`) or a crash. That's
what the encoding argument is *for*: bytes don't carry a label saying how to read them.`,
    },
  },
  predict: {
    code: `a = "café"
b = "cafe\\u0301"
print(len(a), len(b), a == b)`,
    question: 'What does this print?',
    choices: ['4 5 False', '4 4 True', '5 5 True', '4 5 True'],
    answerIndex: 0,
    explain: `\`4 5 False\`. Both of those render as **café** on your screen. They are not
the same string.

\`a\` uses one character for \`é\`. \`b\` uses two: a plain \`e\`, followed by
\`\\u0301\` — a *combining acute accent*, a character whose entire job is to stack
on top of whatever came before it. Your screen draws them as one glyph. \`len\`
counts them as two, and \`==\` says no.

This is the bug you cannot see. Two "identical" names, one from a form and one
from a database, that refuse to match — and no amount of staring at the screen
reveals why. The stdlib fix is one line:
\`unicodedata.normalize("NFC", b)\`, which folds \`b\` back into \`a\`'s form.`,
  },
  fix: {
    task: `This should report how many **bytes** the word takes when written to a
UTF-8 file. For \`"café"\` the answer is \`5\`. It reports \`4\`. Fix it.`,
    brokenCode: `word = "café"
size = len(word)
print(size)`,
    check: {
      kind: 'asserts',
      code: `assert size == 5, f"size came out as {size} — that's the character count, and it's correct as far as it goes. But 'é' costs two bytes in UTF-8. What do you have to turn the string into before len() counts bytes instead of characters?"
assert __stdout__.strip() == "5", f"It should print 5, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      '`len()` on a string always counts characters. It has no idea what encoding you plan to use, so it cannot possibly count bytes.',
      'Turn the string into bytes first, *then* measure that. The method that goes string → bytes is `.encode()`, and it takes the encoding name.',
      '`size = len(word.encode("utf-8"))` — encode first, measure second. Four characters, five bytes.',
    ],
    solution: `word = "café"
size = len(word.encode("utf-8"))
print(size)`,
  },
  stretch: {
    title: 'Why a space changes the number',
    body: `A tokeniser maps chunks of text to integers from a fixed vocabulary. Here's
a toy one — real vocabularies hold ~100k entries, but the shape is this:

\`\`\`python
vocab = {"cat": 9246, " cat": 5183, "Cat": 21979}
\`\`\`

Three entries. Same three letters. **Three unrelated ids** — 9246 and 5183 aren't
neighbours, they're just different rows in a table. The model learns what each id
means from scratch, and it has seen \`" cat"\` (mid-sentence) vastly more often
than bare \`"cat"\`.

So when a stray space rides in on your data, you haven't given the model a
slightly-off version of a word it knows. You've given it a **different word**.
That's why \`.strip()\` from the last level is a correctness step and not
housekeeping.

Three lengths now live in your head, and none of them is wrong:

\`\`\`text
len(text)                    → characters   (what you read)
len(text.encode("utf-8"))    → bytes        (what the disk stores)
len(tokenizer.encode(text))  → tokens       (what the model sees, and what you pay for)
\`\`\`

The third one is the API bill. It's also the context limit. And it's the reason
the model can't count the r's in strawberry — by the time it arrives, there are
no r's.`,
    code: `vocab = {"cat": 9246, " cat": 5183, "Cat": 21979}
for t in [" cat", "cat", "Cat"]:
    print(repr(t), "->", vocab[t])`,
  },
}
