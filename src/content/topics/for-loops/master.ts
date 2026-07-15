import type { Level } from '../../types'

export const master: Level = {
  level: 5,
  blurb: 'Stop writing loops — zip, enumerate, and the comprehension.',
  concept: {
    body: `Three tools that replace the loops you've been writing.

\`zip\` walks two lists together:

\`\`\`python
for name, score in zip(names, scores):
    print(name, score)
\`\`\`

\`enumerate\` hands you the position *and* the item, so you never need
\`range(len(...))\` again:

\`\`\`python
for i, name in enumerate(names):
    print(i, name)
\`\`\`

And a **comprehension** collapses build-a-list loops into one line:

\`\`\`python
doubled = [p * 2 for p in prices]
\`\`\`

One catch worth knowing now: \`zip\` stops at the **shortest** list. Feed it a
3-item list and a 2-item list and you get 2 pairs, silently. No error. That
silence has eaten a lot of people's afternoons.`,
    aiFraming: `This is the last stop before you stop writing loops entirely.

\`zip(features, labels)\` is how training pairs get built, and it's structurally
safer than indexing — you can't accidentally offset one list by 1. But that
silent truncation is the flip side: zip a 1000-sample feature list with 999
labels and you get 999 pairs and **no error at all**. Your model just trains on
slightly less data than you think.

The comprehension is the bridge to vectorization. \`[p * 2 for p in prices]\`
becomes \`arr * 2\` in numpy — no loop written anywhere, the multiply applied to
the whole array at once. Once this line reads naturally to you, numpy will too.`,
  },
  watch: {
    code: `names = ["ana", "bo"]
scores = [90, 85]
for name, score in zip(names, scores):
    print(name, score)`,
    notes: {
      3: `\`zip\` walks both lists together, handing you one item from each. No index, no
\`range(len(...))\`, no chance of offsetting one list against the other.

Two names on the left of \`in\` because each step gives you a *pair* — Python unpacks it
into \`name\` and \`score\` for you.

The catch: \`zip\` stops at the shorter list, silently.`,
    },
  },
  predict: {
    code: `pairs = list(zip([1, 2, 3], ["a", "b"]))
print(len(pairs))`,
    question: 'What does this print?',
    choices: ['3', '2', '5', '6'],
    answerIndex: 1,
    explain: `\`2\`. \`zip\` stops as soon as the **shortest** list runs out — the \`3\`
never gets a partner and is dropped without a word.

No error, no warning. This is the zip gotcha, and it's genuinely dangerous:
mismatched lengths usually mean you have a bug somewhere upstream, and zip
quietly hides it instead of surfacing it.

If you need the loud version, \`zip(a, b, strict=True)\` raises when the lengths
differ.`,
  },
  fix: {
    task: `This works — but it's four lines doing one thing. Rewrite it as a single list
comprehension that produces the same \`doubled\`.`,
    brokenCode: `prices = [10, 20, 30]
doubled = []
for p in prices:
    doubled.append(p * 2)
print(doubled)`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
assert doubled == [20, 40, 60], f"doubled came out as {doubled}, expected [20, 40, 60]."
assert any(isinstance(n, ast.ListComp) for n in ast.walk(tree)), "Right answer, but it's still a loop. Use a list comprehension: [ ... for p in prices]."
assert not any(isinstance(n, ast.For) for n in ast.walk(tree)), "The comprehension is there, but the old for loop is still hanging around. Delete it."
assert __stdout__.strip() == "[20, 40, 60]", f"It should print [20, 40, 60], but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      'A comprehension puts the loop inside the brackets: `[<what you want> for <name> in <list>]`.',
      'What you want is `p * 2`. What you loop over is `prices`. The empty list and the `.append` both disappear.',
      '`doubled = [p * 2 for p in prices]` — that one line replaces three.',
    ],
    solution: `prices = [10, 20, 30]
doubled = [p * 2 for p in prices]
print(doubled)`,
  },
  stretch: {
    title: 'And then the loop disappears completely',
    body: `You've now written the same idea three ways:

\`\`\`python
doubled = []                        # 1. the loop
for p in prices:
    doubled.append(p * 2)

doubled = [p * 2 for p in prices]   # 2. the comprehension

arr * 2                             # 3. vectorized (numpy)
\`\`\`

Each one is shorter than the last, and the last one has **no loop at all** —
you describe the operation and numpy applies it to the whole array in compiled
code.

That's the arc of this entire topic. You started at \`total = total + n\` and
ended somewhere you can read \`arr * 2\` and know exactly what it's doing,
because you've written the loop it replaces by hand.

That's what Master means here. Not that loops are beneath you — that you can see
straight through them.`,
    code: `prices = [10, 20, 30]
print([p * 2 for p in prices])`,
  },
}
