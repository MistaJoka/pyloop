import type { Level } from '../../types'

export const advanced: Level = {
  level: 4,
  blurb: 'When a class earns its keep — and when a dict was fine.',
  concept: {
    body: `Not everything deserves a class. The honest test:

**A dict is enough** when you just need to carry values around.
**A class earns its keep** when the same values keep getting passed into the same
functions — because that's data and behaviour that already belong together, held apart
by nothing but habit.

The loudest symptom is **parallel lists**:

\`\`\`python
names = ["mon", "tue"]
temps = [61, 78]
\`\`\`

These are one table pretending to be two. They're joined only by \`i\`, and nothing enforces
it — sort one, insert into one, filter one, and Tuesday silently gets Monday's temperature.
Every read costs you an index.

One list of small objects instead, and the pairing is structural. It can't drift, because
there's no seam to drift along.`,
    aiFraming: `This refactor is the entire premise of the DataFrame. \`df\` isn't a bag of columns
you keep aligned by hand — it's one object that owns the columns *and* the operations, so
\`df.sort_values("temp")\` moves every field of a row together. Rows can't shear apart, because
there's no index for you to get wrong.

Same for \`Dataset\` in torch: the thing that knows how to fetch item \`i\` and the thing that
knows how many there are are the same object, on purpose. You are about to build a very
small version of that on the next level.`,
  },
  watch: {
    code: `class Student:
    def __init__(self, name, score):
        self.name = name
        self.score = score
    def passed(self):
        return self.score >= 60
    def __repr__(self):
        return self.name + ":" + str(self.score)

rows = [Student("Ada", 91), Student("Bo", 54)]
for s in rows:
    print(s, s.passed())`,
    notes: {
      5: `The behaviour moves in with the data. "Did they pass?" is a question **about a
student**, so it lives on \`Student\` — not in a loose function that has to be handed a score
and trusted to get the right one.

That's the trade you're making: not fewer lines, but no way to pair the wrong score with the
wrong name.`,
      10: `One list of two objects, replacing two lists of two values. Each \`Student\` carries
its own name *and* score, so there's no index to keep in sync — and no way to shear them apart.

Watch each \`Student(...)\` call open its own \`__init__\` frame before the list is built.`,
      12: `Compare with the parallel-list version: \`if temps[i] > 60: print(names[i])\`.
Every read there is an index lookup you have to get right. Here, \`s\` **is** the row.`,
    },
  },
  predict: {
    code: `class Item:
    def __init__(self, name, price):
        self.name = name
        self.price = price
    def __repr__(self):
        return self.name + "/" + str(self.price)

cart = [Item("pen", 2), Item("mug", 7)]
print(cart)`,
    question: 'What does this print?',
    choices: [
      '[pen/2, mug/7]',
      'pen/2 mug/7',
      '[<__main__.Item object at 0x1>, <__main__.Item object at 0x2>]',
      "['pen/2', 'mug/7']",
    ],
    answerIndex: 0,
    explain: `\`[pen/2, mug/7]\`. Printing a list never uses \`str\` on its contents — it asks each
item for its **repr**. So \`__repr__\` is what makes a collection of your objects readable, and
without it you'd get option 3: two hex addresses, which is the default and is useless.

Note the brackets and commas come from the *list*, and the \`pen/2\` from your method. And no
quotes around them — \`__repr__\` returned a string, but Python isn't showing you a string, it's
showing you an \`Item\`.`,
  },
  fix: {
    task: `Two lists held together by nothing but \`i\` — one insert and Tuesday gets Monday's
temperature. Refactor: one class carrying a day and a temp, with a method that answers "is this
one hot?", and one list of those. Same output.`,
    brokenCode: `names = ["mon", "tue", "wed"]
temps = [61, 78, 70]
for i in range(len(names)):
    if temps[i] > 65:
        print(names[i], "hot")`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
classes = [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]
assert classes, "No class yet. The day and its temperature are one fact stored as two, joined only by an index — what would let them travel as a single value?"
methods = {f.name for c in classes for f in c.body if isinstance(f, ast.FunctionDef)}
assert '__init__' in methods, "The class has no __init__, so a reading has no way to be handed its day and its temperature when it's made."
assert methods - {'__init__', '__repr__'}, "The class holds the data but none of the behaviour, which makes it a dict with extra typing. The 'temp > 65' test is a question about a reading — where should the answer to it live?"
lits = [n for n in ast.walk(tree) if isinstance(n, ast.List) and len(n.elts) == 3 and all(isinstance(e, ast.Constant) for e in n.elts)]
assert not lits, "One of the parallel lists is still there. The move is one list of three readings, not two lists of three loose values — while both lists exist, the index can still drift."
assert __stdout__.split() == ["tue", "hot", "wed", "hot"], f"It should still print the same two hot days — tue and wed. It printed {__stdout__.strip()!r}."`,
    },
    hints: [
      'A day and a temperature are one fact. Write the class that holds both: `__init__(self, day, temp)`, storing each on `self`.',
      'Then move the test onto it. `def hot(self): return self.temp > 65` — the reading answers the question about itself, so no index is involved.',
      'Build `readings = [Reading("mon", 61), Reading("tue", 78), Reading("wed", 70)]`, then `for r in readings:` and `if r.hot(): print(r.day, "hot")`. Both old lists go away.',
    ],
    solution: `class Reading:
    def __init__(self, day, temp):
        self.day = day
        self.temp = temp
    def hot(self):
        return self.temp > 65

readings = [Reading("mon", 61), Reading("tue", 78), Reading("wed", 70)]
for r in readings:
    if r.hot():
        print(r.day, "hot")`,
  },
  stretch: {
    title: 'When the class is only data, let Python write it',
    body: `Sometimes the honest answer is "it really is just fields". Writing \`__init__\` and
\`__repr__\` by hand for that is ceremony, so the standard library does it:

\`\`\`python
from dataclasses import dataclass

@dataclass
class Reading:
    day: str
    temp: int
    def hot(self):
        return self.temp > 65
\`\`\`

That's the same class you just wrote. \`@dataclass\` reads the field list and generates
\`__init__\`, \`__repr__\` and \`__eq__\` for you — \`Reading("mon", 61) == Reading("mon", 61)\`
is \`True\`, which is *not* free otherwise (next level).

Use it when the class is a record with a little behaviour. Skip it when the object is mostly
behaviour with a little state. And notice the shape of what it saved you: nothing you didn't
already know how to write by hand.`,
    code: `from dataclasses import dataclass

@dataclass
class Reading:
    day: str
    temp: int
    def hot(self):
        return self.temp > 65

r = Reading("tue", 78)
print(r, r.hot(), r == Reading("tue", 78))`,
  },
}
