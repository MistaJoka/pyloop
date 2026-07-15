import type { Level } from '../../types'

export const working: Level = {
  level: 2,
  blurb: 'Methods that change the list and hand you back nothing.',
  concept: {
    body: `Four ways to change a list **in place** — the list itself changes, no new
list is made:

\`\`\`python
xs.append(40)     # add to the end
xs.insert(0, 5)   # add at a position
xs.remove(20)     # delete the first 20 you find
xs.pop()          # remove the last item AND return it
\`\`\`

Now the part that costs people hours. \`append\`, \`insert\` and \`remove\` return
**\`None\`**. They changed the list; there was nothing left to hand back.

So this:

\`\`\`python
xs = xs.append(4)
\`\`\`

appends 4 — and then stores \`None\` over the top of your list. The list is gone.
No error, no warning. \`xs\` is just \`None\` now, and the crash arrives three lines
later somewhere innocent.

The rule: **if a method changes the thing, don't assign its result.**`,
    aiFraming: `\`None\` where a collection should be is one of the most common
bugs in real Python, and it's brutal precisely because it's silent — the mistake
happens on one line and the traceback appears on another.

You'll meet the same shape everywhere. \`df.drop(...)\` in pandas returns a new
frame and leaves the original alone; \`df.drop(..., inplace=True)\` changes it and
returns \`None\`. Same two behaviours, same trap, bigger data. The question "does
this change the thing or return a new thing?" is one you'll be asking of every
library you touch, for good.`,
  },
  watch: {
    code: `xs = [10, 20, 30]
xs.append(40)
xs.insert(0, 5)
xs.remove(20)
last = xs.pop()
print(xs, last)`,
    notes: {
      3: `\`insert\` takes **two** things: the position to put it at, and the item. \`insert(0, 5)\`
means "make 5 the new first item" — everything already in the list slides up one slot.`,
      4: `\`remove\` deletes by **value**, not by position. It hunts for the first \`20\` and
removes it. If there's no \`20\` at all, it raises \`ValueError\` rather than shrugging.`,
      5: `\`pop\` is the odd one out: it removes the last item **and hands it to you**. That's
why assigning it is fine here — \`last\` really does get \`40\`.

The other three return \`None\`, and assigning them destroys your list.`,
    },
  },
  predict: {
    code: `xs = [1, 2]
xs = xs.append(3)
print(xs)`,
    question: 'What does this print?',
    choices: ['[1, 2, 3]', '[1, 2]', 'None', '[None]'],
    answerIndex: 2,
    explain: `\`None\`.

The append **worked** — 3 really did go on the end of that list. Then \`=\` stored
\`append\`'s return value into \`xs\`, and that return value is \`None\`. The name now
points at \`None\`, and the list it used to point at is gone with nothing holding
it.

So the line does two things: the thing you wanted, then the thing that undoes
your access to it. Drop the \`xs = \` and it's correct.`,
  },
  fix: {
    task: `This should print \`[1, 2, 3, 4]\`, but it prints \`None\`. Fix it.`,
    brokenCode: `xs = [1, 2, 3]
xs = xs.append(4)
print(xs)`,
    check: {
      kind: 'asserts',
      code: `assert xs is not None, "xs is None. The append itself worked fine — so what did the = store into xs afterwards?"
assert xs == [1, 2, 3, 4], f"xs came out as {xs!r}, expected [1, 2, 3, 4]."
assert __stdout__.strip() == "[1, 2, 3, 4]", f"It should print [1, 2, 3, 4], but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      '`xs.append(4)` already changed the list. Look at what the whole line does *after* that — the `=` stores something into `xs`.',
      "`append` has nothing to give back, so it gives back `None`. Assigning that to `xs` throws the list away. You don't need the assignment at all.",
      '`xs.append(4)` on its own line — no `xs = ` in front of it. The method changes `xs` directly.',
    ],
    solution: `xs = [1, 2, 3]
xs.append(4)
print(xs)`,
  },
  stretch: {
    title: 'Who returns None, and who gives you something',
    body: `It's worth knowing which side of the line each method sits on.

**Change the list, return \`None\`** — never assign these:
\`append\`, \`insert\`, \`remove\`, \`extend\`, \`sort\`, \`reverse\`, \`clear\`

**Hand you something back** — assigning these is the point:
\`pop\` (the item), \`index\` (the position), \`count\` (how many), \`copy\` (a new list)

Run the snippet and you can see it directly: printing \`xs.append(9)\` prints
\`None\`, printing \`xs.sort()\` prints \`None\`, but \`xs.pop()\` prints the item it
took.

There's a design idea underneath the split, and it's not arbitrary: a method
either changes the thing **or** returns a new answer about it, never both. Once
you see the pattern you can usually guess which one you're holding — and \`sort\`
being on the \`None\` side is the whole of the next level.`,
    code: `xs = [3, 1, 2]
print(xs.append(9))
print(xs.sort())
print(xs)
print(xs.pop())`,
  },
}
