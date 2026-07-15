import type { Level } from '../../types'

export const working: Level = {
  level: 2,
  blurb: 'return vs print — one hands a value back, one only shows it.',
  concept: {
    body: `\`print\` and \`return\` look similar and do unrelated jobs.

- \`print(x)\` puts characters on the screen. That's all. The screen is a dead end.
- \`return x\` hands \`x\` **back to whoever called the function**, to be used.

\`\`\`python
def add_p(a, b):
    print(a + b)      # shows 5, gives back nothing

def add_r(a, b):
    return a + b      # shows nothing, gives back 5
\`\`\`

So \`x = add_p(2, 3)\` prints \`5\` and leaves **\`x = None\`**. It looked like it
worked. The number went to the screen and nowhere else.

A function with no \`return\` returns \`None\`. Always. That's not an error — it's
Python telling you the function was a *doer*, not a *giver*.

Same rule as variables: if the result isn't stored, it didn't happen. This is
just the other end of it.`,
    aiFraming: `\`None\` where a number should be is the single most common way a
data pipeline fails quietly. \`scores = model.rank(items)\` where \`rank\` prints its
results instead of returning them: no crash, no red text — \`scores\` is \`None\` and
the failure surfaces forty lines later, somewhere unrelated.

Which is why the contract matters: a function takes inputs and **returns a
value**. Printing is a side effect — useful for a human watching, invisible to
the next step in the chain. You cannot test, cache or chain a function whose
answer only ever went to a terminal.`,
  },
  watch: {
    code: `def add_p(a, b):
    print(a + b)

def add_r(a, b):
    return a + b

x = add_p(2, 3)
y = add_r(2, 3)
print("x is", x)
print("y is", y)`,
    notes: {
      5: `\`return\` ends the function **and** hands the value back to the caller. That value
becomes what the call \`add_r(2, 3)\` is *worth*, so it can be stored, added to, passed on.

Nothing appears on screen. \`return\` is not a printing instruction — it's a delivery.`,
      7: `\`add_p\` prints \`5\` while it runs, then falls off the end of its body without a
\`return\`. A function that never returns anything returns \`None\`.

So \`5\` hits the screen and \`x\` gets \`None\`. Step past this line and look: \`x\` is
sitting there empty, right after a line that visibly produced a 5.`,
    },
  },
  predict: {
    code: `def total(a, b):
    print(a + b)

result = total(4, 6)
print(result)`,
    question: 'What does this print?',
    choices: ['10\n10', '10\nNone', 'None', '10'],
    answerIndex: 1,
    explain: `\`10\`, then \`None\`.

The \`10\` comes from the \`print\` **inside** \`total\`. Then \`total\` ends without a
\`return\`, so the call is worth \`None\`, and \`result\` becomes \`None\`. Line 5 prints
that.

The trap is how convincing the first line is. You see \`10\` and think the
function worked. It did work — it just never handed the answer to anyone.
Change \`print(a + b)\` to \`return a + b\` and you get \`10\` once, from line 5.`,
  },
  fix: {
    task: `\`double\` should hand its answer back so the \`print\` at the bottom can show it.
Right now the output is \`42\` and then \`None\`. It should be just \`42\`.`,
    brokenCode: `def double(n):
    print(n * 2)

result = double(21)
print(result)`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
fn = next((n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef) and n.name == 'double'), None)
assert fn is not None, "double is gone. It's the thing being fixed — keep it."
assert any(isinstance(n, ast.Return) for n in ast.walk(fn)), "There's no return inside double. print puts characters on a screen; what puts a value back into the caller's hands?"
assert result == 42, f"result is {result!r}. If double only prints, what is the call worth to whoever wrote result = double(21)?"
assert __stdout__.strip() == "42", f"Expected one line reading 42, got {__stdout__.strip()!r}. Is double still printing as well as returning?"`,
    },
    hints: [
      'The `42` you see is coming from *inside* `double`. The `None` is coming from line 5. So what did the call on line 4 actually hand to `result`?',
      "A function with no `return` hands back `None` — always. `print` doesn't count; the screen isn't the caller.",
      '`return n * 2` instead of `print(n * 2)`. Then line 5 prints the value it got, and that print is the only one left.',
    ],
    solution: `def double(n):
    return n * 2

result = double(21)
print(result)`,
  },
  stretch: {
    title: 'return also means stop',
    body: `\`return\` does two things at once, and the second one is easy to miss:

\`\`\`python
def check(n):
    if n < 0:
        return "negative"
    return "fine"
\`\`\`

If \`n\` is \`-5\`, the function stops dead at \`return "negative"\`. Line 4 never
runs. No \`else\` needed — \`return\` already left the building.

That's the **early return**, and it's how you avoid stacking conditions five
levels deep: handle the odd cases up top, bail out, and let the last line be the
normal answer with nothing indented around it.

Anything after a \`return\` on the same path is dead code. Python won't warn you.`,
    code: `def check(n):
    if n < 0:
        return "negative"
    return "fine"

print(check(-5), check(5))`,
  },
}
