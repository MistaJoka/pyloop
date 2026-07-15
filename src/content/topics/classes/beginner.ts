import type { Level } from '../../types'

export const beginner: Level = {
  level: 1,
  blurb: 'A class is a template. An instance is a thing made from it.',
  concept: {
    body: `A \`class\` is a **template**. It isn't a dog — it's the description of what
every dog has.

\`\`\`python
class Dog:
    def __init__(self, name):
        self.name = name

d = Dog("Rex")
\`\`\`

\`Dog("Rex")\` **makes one** — an *instance*. Python builds a blank object, then
immediately calls \`__init__\` on it to fill it in. Once per instance, automatically.
You never call \`__init__\` yourself.

And \`self\`? It's just the instance being worked on. It's a parameter like any
other — Python fills it in for you. \`self.name = name\` means "stick this name
**onto this dog**", which is why \`d.name\` still works long after \`__init__\` has
finished and its locals are gone.`,
    aiFraming: `Every library you'll touch in AI work is classes wearing a friendly face.
\`model = LogisticRegression()\` is exactly what you just did: build an instance,
\`__init__\` runs, the object now holds settings. \`model.fit(X, y)\` then changes what
that object holds.

The reason \`fit\` and \`predict\` know about each other is the reason \`d.name\` outlives
\`__init__\` — it's all attributes on one object. That's not a framework feature. That's
this page.`,
  },
  watch: {
    code: `class Dog:
    def __init__(self, name):
        self.name = name
        self.tricks = 0

d = Dog("Rex")
print(d.name, d.tricks)`,
    notes: {
      1: `A \`class\` statement **runs**, like everything else — watch it get its own frame.
It doesn't make a dog. It executes the indented block once, collects the \`def\`s it finds
in there, and binds the whole bundle to the name \`Dog\`.

So a class is a value sitting in a variable, made at run time. Nothing magic about it.`,
      2: `\`__init__\` is the setup method. The double underscores mean *Python calls this
one, you don't*.

Two parameters, but you only ever pass one. \`self\` is the instance being built — Python
supplies it.`,
      3: `\`self.name\` and \`name\` are **different things**. \`name\` is a local, gone the second
\`__init__\` returns. \`self.name\` is an attribute, glued to the object.

That line is the whole handoff: take the argument, park it on the instance so it survives.`,
      6: `Two things happen here, in order: a blank \`Dog\` object gets made, then \`__init__\`
runs on it with \`name="Rex"\`. Step into it — it's a frame of its own, at depth 1, with \`self\`
and \`name\` in scope.

Then \`__init__\` returns \`None\`, and *the object* is what lands in \`d\`.`,
    },
  },
  predict: {
    code: `class Box:
    def __init__(self, item):
        self.item = item
        item = "changed"

b = Box("hat")
print(b.item)`,
    question: 'What does this print?',
    choices: ['hat', 'changed', 'item', 'None'],
    answerIndex: 0,
    explain: `\`hat\`. Line 3 already copied the value onto the object. Line 4 then
reassigns the **local** \`item\` — a name inside \`__init__\`'s own frame, which is
thrown away a line later.

\`self.item\` and \`item\` were never the same box. One is on the instance, one is
in the method. Dropping \`self.\` isn't a shortcut; it's a different variable.`,
  },
  fix: {
    task: `\`Dog("Rex")\` should give a dog called \`Rex\`. Every dog comes out \`unnamed\`.
Fix it.`,
    brokenCode: `class Dog:
    def __init__(self, name):
        self.name = "unnamed"

d = Dog("Rex")
print(d.name)`,
    check: {
      kind: 'asserts',
      code: `assert 'Dog' in dir(), "There's no class called Dog anymore — keep it."
d2 = Dog("Fido")
assert d2.name == "Fido", f"Dog('Fido') came out named {d2.name!r}. __init__ is handed the name as a parameter — is it storing that parameter, or ignoring it?"
assert __stdout__.strip() == "Rex", f"It should print Rex, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      '`__init__` receives the name — look at its parameters. But look at what it actually stores on `self`. Those are two different values.',
      "The right side of `self.name = ...` is hardcoded. It should be the parameter that came in.",
      '`self.name = name` — take the argument, park it on the instance. That one line is the entire job of `__init__`.',
    ],
    solution: `class Dog:
    def __init__(self, name):
        self.name = name

d = Dog("Rex")
print(d.name)`,
  },
  stretch: {
    title: 'Why your dog prints as a hex address',
    body: `Print the dog itself, not its name, and you get something useless:

\`\`\`python
print(d)      # <__main__.Dog object at 0x173ae98>
\`\`\`

Python has no idea how you'd like a \`Dog\` shown, so it falls back to the class name
and a memory address. That's the default for *every* class you write — including in the
variables panel, which is where it actually hurts.

Give it a \`__repr__\` and it stops:

\`\`\`python
class Dog:
    def __init__(self, name):
        self.name = name
    def __repr__(self):
        return f"Dog({self.name})"
\`\`\`

\`__repr__\` returns the string Python should show when it needs to display your object.
One method, and your dogs are readable everywhere — in \`print\`, inside a list, in the
panel. It's the cheapest quality-of-life method in the language, which is why the next
level just quietly assumes it.`,
    code: `class Dog:
    def __init__(self, name):
        self.name = name
    def __repr__(self):
        return f"Dog({self.name})"

print(Dog("Rex"))`,
  },
}
