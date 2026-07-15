import type { Level } from '../../types'

export const advanced: Level = {
  level: 4,
  blurb: 'Two names, one list — names point at objects, they do not hold them.',
  concept: {
    body: `Back at Level 1, \`y = x\` copied a value. That was a half-truth.

What \`=\` really does is point a name at an **object**. So after \`b = a\`, there
is still only **one list** — with two names on it.

\`\`\`python
a = [1, 2]
b = a
b.append(3)
print(a)      # [1, 2, 3]
\`\`\`

You never touched \`a\`. But \`a\` and \`b\` are the same object, so a change made
through one name is visible through the other.

It never bit you with numbers because numbers and strings are **immutable** —
there's no way to change one in place, so reassigning is all you can do. Lists,
dicts and sets are **mutable**, and that's where two names on one object starts
to matter.

Two different questions, then:

- \`a == b\` — do they hold the same **contents**?
- \`a is b\` — are they the same **object**?`,
    aiFraming: `This is the bug that costs an afternoon, and it looks like corrupted
data rather than a bug.

\`backup = data\` then clean \`data\` — your backup is cleaned too, because there
was never a backup. Pass a list into a function, the function appends to it,
and the caller's list changed. Nothing crashes; the numbers are just wrong.

Numpy sharpens it: slicing a Python list copies, but slicing a numpy array
gives you a **view** into the original memory. \`arr2 = arr[:5]\` then writing to
\`arr2\` writes to \`arr\`. This is deliberate — copying gigabytes per slice would
be ruinous — which means "is this a copy or a view?" is a question you'll be
asking for the rest of your career. \`.copy()\` is how you say you meant it.`,
  },
  watch: {
    code: `a = [1, 2]
b = a
b.append(3)
print(a)
print(a is b)
c = [1, 2, 3]
print(a == c, a is c)`,
    notes: {
      2: `This does **not** make a second list. It hangs a second name on the one list that
already exists.

Nothing is copied here. That's the whole level in one line.`,
      3: `\`.append\` changes the list **in place** — it doesn't build a new one. And since
\`a\` and \`b\` name the same list, watch the variables panel: \`a\` changes on this line even
though \`a\` isn't mentioned.`,
      7: `Two different questions on one line.

\`a == c\` asks *same contents?* — yes, both are \`[1, 2, 3]\`. \`a is c\` asks *same object?*
— no, \`c\` was built separately on line 6. Equal, but not identical.`,
    },
  },
  predict: {
    code: `x = [1, 2]
y = x
y = y + [3]
print(x)`,
    question: 'What does this print?',
    choices: ['[1, 2]', '[1, 2, 3]', '[[1, 2], 3]', '[3]'],
    answerIndex: 0,
    explain: `\`[1, 2]\`. Compare this with \`y.append(3)\`, which **would** have
changed \`x\`.

\`y + [3]\` doesn't touch any existing list — it builds a **brand new** one, and
then \`=\` points \`y\` at that new list. \`x\` is left pointing at the old one,
unchanged.

That's the distinction that matters: \`append\` mutates the object; \`+\` and \`=\`
move a name to a different object. Same-looking code, opposite consequences for
everyone else holding that list.`,
  },
  fix: {
    task: `\`backup\` is meant to be a snapshot taken before the change. It should print
\`[1, 2, 3]\` then \`[1, 2, 3, 99]\` — but \`original\` gets the 99 too. Fix it.`,
    brokenCode: `original = [1, 2, 3]
backup = original
backup.append(99)
print(original)
print(backup)`,
    check: {
      kind: 'asserts',
      code: `assert backup == [1, 2, 3, 99], f"backup came out as {backup!r}, expected [1, 2, 3, 99] — the append should still happen, just not to original."
assert original == [1, 2, 3], f"original came out as {original!r}. Nothing on any line appends to original — so how did 99 get in there? What does backup = original actually copy?"
assert original is not backup, "original and backup still name the same list object, so anything done to one shows up in the other. What would make backup a separate list?"
assert __stdout__.strip() == "[1, 2, 3]\\n[1, 2, 3, 99]", f"It should print [1, 2, 3] then [1, 2, 3, 99], but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      "`backup = original` doesn't make a backup. It makes a second name for the list you already had — there's only ever been one list here.",
      'You need a genuinely new list that starts with the same contents. Copying has to be asked for explicitly; `=` will never do it.',
      '`backup = list(original)` builds a new list from the old one. (`original.copy()` and `original[:]` do the same job.)',
    ],
    solution: `original = [1, 2, 3]
backup = list(original)
backup.append(99)
print(original)
print(backup)`,
  },
  stretch: {
    title: 'Why == is almost always the one you want',
    body: `\`is\` is for identity, and there are really only two everyday uses:

\`\`\`python
if value is None:      # yes — the correct way to test for None
if name is "ana":      # no — never do this
\`\`\`

The second one sometimes works, which is what makes it dangerous. Python
quietly reuses short string objects behind the scenes, so \`is\` can come out
\`True\` for two separate strings that happen to match — and then \`False\` in a
different program for the same-looking code. Use \`==\` for values, always.

The other half of this level, kept short: immutable types can't be changed in
place, so this class of bug can't happen to them.

\`\`\`python
s = "hi"
s.upper()      # returns "HI" — s is STILL "hi"
s = s.upper()  # now s is "HI"
\`\`\`

Which is Level 1's rule again, wearing a different coat: if the result isn't
stored, it didn't happen.`,
    code: `s = "hi"
s.upper()
print(s)
s = s.upper()
print(s)`,
  },
}
