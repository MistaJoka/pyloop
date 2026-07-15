import type { Level } from '../../types'

export const fluent: Level = {
  level: 3,
  blurb: 'Per-instance state vs. one shared copy — and the classic bug.',
  concept: {
    body: `Two dogs, two names. Attributes set in \`__init__\` are **per instance** — \`a.name\`
and \`b.name\` are separate storage, because \`self.name = name\` ran twice, once per object.

But a name assigned in the **class body** is different:

\`\`\`python
class Dog:
    species = "canis"        # ONE copy. Every dog shares it.
    def __init__(self, name):
        self.name = name     # one per dog.
\`\`\`

\`species\` lives on the class, not on any dog. \`a.species\` finds it by looking on \`a\`,
missing, and falling back to \`Dog\`.

Harmless for a constant. **Ruinous for a list** — one \`[]\` in the class body is one list
for the entire program, and every instance appends to it. That's the bug this level is
about, and it's a rite of passage.

(Also here: \`__repr__\`. One method, and the panel stops showing hex addresses.)`,
    aiFraming: `"Shared by default" is the shape of a whole family of real bugs. Mutable defaults
(\`def f(x, cache=[])\`) are the same mistake with different syntax: the \`[]\` is evaluated
**once**, when the \`def\` runs — not once per call.

And it's why \`fit\` on a shared \`model\` object bites people who reuse one estimator across
experiments. State that looks per-run but is actually per-object is the exact same shape as
state that looks per-instance but is actually per-class. Knowing where a value physically
lives is how you stop guessing.`,
  },
  watch: {
    code: `class Dog:
    species = "canis"
    def __init__(self, name):
        self.name = name
    def __repr__(self):
        return "Dog(" + self.name + ", " + self.species + ")"

a = Dog("Rex")
b = Dog("Ada")
print(a, b)
Dog.species = "dog"
print(a, b)
a.name = "Rexy"
print(a, b)`,
    notes: {
      2: `A **class attribute**. It's assigned in the class body, so it runs once — when the
class is defined — and belongs to \`Dog\` itself. There is exactly one \`species\` string for
every dog that will ever exist.

Compare line 4: that runs once *per instance*, so each dog gets its own \`name\`.`,
      5: `Without this, lines 10/12/14 would print two hex addresses and teach you nothing.
\`__repr__\` returns the string Python shows when it needs to display the object — in \`print\`,
in a list, in the variables panel.`,
      11: `Changing it on the **class** changes it for every instance at once, including
ones that already exist. Neither dog was touched — they never had a \`species\` of their own
to begin with. They just look it up.`,
      13: `Changing an **instance** attribute touches exactly one dog. That's the contrast:
line 11 moved both, this line moves one.`,
    },
  },
  predict: {
    code: `class Cart:
    items = []
    def add(self, x):
        self.items.append(x)

a = Cart()
b = Cart()
a.add("apple")
print(b.items)`,
    question: 'What does this print?',
    choices: ["['apple']", '[]', "['apple', 'apple']", 'None'],
    answerIndex: 0,
    explain: `\`['apple']\`. Nobody added anything to \`b\` — and \`b\`'s cart has an apple in it.

\`items = []\` is in the class body, so that list was made **once**, when the class was
defined. Both carts look up the same list object. \`self.items.append(x)\` doesn't assign
anything to \`self\`; it reaches the one shared list and mutates it.

The tell: \`self.items.append(...)\` **reads** \`self.items\` and then changes what it found.
Only \`self.items = ...\` would have given \`a\` a list of its own.`,
  },
  fix: {
    task: `Each cart should hold only what was added to it — \`['apple'] ['pear']\`.
Instead both carts hold everything. Fix it.`,
    brokenCode: `class Cart:
    items = []
    def add(self, x):
        self.items.append(x)

a = Cart()
b = Cart()
a.add("apple")
b.add("pear")
print(a.items, b.items)`,
    check: {
      kind: 'asserts',
      code: `assert 'Cart' in dir(), "There's no class called Cart anymore — keep it."
x = Cart()
y = Cart()
x.add("a")
assert y.items == [], f"Nothing was added to the second cart, yet it holds {y.items}. How many times did the line that creates that list actually run — once ever, or once per cart?"
assert x.items == ["a"], f"The cart that got 'a' holds {x.items}. It should hold exactly ['a']."
z = Cart()
assert z.items == [], f"A brand new cart already holds {z.items}. Every cart has to start from a list of its very own."
assert __stdout__.strip() == "['apple'] ['pear']", f"It should print ['apple'] ['pear']; it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      'Ask when `items = []` runs. Not "once per cart" — count again. It is in the class body, and the class body runs one time, at definition.',
      'You need a fresh list per cart, so it has to be created by code that runs once per cart. There is exactly one method that fits that description.',
      'Delete `items = []` from the class body and give `Cart` an `__init__` that does `self.items = []`. Now every cart is handed its own empty list on the way out.',
    ],
    solution: `class Cart:
    def __init__(self):
        self.items = []
    def add(self, x):
        self.items.append(x)

a = Cart()
b = Cart()
a.add("apple")
b.add("pear")
print(a.items, b.items)`,
  },
  stretch: {
    title: 'Where does a name actually get looked up?',
    body: `\`a.species\` isn't a lookup in one place. Python checks the **instance** first, then
falls back to the **class**:

\`\`\`python
a = Dog("Rex")
a.species          # not on a → found on Dog → "canis"
a.species = "wolf" # now it IS on a — this creates a new instance attribute
Dog.species        # still "canis". Untouched.
\`\`\`

So assigning through an instance never edits the class attribute — it **shadows** it. Which
is exactly why the cart bug is a *mutation* bug and not an *assignment* bug: \`self.items = []\`
would have shadowed the shared list harmlessly, and \`self.items.append(x)\` mutated it instead.

You can see both layers:

\`\`\`python
print(a.__dict__)     # {'name': 'Rex', 'species': 'wolf'}  ← just this dog
print(Dog.__dict__)   # the class body: species, __init__, __repr__...
\`\`\`

An object is, more or less, a dict with a pointer to its class. That's the whole model.`,
    code: `class Dog:
    species = "canis"
    def __init__(self, name):
        self.name = name

a = Dog("Rex")
a.species = "wolf"
print(a.species, Dog.species)
print(a.__dict__)`,
  },
}
