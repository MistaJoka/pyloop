import type { Level } from '../../types'

export const master: Level = {
  level: 5,
  blurb: 'Dunders: make `len()`, `==` and `for` work on your own object.',
  concept: {
    body: `Here's the thing nobody says out loud: \`len(x)\` has no idea what \`x\` is. It just
calls \`x.__len__()\`. That's the whole implementation.

The same goes for nearly all of Python's syntax:

| you write | Python calls |
|---|---|
| \`len(x)\` | \`x.__len__()\` |
| \`x[i]\` | \`x.__getitem__(i)\` |
| \`x == y\` | \`x.__eq__(y)\` |
| \`print(x)\` | \`x.__repr__()\` |

So the built-in syntax isn't reserved for built-in types. It's an **interface**, and it's
open. Implement \`__len__\` and \`len()\` starts working on your class. Implement \`__getitem__\`
and both \`x[i]\` **and** \`for i in x\` start working, for free — because \`for\` will happily
index from 0 until it hits \`IndexError\`.

That's the difference between a class with a \`size()\` method and a class that *is* a Python
object.`,
    aiFraming: `This is the answer to "why does a DataFrame feel like a builtin?"

\`df[col]\` is \`df.__getitem__(col)\` — a method someone wrote, that you can read. \`len(dataset)\`
is \`dataset.__len__()\`, which is why torch makes you implement exactly \`__len__\` and
\`__getitem__\` on a \`Dataset\`: the DataLoader doesn't want your API, it wants the *protocol*,
and then it can shuffle and batch anything that speaks it.

Nothing in those libraries is a language feature you don't have. \`a * b\` on two tensors is
\`__mul__\`. Squint at any of it and there's a class you could have written. That's what the
last rung of this course is actually for: the magic was never magic, it was dunders.`,
  },
  watch: {
    code: `class Deck:
    def __init__(self, cards):
        self.cards = cards
    def __len__(self):
        return len(self.cards)
    def __getitem__(self, i):
        return self.cards[i]

d = Deck(["A", "K", "Q"])
print(len(d))
print(d[1])
for c in d:
    print(c)`,
    notes: {
      4: `The method \`len()\` calls. Nothing more to it — \`len(d)\` on line 10 lands *here*, in a
frame of its own. It has to return an int.

Note it delegates: the \`len\` on line 5 is on a plain list, so no infinite regress.`,
      6: `The method the square brackets call. \`d[1]\` on line 11 is \`d.__getitem__(1)\`, with
\`i = 1\`.

And it does double duty — this one method is also what makes line 12's \`for\` work.`,
      12: `No \`__iter__\` anywhere, and the loop runs anyway. \`for\` falls back to calling
\`__getitem__\` with 0, 1, 2… until it gets \`IndexError\`, which the inner list raises for you.

Watch the frames: each pass is a real call into \`__getitem__\`. One method bought you
indexing *and* iteration.`,
    },
  },
  predict: {
    code: `class P:
    def __init__(self, x):
        self.x = x
    def __eq__(self, other):
        return self.x == other.x

a = P(3)
b = P(3)
print(a == b, a is b)`,
    question: 'What does this print?',
    choices: ['True False', 'False False', 'True True', 'False True'],
    answerIndex: 0,
    explain: `\`True False\`. \`a == b\` calls \`a.__eq__(b)\`, which compares the \`x\` values — so
"equal" now means whatever you said it means.

\`a is b\` asks a different question entirely: *are these the same object?* No — they're two
separate objects that happen to agree. \`is\` can't be overridden; it's identity, always.

Without \`__eq__\`, the default is identity, and \`a == b\` would have been \`False\` too — which is
why two \`Point(3, 4)\`s that look identical are unequal until someone writes this method.`,
  },
  fix: {
    task: `\`Bag\` works, but only if you know its private vocabulary — \`b.size()\`, \`b.at(0)\`.
Teach it to speak Python instead: rename the two methods so \`len(b)\` and \`b[0]\` work, and use
those on the last line. Same output.`,
    brokenCode: `class Bag:
    def __init__(self, stuff):
        self.stuff = stuff
    def size(self):
        return len(self.stuff)
    def at(self, i):
        return self.stuff[i]

b = Bag(["a", "b", "c"])
print(b.size(), b.at(0))`,
    check: {
      kind: 'asserts',
      code: `assert 'Bag' in dir(), "There's no class called Bag anymore — keep it."
assert hasattr(Bag, "__len__"), "len() never looks for a method called size. It calls one specific dunder on your object, every time, on anything — which one?"
assert hasattr(Bag, "__getitem__"), "Square brackets are a method call too: b[0] is really b.__getitem__(0). That method doesn't exist on Bag yet."
bag = Bag(["x", "y"])
assert len(bag) == 2, f"len(Bag(['x','y'])) gave {len(bag)}, not 2. Is __len__ returning the length of the list inside?"
assert bag[1] == "y", f"bag[1] gave {bag[1]!r}, not 'y'. Is __getitem__ indexing into self.stuff with the i it was handed?"
assert list(bag) == ["x", "y"], f"Looping over the bag gave {list(bag)}. __getitem__ with plain integer indexes is all a for-loop needs — it counts up until IndexError, so it should just work."
assert __stdout__.strip() == "3 a", f"It should still print 3 a; it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      'The methods do the right work — they just have names only you know. Which two names does Python itself go looking for when it sees `len(b)` and `b[0]`?',
      'Rename `size` to `__len__` and `at` to `__getitem__`. The bodies do not change at all; only the names do.',
      'Rename both, then change the last line to `print(len(b), b[0])`. Try `for x in b:` too — `__getitem__` alone makes that work.',
    ],
    solution: `class Bag:
    def __init__(self, stuff):
        self.stuff = stuff
    def __len__(self):
        return len(self.stuff)
    def __getitem__(self, i):
        return self.stuff[i]

b = Bag(["a", "b", "c"])
print(len(b), b[0])`,
  },
  stretch: {
    title: 'One more method, and `sorted()` works too',
    body: `The pattern doesn't stop. \`sorted()\` doesn't know how to compare your objects — it
just calls \`<\` on them, which is \`__lt__\`:

\`\`\`python
class Card:
    def __init__(self, rank):
        self.rank = rank
    def __lt__(self, other):
        return self.rank < other.rank
\`\`\`

One method, and \`sorted(cards)\`, \`min(cards)\` and \`max(cards)\` all start working — none of
which you wrote, and none of which know anything about cards.

That's the payoff of this whole topic, and it's worth naming: you don't get access to Python's
tools by inheriting from something or registering somewhere. You get it by **answering the
right method call**. Anything that behaves like a list *is* a list, as far as \`for\` is concerned.

\`\`\`python
__add__   x + y        __contains__  x in y
__call__  x()          __enter__     with x:
\`\`\`

Every framework you'll read from here is doing this. You now know how to read it.`,
    code: `class Card:
    def __init__(self, rank):
        self.rank = rank
    def __lt__(self, other):
        return self.rank < other.rank
    def __repr__(self):
        return "Card(" + str(self.rank) + ")"

cards = [Card(7), Card(2), Card(9)]
print(sorted(cards))
print(max(cards))`,
  },
}
