import type { Level } from '../../types'

export const working: Level = {
  level: 2,
  blurb: 'Methods, and the trick that makes `self` stop being weird.',
  concept: {
    body: `A **method** is just a function that lives inside the class body. What makes
it special is one piece of sleight of hand:

\`\`\`python
d.learn("sit")      # what you write
Dog.learn(d, "sit") # what Python actually runs
\`\`\`

Those are the same call. **The dot passes the object in as the first argument.** That's
all \`self\` has ever been — the thing on the left of the dot, handed to the function
as a parameter.

So a method has two kinds of variable in it, and the difference is everything:

- \`self.tricks\` — an **attribute**. On the object. Survives the call, still there next time.
- \`trick\` — a **local**. In the frame. Gone the moment the method returns.

Anything the object should *remember* goes on \`self\`. Everything else is scratch paper.`,
    aiFraming: `\`model.fit(X, y)\` is \`LogisticRegression.fit(model, X, y)\`. Nothing else.

Which explains the thing that mystifies everyone: why you call \`fit\` and then call
\`predict\` with no arguments about training. \`fit\` wrote the learned weights onto \`self\`.
\`predict\` reads them off \`self\`. The object is the memory between the two calls — same
mechanism as \`self.tricks\`, just with more matrices in it.`,
  },
  watch: {
    code: `class Dog:
    def __init__(self, name):
        self.name = name
        self.tricks = 0
    def learn(self, trick):
        self.tricks = self.tricks + 1
        return self.name + " knows " + str(self.tricks)
    def __repr__(self):
        return "Dog(" + self.name + ")"

d = Dog("Rex")
print(d.learn("sit"))
print(d.learn("roll"))
print(Dog.learn(d, "beg"))
print(d)`,
    notes: {
      5: `A method is a plain \`def\` that happens to live in a class body. \`self\` is not a
keyword — it's the first parameter, and you could legally call it anything. Everyone calls it
\`self\`, so you do too.

\`trick\` is scratch: it exists for the length of one call and is never stored.`,
      6: `The line that matters. \`self.tricks\` is read, incremented, and written **back onto
the object** — so the next call picks up where this one left off.

Had it said \`tricks = tricks + 1\`, you'd get a local that dies on return, and the count
would be stuck at 1 forever.`,
      14: `Same call as \`d.learn("beg")\`, spelled out longhand. Look at the frame it opens:
identical to the ones above it — \`self\` is \`d\`, \`trick\` is \`"beg"\`.

The dot isn't magic. It's an argument-passing convention with nice syntax.`,
      9: `\`__repr__\` is what Python calls when it needs to *show* your object. Without it,
line 15 would print \`<__main__.Dog object at 0x...>\`.`,
    },
  },
  predict: {
    code: `class Tally:
    def __init__(self):
        self.total = 0
    def add(self, n):
        step = n * 2
        self.total = self.total + step
        return step

t = Tally()
t.add(3)
t.add(4)
print(t.total)`,
    question: 'What does this print?',
    choices: ['14', '8', '7', '6'],
    answerIndex: 0,
    explain: `\`14\`. Two calls: \`add(3)\` puts 6 on the total, \`add(4)\` adds 8. 6 + 8 = 14.

\`step\` is a local — it's 6, then it's gone, then it's 8, then it's gone. Nothing carries
across the two calls except \`self.total\`, because that one is written onto the object.

That's the whole division of labour in a method: \`self.x\` remembers, \`x\` doesn't.`,
  },
  fix: {
    task: `Three clicks should print \`1\`, \`2\`, \`3\`. It prints \`1\` three times — the
counter forgets. Fix it.`,
    brokenCode: `class Clicker:
    def __init__(self):
        self.count = 0
    def click(self):
        count = 0
        count = count + 1
        return count

c = Clicker()
print(c.click())
print(c.click())
print(c.click())`,
    check: {
      kind: 'asserts',
      code: `assert 'Clicker' in dir(), "There's no class called Clicker anymore — keep it."
c2 = Clicker()
got = [c2.click(), c2.click(), c2.click()]
assert got == [1, 2, 3], f"Three clicks on a fresh Clicker gave {got}, not [1, 2, 3]. Between two calls, the method's frame is gone — so where does a number have to live to still be there next time?"
c3 = Clicker()
assert c3.click() == 1, f"A brand new Clicker's first click returned {c3.click()}, not 1. Each clicker should start from its own zero — is the count on the instance?"
assert __stdout__.split() == ["1", "2", "3"], f"It should print 1, 2 and 3 on separate lines; it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      '`__init__` already made a counter that lives on the object. Now read `click` — is it touching that one, or making a brand new one?',
      "`count = 0` inside the method creates a *local*, reset on every call and discarded on every return. The attribute set up in `__init__` is spelled differently.",
      'Delete the `count = 0` line and make the other one `self.count = self.count + 1`, then `return self.count`. Read it, add to it, store it back on the object.',
    ],
    solution: `class Clicker:
    def __init__(self):
        self.count = 0
    def click(self):
        self.count = self.count + 1
        return self.count

c = Clicker()
print(c.click())
print(c.click())
print(c.click())`,
  },
  stretch: {
    title: 'The dot, in slow motion',
    body: `You can pull a method off an object without calling it, and look at it:

\`\`\`python
print(Dog.learn)   # <function Dog.learn at 0x...>
print(d.learn)     # <bound method Dog.learn of Dog(Rex)>
\`\`\`

\`Dog.learn\` is a plain function that wants two arguments. \`d.learn\` is a **bound
method** — the same function with \`d\` already pre-filled into the first slot. That's
what the dot builds for you, on the spot.

Which is why this works:

\`\`\`python
speak = d.learn
speak("shake")    # d is still in there
\`\`\`

You handed the method around like any other value and it dragged its object along.
No \`self\` in sight, and it still knows which dog. \`self\` was never a keyword — it was
a parameter that got filled in early.`,
    code: `class Dog:
    def __init__(self, name):
        self.name = name
    def learn(self, trick):
        return self.name + " learned " + trick

d = Dog("Rex")
speak = d.learn
print(speak("shake"))`,
  },
}
