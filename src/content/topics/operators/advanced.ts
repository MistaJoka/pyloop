import type { Level } from '../../types'

export const advanced: Level = {
  level: 4,
  blurb: 'The same symbol, different types — and how * quietly hands you one list twice.',
  concept: {
    body: `\`+\` isn't "add". It's a **request**, and the types decide what it means:

\`\`\`python
2 + 3            # 5              — add
"ab" + "cd"      # "abcd"         — join
[1] + [2]        # [1, 2]         — join
\`\`\`

Same for \`*\`:

\`\`\`python
"ab" * 3         # "ababab"
[0] * 3          # [0, 0, 0]      — a list of three zeros. Handy.
\`\`\`

And then this, which looks like the obvious next step:

\`\`\`python
grid = [[0] * 3] * 2      # [[0, 0, 0], [0, 0, 0]]
grid[0][0] = 9
print(grid)               # [[9, 0, 0], [9, 0, 0]]   <-- both rows!
\`\`\`

The outer \`* 2\` did **not** copy the inner list. It made a second **reference**
to the one list that already existed. Two rows, one object — change either and
you change "both".

That's the names-and-objects idea from variables, except there's no \`=\` to warn
you. An operator did it.`,
    aiFraming: `\`[0] * n\` is how everyone initialises a buffer, and \`[[0] * w] * h\`
is how everyone initialises a grid. One of those is a bug.

Nothing errors. Your image is a solid colour, your board has every row
identical, your per-worker counters all read the same number — and the code
looks right, because the wrongness is in an object graph you can't see from the
source.

Keep the thread: the operator was a request, the types answered it. \`* 3\` on a
list of ints copies values. \`* 2\` on a list **of lists** copies references,
because that's what a list holds. The operator didn't change; what it was
operating on did. That's the same reason \`+\` on two numpy arrays adds and \`+\` on
two Python lists concatenates — and why "it ran" tells you nothing about
whether it did what you wanted.`,
  },
  watch: {
    code: `print("ab" * 3)
print([0] * 3)
print("ab" + "cd")
print([1] + [2])
grid = [[0] * 3] * 2
print(grid)
grid[0][0] = 9
print(grid)`,
    notes: {
      2: `\`*\` on a list **repeats** it. Three zeros, in one expression — this part is
genuinely useful and does exactly what it looks like.

The ints inside are immutable, so there's nothing to share.`,
      5: `The trap, and it's one line. The inner \`[0] * 3\` builds one list of zeros. The
outer \`* 2\` then repeats **that list** twice — it repeats the *reference*, not the contents.

So \`grid\` holds the same list object twice. There is only one row.`,
      8: `Line 7 only wrote to \`grid[0]\`. Both rows changed, because both rows were always
the same object.

No error, no warning, no \`=\` in sight. The \`*\` on line 5 did this.`,
    },
  },
  predict: {
    code: `row = [0] * 3
grid = [row] * 2
grid[0][0] = 9
print(grid)`,
    question: 'What does this print?',
    choices: [
      '[[9, 0, 0], [9, 0, 0]]',
      '[[9, 0, 0], [0, 0, 0]]',
      '[9, 0, 0, 0, 0, 0]',
      '[[9, 0, 0]]',
    ],
    answerIndex: 0,
    explain: `\`[[9, 0, 0], [9, 0, 0]]\`. This version gives the row a name first,
which makes the problem visible: there is exactly **one** \`row\` in this program.

\`[row] * 2\` builds a list containing that same object twice. \`grid[0]\` and
\`grid[1]\` are two ways of saying \`row\`, so writing through one shows up in the
other.

\`[[0] * 3] * 2\` is this same code with the name deleted. It's no different —
it's just harder to see, because without a name it *looks* like two separate
lists were written out.`,
  },
  fix: {
    task: `A 2×3 grid of zeros. Setting the top-left to 9 should print
\`[[9, 0, 0], [0, 0, 0]]\` — one row changed. Both rows change. Fix line 1.`,
    brokenCode: `grid = [[0] * 3] * 2
grid[0][0] = 9
print(grid)`,
    check: {
      kind: 'asserts',
      code: `assert isinstance(grid, list) and len(grid) == 2, f"grid should still be 2 rows, but it's {grid!r}."
assert all(isinstance(r, list) and len(r) == 3 for r in grid), f"Each row should still be 3 items wide, but grid is {grid!r}."
assert grid[0] == [9, 0, 0], f"Row 0 came out as {grid[0]!r}, expected [9, 0, 0] — line 2 should still do its job."
assert grid[1] == [0, 0, 0], f"Row 1 came out as {grid[1]!r}. Nothing in this code ever assigns to grid[1] — so how did the 9 arrive? What did * 2 actually repeat: the list, or a reference to it?"
assert grid[0] is not grid[1], "The two rows are still the same list object, so a write to one is a write to both. What would make row 1 a genuinely separate list?"
assert __stdout__.strip() == "[[9, 0, 0], [0, 0, 0]]", f"It should print [[9, 0, 0], [0, 0, 0]], but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      'Line 2 touches `grid[0]` only. It never mentions `grid[1]`. So the 9 in row 1 was never written — it was already there, seen through a second name.',
      '`* 2` repeats what it is given. It was given a *reference* to one list, so you got that reference twice. You need two lists that were built separately.',
      'Write the rows out: `grid = [[0] * 3, [0] * 3]`. Each `[0] * 3` runs on its own and builds its own list. (The inner `* 3` is fine — ints have nothing to share.)',
    ],
    solution: `grid = [[0] * 3, [0] * 3]
grid[0][0] = 9
print(grid)`,
  },
  stretch: {
    title: '+= and + are not the same operator',
    body: `You've been told \`a += x\` is shorthand for \`a = a + x\`. For lists, that's
not quite true — and the difference is this level again:

\`\`\`python
a = [1, 2]
b = a
a += [3]        # mutates the list in place. b sees it.
print(b)        # [1, 2, 3]

a = a + [4]     # builds a NEW list, points a at it. b does not see it.
print(b)        # [1, 2, 3]
\`\`\`

\`+\` on lists always makes a new list. \`+=\` asks the list to extend itself, and
a list — being mutable — can. So the same-looking pair of lines have opposite
consequences for everyone else holding that object.

For ints and strings there's no difference, because they're immutable: there's
no "extend yourself" to ask for, so \`+=\` has to rebuild and reassign.

Which is the thread one more time. Neither operator changed. The type answered
differently.`,
    code: `a = [1, 2]
b = a
a += [3]
print(b)
a = a + [4]
print(b)`,
  },
}
