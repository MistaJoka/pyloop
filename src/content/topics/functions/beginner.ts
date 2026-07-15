import type { Level } from '../../types'

export const beginner: Level = {
  level: 1,
  blurb: 'def writes the recipe. Calling it is what cooks.',
  concept: {
    body: `\`def\` gives a block of code a **name**. It does not run it.

\`\`\`python
def greet(name):
    print("hi", name)

greet("ana")
\`\`\`

The \`def\` line runs **once**, at definition — and all it does is hang the label
\`greet\` on that indented block. Nothing prints. The body is asleep.

\`greet("ana")\` is what wakes it. The parentheses are the verb. \`name\` is just a
name Python gives to whatever you passed in, for the length of that one call.

Watch the trace: execution hits line 1, skips straight over the body, and only
jumps back up into it when the call happens. Twice, if you call it twice.`,
    aiFraming: `Defining and calling being separate steps is the whole reason a pipeline
can exist. You define \`clean\`, \`tokenize\`, \`embed\` — nothing runs. Then something
else decides the order, decides what to skip because it's cached, decides to run
three of them at once.

Code that *does* things the moment it's read can't be scheduled, cached or
reordered. Code that only defines named blocks can. Every framework you'll touch
— every task runner, every training loop, every agent tool — is built on that gap
between "this exists" and "this runs".`,
  },
  watch: {
    code: `def greet(name):
    print("hi", name)

print("before")
greet("ana")
greet("bo")
print("after")`,
    notes: {
      1: `This runs **once**, right now, and it does not print anything. All it does is
create a thing called \`greet\` and point it at the indented block below.

Watch the next step: execution does **not** go to line 2. It jumps to line 4. The body
is defined, not run.

\`name\` in the parentheses is a **parameter** — a placeholder. It has no value yet,
because nobody has called anything yet.`,
      5: `Here's the call. The parentheses are what actually runs the body.

Step through it and watch the WATCH panel: it tells you you're **inside greet** now, and
the variables shown are greet's own. \`name\` is \`"ana"\` — it got that value from the
parentheses here, at the call.

When the body finishes, you land back on line 6 and the outer variables return. They
were never gone; they were paused underneath.`,
    },
  },
  predict: {
    code: `print("A")

def f():
    print("B")

print("C")
f()`,
    question: 'What does this print?',
    choices: ['A\nB\nC', 'A\nC\nB', 'A\nC', 'B\nA\nC'],
    answerIndex: 1,
    explain: `\`A\`, then \`C\`, then \`B\`.

The \`def\` on line 3 runs in order, like every other line — but running a \`def\`
means "make a function named \`f\`", not "print B". So Python walks straight past
line 4 to line 6 and prints \`C\`.

\`B\` only appears when line 7 calls \`f()\`. The body's position in the file has
nothing to do with when it runs. **Definition order and execution order are two
different things.**`,
  },
  fix: {
    task: `This should print \`hi ana\`. It prints nothing at all — and it doesn't crash,
which is the clue. Nothing is wrong with the function.`,
    brokenCode: `def greet(name):
    print("hi", name)`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
assert any(isinstance(n, ast.FunctionDef) and n.name == 'greet' for n in ast.walk(tree)), "The greet function is gone. It wasn't the broken part — put it back."
assert any(isinstance(n, ast.Call) and getattr(n.func, 'id', None) == 'greet' for n in ast.walk(tree)), "greet is defined but nothing ever calls it. What actually makes a function body run?"
assert __stdout__.strip() == "hi ana", f"It should print 'hi ana', but it printed {__stdout__.strip()!r}. Is 'ana' getting as far as the parameter?"`,
    },
    hints: [
      "No error means Python read every line happily. So the body isn't broken — it just never ran. What did the `def` line actually *do*?",
      '`def` only names the block. Something has to say "now, please" — and that something has parentheses.',
      '`greet("ana")` on a new line, not indented. The parentheses run the body; `"ana"` is what `name` becomes for that call.',
    ],
    solution: `def greet(name):
    print("hi", name)

greet("ana")`,
  },
  stretch: {
    title: 'Why the body is allowed to mention things that do not exist yet',
    body: `This is legal:

\`\`\`python
def show():
    print(message)

message = "now I exist"
show()
\`\`\`

\`message\` doesn't exist when the \`def\` runs. Python doesn't care — it isn't
*reading* the body yet, only filing it away. The names inside get looked up at
**call** time, and by then \`message\` is there.

Flip the last two lines and it explodes. Same code, same definition, different
moment.

This is the same fact as the level, from the other side: \`def\` files, calling
runs. Everything in the body is a promise about the future.`,
    code: `def show():
    print(message)

message = "now I exist"
show()`,
  },
}
