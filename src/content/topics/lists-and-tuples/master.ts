import type { Level } from '../../types'

export const master: Level = {
  level: 5,
  blurb: 'What a list costs: cheap at the end, expensive at the front, and never a vector.',
  concept: {
    body: `A list is a row of slots in memory, each slot a **pointer** to an object.
That one sentence explains everything it's good and bad at.

- \`xs.append(x)\` — **cheap**. There's spare room at the end.
- \`xs.insert(0, x)\` and \`xs.pop(0)\` — **expensive**. Every existing item shifts
  one slot to make room. A million items, a million moves. Per call.
- \`x in xs\` — **expensive**. It walks the list looking. A \`set\` or \`dict\` does
  the same check without walking.

And a list is **not a vector**:

\`\`\`python
[1, 2] + [3]      # [1, 2, 3]  — concatenate
[1, 2] * 2        # [1, 2, 1, 2] — repeat
\`\`\`

\`+\` glues, it doesn't add. It can't add: the slots are pointers to *anything*, so
Python would have to check the type of every pair at runtime before it dared.`,
    aiFraming: `This is the whole reason numpy exists, and now you can state it
properly.

A Python list gives you flexibility — any type, any slot, grow whenever — and
charges you a pointer chase and a type check per element for it. Every array
library takes that deal back: **one type, one block of memory, elementwise
operations**. Fix the type and every element is the same size, so the values sit
in one contiguous run of bytes with no pointers in between, and the CPU can add
a whole row at a time.

That's why \`arr1 + arr2\` **adds** while \`list1 + list2\` **glues**. Not a
different opinion about \`+\` — a different data structure underneath, one that
gave up "anything, anywhere" to get arithmetic and speed. When you write
\`np.array(my_list)\`, that conversion is the moment you pay for the trade.`,
  },
  watch: {
    code: `xs = [10, 20, 30]
xs.insert(0, 5)
print(xs)
print([1, 2] + [3])
print([1, 2] * 2)
print(30 in xs)`,
    notes: {
      2: `\`insert(0, 5)\` doesn't just drop 5 in — it moves 10, 20 and 30 up one slot each
first, then puts 5 in the hole. Three items: nothing. Three million: three million moves,
every time you call it.

\`append\` never does this. The room at the end is already there.`,
      4: `\`+\` on lists **concatenates** — it builds a new list with one lot of items after
the other. It does **not** add 1+3.

A numpy array with the same numbers would print \`[4 5]\`: same symbol, elementwise addition,
completely different data structure underneath.`,
      6: `\`in\` looks cheap and isn't. It starts at slot 0 and compares its way along until it
finds a match or runs out.

Inside a loop over another list, that's every item against every item — the innocent-looking
line that turns a 10-second job into an hour.`,
    },
  },
  predict: {
    code: `a = [1, 2]
b = [3, 4]
print(a + b, a * 2)`,
    question: 'What does this print?',
    choices: [
      '[4, 6] [2, 4]',
      '[1, 2, 3, 4] [2, 4]',
      '[1, 2, 3, 4] [1, 2, 1, 2]',
      '[4, 6] [1, 2, 1, 2]',
    ],
    answerIndex: 2,
    explain: `\`[1, 2, 3, 4] [1, 2, 1, 2]\`.

On lists, \`+\` **concatenates** and \`*\` **repeats**. Neither one does arithmetic
on the contents — nothing here ever looks inside a slot.

\`[4, 6] [2, 4]\` is the numpy answer: \`np.array([1,2]) + np.array([3,4])\` really
is \`[4 6]\`, and \`arr * 2\` really is \`[2 4]\`. Identical code, opposite results,
and the only difference is what the object underneath is made of.

If you ever find yourself typing \`+\` and hoping for \`[4, 6]\`, that's not a
mistake in your syntax — it's your program telling you it wanted an array.`,
  },
  fix: {
    task: `This builds \`[3, 2, 1]\` by inserting each number at the **front**, which
shifts the whole list every single time. Get the same output using \`append\`
instead — no \`insert\` anywhere.`,
    brokenCode: `xs = []
for n in [1, 2, 3]:
    xs.insert(0, n)
print(xs)`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
assert not any(isinstance(n, ast.Attribute) and n.attr == "insert" for n in ast.walk(tree)), "The output is right, but insert is still in there — and every insert(0, n) shifts the whole list up a slot. That shifting is the cost we're trying to delete."
assert any(isinstance(n, ast.Attribute) and n.attr == "append" for n in ast.walk(tree)), "No append anywhere. Build the list up at the cheap end first, and worry about the order afterwards."
assert xs == [3, 2, 1], f"xs came out as {xs!r}, expected [3, 2, 1]."
assert __stdout__.strip() == "[3, 2, 1]", f"It should print [3, 2, 1], but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      '`insert(0, n)` has to move every item already in the list up one slot to make room. Three items, who cares. A million items, a million moves — and that happens on *every* call.',
      '`append` puts the item where there is already room, so nothing shifts. Build the list in the order the numbers arrive, and fix the order once, at the end.',
      '`xs.append(n)` inside the loop, then `xs.reverse()` after it. One cheap pass to build, one cheap pass to flip — instead of a shift per item. (`reverse()` changes `xs` and returns `None`, so no `xs = ` in front of it.)',
    ],
    solution: `xs = []
for n in [1, 2, 3]:
    xs.append(n)
xs.reverse()
print(xs)`,
  },
  stretch: {
    title: 'The picture: a box of pointers, and the block of bytes that replaces it',
    body: `Here's what a list actually is in memory. \`[1, "two", [3], None]\` is a
contiguous run of **pointers** — four equal-sized addresses sitting side by side.
The objects they point at are scattered elsewhere on the heap, each a different
size, each carrying its own type tag. Reading \`xs[2]\` means: jump to slot 2,
follow the address, land somewhere else entirely, read the type tag, then work
out what to do. That indirection is the price of being able to put *anything* in
any slot — which the snippet demonstrates: four slots, four different types, no
complaint.

A numpy array of a million floats is the opposite deal: **one** type declared
once, so every value is exactly 8 bytes, so they can live in one unbroken block
with no pointers and no per-item type tags. \`arr[2]\` is arithmetic — start + 2×8
— and the value is right there. A 2-D array is that same flat block read in
**row-major** order: row 0's values, then row 1's, nose to tail. Which is why
walking a numpy array along its rows is fast and walking it down its columns
jumps around memory and isn't — same data, same loop, different speed, purely
because of the order the bytes are laid out in.

So: flexible box of pointers, or rigid block of bytes. Every array library ever
written is that one trade. You now know what it's trading away.`,
    code: `mixed = [1, "two", [3], None]
for item in mixed:
    print(type(item).__name__)`,
  },
}
