import type { Level } from '../../types'

export const advanced: Level = {
  level: 4,
  blurb: 'What can be a key, why a list cannot, and nesting.',
  concept: {
    body: `**Values can be anything. Keys can't.**

\`\`\`python
grid[(0, 1)] = "north"   # fine — tuple key
grid[[0, 1]] = "north"   # TypeError: unhashable type: 'list'
\`\`\`

A dict doesn't scan for your key — it computes a number from the key's contents
and jumps straight to that slot. That's why lookup is instant. But it only works
if the key's contents never change: edit the list after storing it and the
number no longer matches, so the value is stranded in a slot nobody will ever
look in.

Python refuses up front rather than let that happen. **Immutable → allowed**
(str, int, tuple, bool). **Mutable → refused** (list, dict, set).

So a tuple key is how you file something under a *compound* name — a coordinate,
a (user, date) pair.

**Nesting** works because values are unrestricted:

\`\`\`python
cfg = {"model": {"layers": 4}}
cfg["model"]["layers"] = 8
\`\`\`

Read the brackets left to right: get \`"model"\` (a dict), then \`"layers"\` in that.

**Order**: dicts hand keys back in insertion order. Guaranteed since Python 3.7
— and genuinely random before it. Any tutorial telling you "dicts are unordered"
is old.`,
    aiFraming: `Tuple keys are how sparse data gets stored. \`weights[(word_i, word_j)]\` — a
co-occurrence matrix as a dict, because 99.99% of the pairs are zero and a real
matrix would be terabytes of nothing.

The hashability rule is the same rule that will bite you in pandas
(\`groupby\` on a column of lists), in caching (\`@lru_cache\` refuses list
arguments), and in \`set()\` — all of them hash, all of them refuse mutable
things, all for this reason. Learn it once here.

And insertion order matters more than it sounds: it's why your vocab dict, your
JSON dumps, and your feature-name lists come out reproducible run after run.
Reproducibility is not a nicety when you're comparing two models.`,
  },
  watch: {
    code: `grid = {(0, 1): "north"}
grid[(2, 3)] = "south"
print(grid[(0, 1)])
cfg = {"model": {"layers": 4}}
cfg["model"]["layers"] = 8
print(cfg["model"]["layers"])
print(list(grid))`,
    notes: {
      1: `The key is \`(0, 1)\` — a tuple, one key made of two coordinates. It's allowed
because a tuple can never be edited after it's made, so the dict's internal filing number
for it can never go stale.`,
      2: `A second tuple key. Note these aren't positions — \`grid\` has no slot 0 and no slot
1. \`(0, 1)\` is a *name* that happens to look like coordinates.`,
      5: `Chain left to right: \`cfg["model"]\` is itself a dict, and \`["layers"]\` indexes
into that one. Two lookups on one line, and \`=\` writes into the **inner** dict.`,
      7: `Keys come back in the order they were inserted — \`(0, 1)\` then \`(2, 3)\`. That's a
promise Python makes since 3.7. Before that, this line could print them either way round.`,
    },
  },
  predict: {
    code: `d = {}
d[(1, 2)] = "ok"
try:
    d[[1, 2]] = "also ok"
    print(len(d))
except TypeError:
    print("TypeError")`,
    question: 'What does this print?',
    choices: ['TypeError', '2', '1', 'KeyError'],
    answerIndex: 0,
    explain: `\`TypeError\` — specifically, \`unhashable type: 'list'\`.

\`(1, 2)\` and \`[1, 2]\` hold the same two numbers, and only one of them can be a
key. Nothing to do with the contents; everything to do with the type. A tuple is
frozen once built, a list isn't, and a dict will not file anything under a name
that can change out from under it.

Note it's a **TypeError**, not a KeyError. KeyError means "that key isn't here".
This means "that isn't a key at all". Different failures, different fixes — and
this one fails on the *store*, line 4, not on some later lookup.`,
  },
  fix: {
    task: `Each grid position should map to a label. This dies with
\`TypeError: unhashable type: 'list'\`. The two coordinates are right — the
container they're in isn't.`,
    brokenCode: `seen = {}
point = [0, 1]
seen[point] = "visited"
print(seen[[0, 1]])`,
    check: {
      kind: 'asserts',
      code: `assert 'seen' in dir(), "There's no dict called seen anymore — keep it."
assert seen == {(0, 1): "visited"}, f"seen is {seen!r}. It should file 'visited' under the position (0, 1) as a single key — did the two coordinates stay together?"
assert __stdout__.strip() == "visited", f"It should print visited. It printed {__stdout__.strip()!r}."`,
    },
    hints: [
      '"unhashable" is Python declining, politely, to use that object as a key. Read the type it names: `list`. The position itself is fine — the problem is what it\'s wrapped in.',
      "A dict finds a key by computing a number from its contents. A list can be edited after you store it, and then that number would be wrong and the value unreachable. Tuples can't be edited, so they're allowed. Which bracket makes a tuple?",
      '`point = (0, 1)` and `print(seen[(0, 1)])` — round brackets in both places. Same two coordinates, in a type the dict can trust to hold still.',
    ],
    solution: `seen = {}
point = (0, 1)
seen[point] = "visited"
print(seen[(0, 1)])`,
  },
  stretch: {
    title: 'The bug the rule is protecting you from',
    body: `Python's refusal looks pedantic until you see what it prevents. Suppose lists
*were* allowed as keys:

\`\`\`python
key = [0, 1]
d[key] = "visited"     # filed under slot for [0, 1]
key.append(2)          # key is now [0, 1, 2]
d[[0, 1]]              # KeyError
d[[0, 1, 2]]           # also KeyError
\`\`\`

The value is still in there. Nothing can reach it, in either shape — filed under
the old contents, findable only by the new. A dict full of unreachable data and
not one error along the way.

Rather than let that exist, Python refuses at line 2. **The TypeError isn't the
bug — it's the bug prevention.**

This is the same reason you can't put a list in a \`set()\`, and why
\`@lru_cache\` won't take a list argument. Same machinery, same rule, one thing to
learn.`,
    code: `key = (0, 1)
d = {key: "visited"}
print(d[(0, 1)])
print(hash(key) == hash((0, 1)))`,
  },
}
