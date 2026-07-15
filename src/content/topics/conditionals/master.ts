import type { Level } from '../../types'

export const master: Level = {
  level: 5,
  blurb: 'Conditions as data — a dict instead of an elif chain.',
  concept: {
    body: `Look at an elif chain long enough and you notice every branch does the
same shape of thing: match a name, produce a value.

\`\`\`python
if tier == "gold":
    rate = 0.2
elif tier == "silver":
    rate = 0.1
else:
    rate = 0.0
\`\`\`

That's a **lookup table** wearing an if-statement costume. Write it as one:

\`\`\`python
rates = {"gold": 0.2, "silver": 0.1}
rate = rates.get(tier, 0.0)
\`\`\`

\`.get\`'s second argument *is* the \`else\`. New tier? Add a row — you don't touch
the logic, because there isn't any.

And when a branch just picks between two values, the \`if\` fits on the line:

\`\`\`python
label = "member" if rate > 0 else "guest"
\`\`\`

Value first, then the question. Reads backwards at first; stops soon.`,
    aiFraming: `Branches are cheap on one row and ruinous on a million.

Numpy and torch don't run your \`if\` per element — they can't. You give them
\`np.where(arr > 15, arr * 2, arr)\`: both answers computed for the whole array,
then selected between. On a GPU it's starker still. Threads run in lockstep, so
an \`if\` that's true for half your data makes the hardware run **both** sides and
throw half away. That's branch divergence, and it's a real cost.

Dict dispatch is the same instinct at a different scale: stop encoding decisions
as control flow, start encoding them as data. It's why model configs are YAML
and not if-statements — data you can inspect, log, diff and swap. Control flow
you can only read.`,
  },
  watch: {
    code: `rates = {"gold": 0.2, "silver": 0.1}
tier = "silver"
rate = rates.get(tier, 0.0)
label = "member" if rate > 0 else "guest"
print(rate, label)`,
    notes: {
      3: `The whole elif chain, in one line. \`.get\` looks \`tier\` up in the table — and its
second argument is the fallback, which is exactly what the \`else\` branch used to be.

Compare with \`rates[tier]\`, which raises \`KeyError\` on a miss. \`.get\` is the one that has
an \`else\`.`,
      4: `A **conditional expression** — an \`if\` that produces a value instead of running a
block.

Read it in this order: the condition in the middle first, then take the left value or the
right one. It reads out of order on purpose, so it reads like English.`,
    },
  },
  predict: {
    code: `sizes = {"s": 1, "m": 2}
pick = "l"
n = sizes.get(pick, 0)
print("unknown" if n == 0 else n)`,
    question: 'What does this print?',
    choices: ['unknown', '0', 'None', 'l'],
    answerIndex: 0,
    explain: `\`unknown\`. \`"l"\` isn't in \`sizes\`, so \`.get\` returns the fallback \`0\` —
no \`KeyError\`, because \`.get\` was given an \`else\`.

Then the conditional expression: \`n == 0\` is true, so it takes the value on the
**left**. That's the ordering to burn in — \`a if cond else b\` gives you \`a\` when
the condition holds, even though \`a\` is written before you've read the question.

(Had it been \`sizes[pick]\`, line 3 would have crashed and there'd be no line 4.)`,
  },
  fix: {
    task: `This works, and that's the problem — four branches to look one thing up.
Rewrite it as a dict lookup that leaves \`rate\` the same. No \`if\` anywhere.`,
    brokenCode: `tier = "silver"
if tier == "gold":
    rate = 0.2
elif tier == "silver":
    rate = 0.1
elif tier == "bronze":
    rate = 0.05
else:
    rate = 0.0
print(rate)`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
assert not any(isinstance(n, (ast.If, ast.IfExp)) for n in ast.walk(tree)), "There's still a branch in there. The point is that the table replaces the chain entirely — if the tiers live in a dict, what's left for an if to decide?"
dicts = [n for n in ast.walk(tree) if isinstance(n, ast.Dict)]
assert dicts, "No dict yet. The four outcomes want to be data, not control flow: what would {'gold': 0.2, ...} give you?"
keys = {k.value for d in dicts for k in d.keys if isinstance(k, ast.Constant)}
assert {"gold", "silver", "bronze"} <= keys, f"The table only knows about {sorted(keys)}. All three tiers still need a rate — the 0.0 is for the things that aren't tiers at all."
assert rate == 0.1, f"rate came out as {rate}, but silver's rate is 0.1. Is the lookup finding the row?"
assert __stdout__.strip() == "0.1", f"It should print 0.1, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      "Read the four branches side by side. They differ in exactly two places: a name, and a number. Everything else is repeated ceremony.",
      "Put the tiers in a dict — `rates = {'gold': 0.2, 'silver': 0.1, 'bronze': 0.05}` — and the chain becomes a single lookup. The `0.0` isn't a row; it's what you get when there's no row.",
      '`rate = rates.get(tier, 0.0)` — `.get` returns the matching value, and its second argument is the old `else`.',
    ],
    solution: `rates = {"gold": 0.2, "silver": 0.1, "bronze": 0.05}
tier = "silver"
rate = rates.get(tier, 0.0)
print(rate)`,
  },
  stretch: {
    title: 'The same move, one rung up',
    body: `A dict can hold anything — including functions. So dispatch isn't limited
to picking numbers:

\`\`\`python
ops = {"add": lambda a, b: a + b,
       "mul": lambda a, b: a * b}
result = ops["mul"](3, 4)   # 12
\`\`\`

That's an elif chain over operation names, gone. It's how command handlers,
parsers and plugin systems are built: the table is the program.

And in a comprehension, the conditional expression does per-item branching
without a single \`if\` statement:

\`\`\`python
[p * 2 if p > 15 else p for p in prices]
\`\`\`

Which is one keystroke from numpy's version of the same sentence:

\`\`\`python
np.where(arr > 15, arr * 2, arr)
\`\`\`

Same three parts, same order — condition, then-value, else-value. You've been
writing \`np.where\` this whole level. That's what Master means here: the branch
stopped being a thing you *do* and became a thing you *describe*.`,
    code: `prices = [10, 20, 30]
print([p * 2 if p > 15 else p for p in prices])`,
  },
}
