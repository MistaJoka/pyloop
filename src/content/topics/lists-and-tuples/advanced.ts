import type { Level } from '../../types'

export const advanced: Level = {
  level: 4,
  blurb: 'A copy of a list of lists barely copies anything — and tuples, which need no copying.',
  concept: {
    body: `You already know \`b = a\` shares one list, and \`b = list(a)\` copies it.

Here's the part that still bites. A list doesn't hold values — it holds
**pointers** to objects. \`list(a)\` copies the pointers, not the things they
point at.

\`\`\`python
grid = [[1, 2], [3, 4]]
snap = list(grid)
snap[0].append(99)
print(grid)      # [[1, 2, 99], [3, 4]]
\`\`\`

New outer list, **same inner lists**. That's a *shallow* copy — one level deep,
which is all any copy does unless you ask for more (\`copy.deepcopy\`).

**Tuples** dodge the whole mess. A tuple is a list that can't be changed:

\`\`\`python
point = (3, 4)
x, y = point       # unpacking
a, b = b, a        # the swap — that's a tuple too
\`\`\`

Nothing can change it, so there's nothing to protect, so sharing one is always
safe. It's why a tuple can be a dict key and a list can't — next topic.`,
    aiFraming: `"Is this a copy or a view?" never goes away; it just gets more
expensive to get wrong.

A list of lists is the shape all tabular data starts as, and \`list(rows)\` looks
like a snapshot right up until you edit a row and find your snapshot edited too.
The nested case is the one people miss, because the flat case taught them
copying works.

Tuples are the other half of the answer: make it impossible to change and the
question stops mattering. That's why coordinates, shapes and config come back as
tuples — \`arr.shape\` is \`(1000, 3)\`, a tuple, because an array's shape is not
something a caller should be able to reach in and edit.`,
  },
  watch: {
    code: `row = [1, 2]
grid = [row, [3, 4]]
snap = list(grid)
snap[0].append(99)
print(grid)
print(snap is grid, snap[0] is grid[0])`,
    notes: {
      3: `\`list(grid)\` builds a genuinely new outer list. But what it fills it with is what
\`grid\` held — and what \`grid\` held is the inner lists **themselves**, not copies of them.

New box. Same contents.`,
      4: `Read this line, then watch \`grid\` in the panel. We never mention \`grid\` — and \`grid\`
changes anyway, because \`snap[0]\` and \`grid[0]\` are one list with two ways in.`,
      6: `Two questions at once. \`snap is grid\` → **False**: the outer lists really are
separate objects. \`snap[0] is grid[0]\` → **True**: the row inside is one and the same.

That gap is exactly what "shallow" means.`,
    },
  },
  predict: {
    code: `a = [1, 2]
b = a[:]
c = (a, b)
a.append(3)
print(c)`,
    question: 'What does this print?',
    choices: ['([1, 2], [1, 2])', '([1, 2, 3], [1, 2])', '([1, 2, 3], [1, 2, 3])', '([1, 2], [1, 2, 3])'],
    answerIndex: 1,
    explain: `\`([1, 2, 3], [1, 2])\`.

Two things happening at once. \`b = a[:]\` made a real copy, so \`b\` doesn't follow
\`a\` — it stays \`[1, 2]\`.

And the interesting one: \`c\` is a **tuple**, and the tuple changed. Not really —
a tuple freezes **which objects** are in it, not what those objects contain. You
can never swap \`c[0]\` for a different list, but \`c[0]\` is \`a\`, and \`a\` is
mutable, so it changed under the tuple's feet.

"Immutable" is shallower than it sounds. A tuple of lists is only as frozen as
the lists inside it.`,
  },
  fix: {
    task: `\`template\` is the blank board; \`board\` is meant to be a fresh one to play on.
It should print the blank template, then the board with a \`1\` in it — but the \`1\`
lands in both. Fix it.`,
    brokenCode: `template = [[0, 0], [0, 0]]
board = list(template)
board[0][0] = 1
print(template)
print(board)`,
    check: {
      kind: 'asserts',
      code: `assert board == [[1, 0], [0, 0]], f"board came out as {board!r} — the 1 should still land in board, expected [[1, 0], [0, 0]]."
assert template == [[0, 0], [0, 0]], f"template came out as {template!r}. No line writes to template. list(template) copied the outer list — so what were the two things inside it?"
assert template[0] is not board[0], "The outer lists are separate now, but template[0] and board[0] are still one row object with two names — write through either and both change. How deep does the copy need to go?"
assert __stdout__.strip() == "[[0, 0], [0, 0]]\\n[[1, 0], [0, 0]]", f"It should print [[0, 0], [0, 0]] then [[1, 0], [0, 0]], but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      '`list(template)` made a new outer list, and that part worked. But it filled that new list with the same two row objects `template` already held — nothing inside was copied.',
      'Each **row** needs copying too, not just the box around them. Either copy every row yourself, or ask for a copy that goes all the way down.',
      '`import copy` at the top, then `board = copy.deepcopy(template)`. (`board = [list(r) for r in template]` does the same job for one level of nesting.)',
    ],
    solution: `import copy
template = [[0, 0], [0, 0]]
board = copy.deepcopy(template)
board[0][0] = 1
print(template)
print(board)`,
  },
  stretch: {
    title: 'Why a tuple can be a dict key and a list cannot',
    body: `A dict finds things by **hashing** the key — turning it into a number
that says which shelf to look on. That only works if the key's number never
changes after you file it.

A list can change at any moment. File \`[0, 0]\` as a key, append to it, and the
entry is now on the wrong shelf — permanently lost, in a dict that still claims
to contain it. Python refuses up front instead: \`TypeError: unhashable type:
'list'\`.

A tuple can't change, so its hash can't change, so it's allowed. That's the
whole reason:

\`\`\`python
seen[(0, 0)] = "start"     # fine
seen[[0, 0]] = "start"     # TypeError
\`\`\`

Which is why grid coordinates, \`(row, col)\` pairs, and cache keys are tuples
everywhere you look — it's the only pair-shaped thing a dict will accept.

The snippet also runs the swap: \`a, b = b, a\` builds the tuple \`(b, a)\` on the
right, then unpacks it into the two names on the left. No temp variable, because
the tuple *is* the temp variable.`,
    code: `seen = {}
seen[(0, 0)] = "start"
seen[(1, 2)] = "goal"
print(seen[(1, 2)])
a, b = 1, 2
a, b = b, a
print(a, b)`,
  },
}
