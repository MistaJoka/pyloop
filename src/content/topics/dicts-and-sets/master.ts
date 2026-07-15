import type { Level } from '../../types'

export const master: Level = {
  level: 5,
  blurb: 'Sets — membership for free, and the cost of asking a list instead.',
  concept: {
    body: `A set is a dict with the values thrown away. Just keys. No duplicates, and
one job: **is this in here?**

\`\`\`python
unique = set(ids)       # dedup, in one step
"a1" in unique          # instant
\`\`\`

Here's the part that matters. \`x in some_list\` **walks the list**, item by item,
until it finds \`x\` or runs off the end. On a 100,000-item list that's up to
100,000 comparisons. \`x in some_set\` computes one number from \`x\` and looks in
one slot. **One.** It costs the same on 10 items as on 10 million.

That's O(n) versus O(1), and it's the difference between a 1-second job and a
10-minute one — same output, same correctness, no error to warn you.

Sets also do the set operations, and they read like what you mean:

\`\`\`python
train & test    # in both       (leakage!)
train - test    # in train only
train | test    # in either
\`\`\`

Cost of admission: sets are unordered, and their items must be hashable — same
rule as dict keys.`,
    aiFraming: `\`train & test\` is a one-liner that catches data leakage, which is the single
most expensive mistake in applied ML. Your model scores 0.99 because it already
saw the answers. That intersection is how you find out before you present the
number to anybody.

But the reason this is the Master level is the cost argument. The \`in\`-a-list
habit is the most common way a beginner turns a one-second job into a ten-minute
one. Loop over 50,000 rows, and for each one check \`if row_id not in seen:\`
against a growing list — that's 50,000 × 25,000 comparisons on average. A billion.
Change \`seen = []\` to \`seen = set()\` and \`.append\` to \`.add\` and it's 50,000
comparisons. Nothing else about the code changes.

Nobody's profiler tells you this. Reading it in the code is the skill.`,
  },
  watch: {
    code: `train = {"a1", "b2", "c3"}
test = {"b2", "d4"}
both = train & test
only_train = train - test
print(sorted(both))
print(sorted(only_train))
ids = set(["x", "y", "x"])
print(len(ids))`,
    notes: {
      1: `Curly braces with no colons — that's a set, not a dict. Keys with no values. (An
empty one has to be \`set()\`, because \`{}\` was already taken by dicts.)`,
      3: `\`&\` is intersection: the items in **both**. On a train/test split this is the
leakage check, and you want it to come back empty.`,
      4: `\`-\` is difference: in \`train\`, not in \`test\`. Order matters here — \`test - train\`
is a different question with a different answer.`,
      7: `\`set(...)\` on a list drops duplicates. Two \`"x"\` go in, one comes out, and the
next line proves it: length 2, not 3. No loop, no \`if\`, no \`.append\`.`,
    },
  },
  predict: {
    code: `a = {1, 2, 3}
b = {3, 4}
print(sorted(a - b), sorted(a & b))`,
    question: 'What does this print?',
    choices: ['[1, 2] [3]', '[1, 2, 4] [3]', '[3] [1, 2]', '[1, 2, 3, 4] []'],
    answerIndex: 0,
    explain: `\`[1, 2] [3]\`.

\`a - b\` is "in \`a\`, not in \`b\`" — \`3\` is in both so it's dropped, and \`4\` was
never in \`a\` to begin with, so it can't come out of \`a - b\`. Left: \`{1, 2}\`.

\`a & b\` is "in both" — only \`3\` qualifies.

The \`sorted()\` calls are there for the printing. Sets have **no order**, so
printing one raw gives you an arrangement you can't rely on. Whenever you're
about to show a set to a human or compare it in a test, sort it.`,
  },
  fix: {
    task: `This gets the right answer — \`3\` distinct ids — and it's the exact habit worth
breaking. Every \`not in unique\` rescans the whole list, so the work grows with
the square of the data. Rewrite it with a set: no loop, one hop per check. Keep
\`unique\` and keep printing the count.`,
    brokenCode: `ids = ["a", "b", "a", "c", "b"]
unique = []
for i in ids:
    if i not in unique:
        unique.append(i)
print(len(unique))`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
assert 'unique' in dir(), "Keep a name called unique holding the distinct ids."
assert not any(isinstance(n, ast.For) for n in ast.walk(tree)), "The loop is still here. A set can't hold a duplicate in the first place — so what does set(ids) leave you with, and what work is the loop still doing that you no longer need?"
assert isinstance(unique, set), f"unique is a {type(unique).__name__}. Answering 'have I seen this?' from a list means scanning it — which type answers that in one hop, without looking at the other items at all?"
assert unique == {"a", "b", "c"}, f"unique is {unique!r}, but the distinct ids are a, b and c."
assert __stdout__.strip() == "3", f"It should print 3 — three distinct ids. It printed {__stdout__.strip()!r}."`,
    },
    hints: [
      "The loop is doing two jobs at once: checking whether it's seen an id, and keeping the ones it hasn't. A set does both by *definition* — it physically cannot hold a duplicate.",
      '`set(ids)` takes any list and hands back its distinct items. The `for`, the `if`, the `.append` and the empty list all go — all four lines collapse into one.',
      '`unique = set(ids)`, then `print(len(unique))`. That\'s the whole program.',
    ],
    solution: `ids = ["a", "b", "a", "c", "b"]
unique = set(ids)
print(len(unique))`,
  },
  stretch: {
    title: 'The number that makes it real',
    body: `Same question, two containers, 100,000 items:

\`\`\`python
data = list(range(100_000))
lookup = set(data)

99_999 in data      # ~50,000 comparisons on average. Worst case 100,000.
99_999 in lookup    # 1 hash, 1 slot. Every time.
\`\`\`

Now put that check inside a loop over another 100,000 items:

| \`seen\` is a... | comparisons |
|---|---|
| list | ~5,000,000,000 |
| set | 100,000 |

**Fifty thousand times** the work. Both versions are correct. Both are readable.
One finishes while you blink and one is why your script has been "still running"
for ten minutes.

The tell is always the same shape: **\`in\` against something that grows.** When
you see it, ask what that container is. If the only thing you ever do with it is
ask "is this in here?", it should never have been a list.

\`\`\`python
seen = set()        # not []
seen.add(x)         # not .append(x)
\`\`\`

Two characters and a method name. That's the entire fix, and it's the highest
return-on-keystrokes edit in this whole course.`,
    code: `data = list(range(100000))
lookup = set(data)
print(99999 in lookup, len(lookup))`,
  },
}
