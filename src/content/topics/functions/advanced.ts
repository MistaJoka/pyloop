import type { Level } from '../../types'

export const advanced: Level = {
  level: 4,
  blurb: 'Scope — what a function can change out from under you, and what it cannot.',
  concept: {
    body: `Calling a function builds a **frame**: a fresh, private set of variables that
exists only for that one call and is thrown away at \`return\`.

So a name inside doesn't touch a name outside. Even the same name:

\`\`\`python
def f(n):
    n = 99        # rebinds f's own n. The caller's variable is untouched.
\`\`\`

But there's a hole, and it's the one that bites:

\`\`\`python
def f(items):
    items.append(9)   # the caller's list really does change
\`\`\`

Nothing was copied. \`items\` and the caller's list are **two names for one
object**. Rebinding a parameter points your name somewhere else — private.
Mutating the object your name points at — visible to everyone holding it.

\`n = n + 1\` is invisible outside. \`items.append(x)\` is not. Same-looking
function, opposite blast radius.`,
    aiFraming: `This is where "a function is a contract" gets teeth. Inputs in, value
out, **nothing else touched** — that's the definition of a *pure* function, and
purity is what makes the rest work. Pure means you can cache it (same input, same
answer, forever), reorder it, run it on eight cores, test it with one assert.

The moment a function mutates something it was merely handed, all of that dies at
once. The cache is now lying. The parallel run is a race. The test passes alone
and fails in the suite. This is exactly why \`df.drop(...)\` returns a new frame
instead of editing yours, and why every function that *does* mutate in place
either says so in its name or ruins someone's afternoon.`,
  },
  watch: {
    code: `def bump(n, items):
    n = n + 100
    items.append(n)
    return n

count = 1
data = [1]
result = bump(count, data)
print(count, data, result)`,
    notes: {
      1: `When this gets **called**, Python builds a new **frame** — a private set of
variables belonging to that one call. \`n\` and \`items\` live there and nowhere else, and
they die at \`return\`.

Step into the call and watch the panel: it says you're **inside bump**, showing bump's
own variables. \`count\` and \`data\` vanish from view. They're not gone — the caller's
frame is paused underneath, waiting.`,
      2: `\`n\` was handed the value \`1\`. This points the local name \`n\` at a new number,
\`101\`.

That's all it does. It does **not** reach back and change \`count\`. \`n\` is bump's name
for the value, not a wire to the caller's variable. Step past line 9 and confirm: \`count\`
is still \`1\`.`,
      3: `This line is a completely different animal from line 2.

\`items\` and \`data\` are two names for **one list**. No copy was made when it was passed.
\`.append\` changes that shared object, so the caller sees it — and will still see it after
bump's frame is long gone.

Rebinding a parameter: private. Mutating what it points at: everyone's problem.`,
      8: `The call. Step through it slowly — this is the whole level.

The caller's variables get replaced by bump's, run the body, then come back with
\`result\` added. Two of the three things on line 9 survived the trip unchanged. One
didn't.`,
    },
  },
  predict: {
    code: `def reset(items):
    items = []
    return items

data = [1, 2]
reset(data)
print(data)`,
    question: 'What does this print?',
    choices: ['[]', '[1, 2]', 'None', '[1, 2, []]'],
    answerIndex: 1,
    explain: `\`[1, 2]\`. \`reset\` did nothing at all.

\`items = []\` builds a **brand new empty list** and points the local name \`items\`
at it. The old list — the one \`data\` still holds — was never touched. Then the
frame dies and takes the new list with it, because line 6 threw the return value
away.

The killer is how close this is to working. \`items.clear()\` would print \`[]\`,
because that reaches through the name and changes the actual object. So would
\`data = reset(data)\`. \`items = []\` only ever changed where one dead name pointed.`,
  },
  fix: {
    task: `\`add_tag\` should add a tag to the list it was handed, so line 6 prints
\`['a', 'b']\`. It prints \`['a']\`. Nothing crashes — the function just doesn't
reach the caller's list.`,
    brokenCode: `def add_tag(tags, tag):
    tags = tags + [tag]

labels = ["a"]
add_tag(labels, "b")
print(labels)`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
fn = next((n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef) and n.name == 'add_tag'), None)
assert fn is not None, "add_tag is gone. The fix goes inside it — keep it."
bare = [n for n in ast.walk(tree) if isinstance(n, ast.Expr) and isinstance(n.value, ast.Call) and getattr(n.value.func, 'id', None) == 'add_tag']
assert bare, "The call to add_tag should still stand alone on its own line. Reassigning the result (labels = add_tag(...)) is a fine design, but it dodges the question this level asks: can a function change a list it was handed, without handing anything back?"
assert labels == ['a', 'b'], f"labels is {labels}. 'tags = tags + [tag]' builds a NEW list and points the local name at it — at what moment did the caller's list ever change?"
assert __stdout__.strip() == "['a', 'b']", f"Expected ['a', 'b'], got {__stdout__.strip()!r}."`,
    },
    hints: [
      "Step it. Inside `add_tag`, `tags` really does become `['a', 'b']` — and then the frame dies and it's gone. So the work happened; it just happened somewhere private.",
      '`tags = ...` points the local name at a *new* list. The caller\'s list is a different object that was never touched. You need a method that changes the existing list rather than building a replacement.',
      "`tags.append(tag)` — no `=`, no new list. It reaches through the name and mutates the one object both `tags` and `labels` refer to.",
    ],
    solution: `def add_tag(tags, tag):
    tags.append(tag)

labels = ["a"]
add_tag(labels, "b")
print(labels)`,
  },
  stretch: {
    title: 'global, and why the answer is almost always no',
    body: `There *is* a way to reach out and rebind a caller's variable:

\`\`\`python
count = 0

def bump():
    global count
    count = count + 1
\`\`\`

It works. Use it anyway and you've built a function whose behaviour depends on
invisible state, whose result changes depending on what ran before it, and which
can't be tested without setting up the world around it first.

That's every property from the contract, gone, to save passing one argument.

Read \`global\` as a smell, not a tool. If a function needs a value, take it as a
parameter. If it produces one, \`return\` it. The whole point of the frame is that
it's a wall — \`global\` is a hole you punch in your own wall.`,
    code: `count = 0

def bump():
    global count
    count = count + 1

bump()
bump()
print(count)`,
  },
}
