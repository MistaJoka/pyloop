import type { Level } from '../../types'

export const beginner: Level = {
  level: 1,
  blurb: 'if — run a block only when the condition is true.',
  concept: {
    body: `An \`if\` is a gate. Python asks a yes/no question, and only runs the
indented block when the answer is yes.

\`\`\`python
temp = 38
if temp > 37:
    print("fever")
print("done")
\`\`\`

\`temp > 37\` is either \`True\` or \`False\`. True → the indented line runs. False →
Python skips straight past it. \`print("done")\` isn't indented, so it isn't
inside the gate; it runs either way.

**Indentation is the gate.** It's not decoration and it's not style — it is the
only thing that says what's inside.

One more: \`=\` **assigns**, \`==\` **asks**. \`x = 5\` puts 5 in \`x\`. \`x == 5\` asks
whether \`x\` is already 5. Conditions ask, so conditions use \`==\`.`,
    aiFraming: `An \`if\` is the smallest decision a program can make, and the whole
field is built out of them — a spam filter is "if score > threshold", a
classifier's final step is "if probability > 0.5".

What changes later is *who writes the condition*. You're hand-writing the
threshold now. A trained model learns it from data instead. Same gate, same
shape — the number in it just stops being your guess.`,
  },
  watch: {
    code: `temp = 38
if temp > 37:
    print("fever")
print("done")`,
    notes: {
      2: `The gate. \`temp > 37\` gets worked out into a single \`True\` or \`False\` first, and
*that* decides whether the indented block runs at all.

Note the \`==\`-shaped trap isn't here: \`>\` asks a question. \`=\` would have tried to *store*
something, and Python refuses that inside an \`if\`.`,
      4: `Not indented, so it was never inside the gate. It runs whatever \`temp\` was.

Change line 1 to \`temp = 20\` in your head and step through again: line 3 gets skipped
entirely, line 4 still runs.`,
    },
  },
  predict: {
    code: `score = 40
if score > 50:
    score = score + 10
print(score)`,
    question: 'What does this print?',
    choices: ['40', '50', '10', '100'],
    answerIndex: 0,
    explain: `\`40\`. \`40 > 50\` is False, so the indented line never runs — \`score\`
is never touched.

The thing to notice: **nothing happened, and nothing complained**. A false \`if\`
isn't an error, it's just silence. That silence is why a wrong condition is
harder to spot than a crash.`,
  },
  fix: {
    task: `This should print \`exactly twenty\`, but it won't even start — Python
rejects line 2. Fix the condition.`,
    brokenCode: `age = 20
if age = 20:
    print("exactly twenty")`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
assert any(isinstance(n, ast.If) for n in ast.walk(tree)), "The if is gone. The job was to make the condition legal, not to remove the gate — how would you ask whether age is 20?"
assert __stdout__.strip() == "exactly twenty", f"It should print exactly twenty, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      'Read the error and look at line 2. Python is telling you that what you wrote there is a *statement*, not a question.',
      '`=` stores a value. `==` asks whether two things are equal. An `if` needs a question.',
      '`if age == 20:` — two equals signs. One is "make it so", two is "is it so?".',
    ],
    solution: `age = 20
if age == 20:
    print("exactly twenty")`,
  },
  stretch: {
    title: 'The condition is a value',
    body: `\`temp > 37\` isn't special syntax that only lives inside an \`if\`. It's an
expression that produces a value, exactly like \`2 + 2\` does. You can print it:

\`\`\`python
temp = 38
print(temp > 37)
\`\`\`

That prints \`True\`. You can store it, too:

\`\`\`python
has_fever = temp > 37
if has_fever:
    print("fever")
\`\`\`

Worth knowing because it kills the mystery. An \`if\` doesn't "evaluate a
condition" as some separate magic — it works out a normal value, then checks
whether it's true. When a condition confuses you, print it.`,
    code: `temp = 38
print(temp > 37)`,
  },
}
