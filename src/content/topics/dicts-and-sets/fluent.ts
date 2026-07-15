import type { Level } from '../../types'

export const fluent: Level = {
  level: 3,
  blurb: 'Iterating a dict, and the counting pattern that is everywhere in data work.',
  concept: {
    body: `Loop over a dict and you get the **keys**:

\`\`\`python
for k in ages:          # "ana", "bo"
    print(k, ages[k])
\`\`\`

Not the values, not the pairs. Keys. Same rule as \`in\`. If you want something
else, say so:

\`\`\`python
for k in ages.keys():             # same as above, just louder
for v in ages.values():           # 31, 24
for k, v in ages.items():         # ("ana", 31) unpacked into two names
\`\`\`

\`.items()\` is the one you'll reach for most — it hands you both, so you never
have to look the key back up.

And then **the** dict pattern:

\`\`\`python
counts = {}
for w in words:
    counts[w] = counts.get(w, 0) + 1
\`\`\`

Read the middle line as: *whatever this word's count is so far — 0 if we've
never seen it — plus one.* It's the accumulator from the loops topic, except
you're keeping one running total per key instead of one for everything.`,
    aiFraming: `That tally loop is the first thing that happens to text, every time.

Before a model sees a word it becomes a number, and the way you decide which
words get numbers is: count them all, keep the frequent ones, throw the rest into
\`<unk>\`. Word frequency drives the vocabulary. Class frequency tells you your
dataset is 95% one label and your 95%-accurate model has learned nothing.
Value counts are how you find the corrupt column before you waste a training run
on it.

You'll eventually write \`Counter(words)\` or \`df["col"].value_counts()\` and skip
the loop entirely. Both are this loop. Write it by hand once and those never look
like magic.`,
  },
  watch: {
    code: `counts = {}
words = ["red", "blue", "red"]
for w in words:
    counts[w] = counts.get(w, 0) + 1
for word, n in counts.items():
    print(word, n)`,
    notes: {
      1: `An empty dict. You can't tally into a dict that doesn't exist yet, and it has to
live **outside** the loop or it'd be wiped clean every pass.`,
      4: `The tally. Right side first: \`counts.get(w, 0)\` is this word's count so far — and
\`0\` covers the first time you've ever seen it, when \`counts[w]\` would have raised
KeyError. Add 1, store it back under the same key.

First \`"red"\`: get → 0, store 1. Second \`"red"\`: get → 1, store 2.`,
      5: `\`.items()\` gives back a pair each pass, and the two names on the left unpack it —
\`word\` takes the key, \`n\` takes the value. Without this you'd loop over keys and then
look each one up again.`,
    },
  },
  predict: {
    code: `d = {"a": 1, "b": 2}
print(list(d))`,
    question: 'What does this print?',
    choices: [`['a', 'b']`, '[1, 2]', `[('a', 1), ('b', 2)]`, `['a', 1, 'b', 2]`],
    answerIndex: 0,
    explain: `\`['a', 'b']\`.

\`list(d)\` does the same thing \`for k in d\` does: it iterates the dict, and
iterating a dict yields **keys**. The values aren't in the answer at all.

If you wanted the others you'd have to ask: \`list(d.values())\` → \`[1, 2]\`, and
\`list(d.items())\` → \`[('a', 1), ('b', 2)]\`.

The order isn't luck, either — you get them back in the order they went in.
That's the Advanced level.`,
  },
  fix: {
    task: `\`"red"\` appears twice in \`words\`, so this should print \`2\`. It prints \`1\`.
The loop reaches every word — the line inside it is the problem.`,
    brokenCode: `words = ["red", "blue", "red"]
counts = {}
for w in words:
    counts[w] = 1
print(counts["red"])`,
    check: {
      kind: 'asserts',
      code: `assert 'counts' in dir(), "There's no dict called counts anymore — keep it."
assert counts == {"red": 2, "blue": 1}, f"counts came out as {counts!r}, but red appears twice and blue once. Is each pass adding to what that key already holds, or overwriting it?"
assert __stdout__.strip() == "2", f"It should print 2 — red appears twice. It printed {__stdout__.strip()!r}."`,
    },
    hints: [
      "`counts[w] = 1` says the same flat thing on every pass: this word's count is 1. The second `\"red\"` overwrites the first one's tally with the same 1. Nothing ever accumulates.",
      "You want the count that's already there, plus one. But the first time you meet a word there is no count there yet, and `counts[w]` would raise KeyError — which is exactly the gap `.get` has a default for.",
      "`counts[w] = counts.get(w, 0) + 1` — this word's count so far (0 if it's new), plus one, stored back.",
    ],
    solution: `words = ["red", "blue", "red"]
counts = {}
for w in words:
    counts[w] = counts.get(w, 0) + 1
print(counts["red"])`,
  },
  stretch: {
    title: 'Sorting the tally, which is the half nobody shows you',
    body: `A raw \`counts\` dict is rarely the answer. What you want is *the top ones*:

\`\`\`python
for word, n in sorted(counts.items(), key=lambda p: p[1], reverse=True):
    print(word, n)
\`\`\`

\`.items()\` gives pairs; \`key=lambda p: p[1]\` says "sort by the second thing in
each pair" — the count, not the word; \`reverse=True\` puts the biggest first.

That is the frequency table. It's how you pick a vocabulary cutoff, how you spot
the label that's swamping your dataset, how you find the value that appears
40,000 times because a script wrote a default into every row.

And the shortcut, once you've earned it:

\`\`\`python
from collections import Counter
Counter(words).most_common(3)
\`\`\`

Same loop, same sort, one line.`,
    code: `counts = {"red": 2, "blue": 1, "green": 5}
for word, n in sorted(counts.items(), key=lambda p: p[1], reverse=True):
    print(word, n)`,
  },
}
