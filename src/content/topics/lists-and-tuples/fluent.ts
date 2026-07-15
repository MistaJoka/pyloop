import type { Level } from '../../types'

export const fluent: Level = {
  level: 3,
  blurb: 'sort changes the list; sorted hands you a new one.',
  concept: {
    body: `Two ways to sort, and they are not interchangeable.

\`\`\`python
xs.sort()          # rearranges xs. Returns None.
ys = sorted(xs)    # NEW list. xs is untouched.
\`\`\`

Same pair again for reversing: \`xs.reverse()\` flips \`xs\` in place and returns
\`None\`; \`reversed(xs)\` hands back a lazy view you wrap in \`list(...)\`.

The method **changes**. The function **returns**. Pick by asking one question:
*does anyone else still need the original order?*

And \`key=\` says what to sort **by**:

\`\`\`python
names.sort(key=len)          # by length
sorted(rows, reverse=True)   # biggest first
\`\`\`

\`key\` takes a function — not a call. \`key=len\`, not \`key=len()\`. Python calls it
on each item for you.`,
    aiFraming: `This is the same idea you met in strings, from the other side.
Strings are immutable, so \`s.upper()\` **had** to return a new one — there was no
other option. Lists are mutable, so they get to offer both, and now you have to
choose.

That choice is the whole shape of data work. \`sorted\` is safe and costs you a
second copy of the data; \`sort\` is cheap and destroys the original. On a
100-million-row array those copies are the difference between a job that runs
and a job that runs out of memory — which is exactly why every serious library
(pandas, torch, numpy) offers you the pair and makes you pick. Trailing
underscore in PyTorch, \`inplace=\` in pandas, \`sort\` vs \`sorted\` here. One idea,
three costumes.`,
  },
  watch: {
    code: `names = ["bo", "ana", "cy"]
alpha = sorted(names)
names.sort(key=len)
print(alpha)
print(names)
print(list(reversed(names)))`,
    notes: {
      2: `\`sorted\` builds a **brand new** list and leaves \`names\` exactly as it was — watch the
panel: \`alpha\` appears, \`names\` doesn't move.`,
      3: `\`names.sort(...)\` rearranges \`names\` **itself**. The original order is gone the moment
this line runs.

\`key=len\` means "don't compare the words, compare what \`len\` says about them". \`bo\` and
\`cy\` are both 2, and Python keeps ties in the order it found them.`,
      6: `\`reversed\` doesn't build a list — it hands back a lazy thing that will produce items
backwards when asked. \`list(...)\` is what asks.

Print it without the \`list(...)\` and you get \`<list_reverseiterator object at 0x...>\`,
which is Python saying "I haven't done the work yet".`,
    },
  },
  predict: {
    code: `xs = [3, 1, 2]
ys = xs.sort()
print(xs, ys)`,
    question: 'What does this print?',
    choices: ['[1, 2, 3] [1, 2, 3]', '[3, 1, 2] [1, 2, 3]', '[1, 2, 3] None', '[3, 1, 2] None'],
    answerIndex: 2,
    explain: `\`[1, 2, 3] None\` — both halves of the lesson on one line.

\`xs\` **is** sorted: \`sort\` did its job, in place, on the list itself. And \`ys\` is
\`None\`, because \`sort\` changed the list and had nothing to return.

The tempting wrong answer is \`[3, 1, 2] [1, 2, 3]\` — that's what \`sorted\` does,
and it's what people expect from a line shaped like this one. Same word, one
letter apart, opposite behaviour.`,
  },
  fix: {
    task: `The report should print the top 3 scores highest-first, then the scores in
the order they came in. The second line comes out sorted too. Fix it.`,
    brokenCode: `scores = [70, 95, 88, 60]
scores.sort(reverse=True)
print(scores[:3])
print(scores)`,
    check: {
      kind: 'asserts',
      code: `assert scores == [70, 95, 88, 60], f"scores came out as {scores!r} — the order it arrived in is gone. Which of sort() and sorted() rearranges the list it's handed?"
lines = __stdout__.strip().split("\\n")
assert len(lines) == 2, f"It should print exactly two lines; it printed {len(lines)}."
assert lines[0] == "[95, 88, 70]", f"The first line should be the top 3, [95, 88, 70], but it's {lines[0]!r}."
assert lines[1] == "[70, 95, 88, 60]", f"The last line should be the scores as they arrived, [70, 95, 88, 60], but it's {lines[1]!r}."`,
    },
    hints: [
      '`scores.sort(reverse=True)` rearranges the one and only list. By the time the last `print` runs, the arrival order no longer exists anywhere.',
      'You want the sorted order *and* the original. That means a second list — and `sorted(...)` is the one that gives you a new list instead of wrecking the old one.',
      '`ranked = sorted(scores, reverse=True)`, then `print(ranked[:3])` and `print(scores)`. `scores` is never touched.',
    ],
    solution: `scores = [70, 95, 88, 60]
ranked = sorted(scores, reverse=True)
print(ranked[:3])
print(scores)`,
  },
  stretch: {
    title: 'key= is where sorting gets useful',
    body: `Real data isn't a list of numbers, it's a list of **records** — and you
want them ordered by one field.

\`\`\`python
rows = [("ana", 90), ("bo", 72), ("cy", 85)]
sorted(rows, key=lambda r: r[1], reverse=True)
\`\`\`

\`lambda r: r[1]\` is a throwaway function: *given a row, the thing to sort by is
its second item*. Python calls it once per row and sorts on the answers.

Two things worth pocketing:

- Without \`key\`, sorting those tuples compares the **names** first — tuples
  compare left to right. Try it.
- Python's sort is **stable**: ties stay in the order they came in. That's what
  makes sorting twice work — sort by score, then by team, and inside each team
  the scores are still ordered.

This is \`ORDER BY\` in SQL and \`df.sort_values(by=...)\` in pandas. Same idea,
same everywhere, first met here.`,
    code: `rows = [("ana", 90), ("bo", 72), ("cy", 85)]
print(sorted(rows, key=lambda r: r[1], reverse=True))
print(sorted(rows))`,
  },
}
