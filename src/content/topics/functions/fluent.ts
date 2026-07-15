import type { Level } from '../../types'

export const fluent: Level = {
  level: 3,
  blurb: 'Arguments: position, keywords, defaults — and the swap that runs anyway.',
  concept: {
    body: `Arguments get matched to parameters by **position**, left to right.

\`\`\`python
def power(base, exp=2):
    return base ** exp

power(5, 3)      # base=5, exp=3  → 125
power(3, 5)      # base=3, exp=5  → 243
\`\`\`

Both of those run. Neither is an error. If you meant the first and typed the
second, Python hands you \`243\` with total confidence and you find out later.
**That's the bug surface**: wrong order is not a syntax problem, it's a wrong
answer.

Two ways out:

- **Defaults.** \`exp=2\` means the caller can leave it off: \`power(5)\` → \`25\`.
  Parameters with defaults must come last.
- **Keywords.** \`power(exp=3, base=5)\` — name them and order stops mattering
  entirely.

Past two parameters, name them. It costs six characters and buys you a whole
class of bug you'll never have.`,
    aiFraming: `Look at any real API — \`train(model, data, epochs=10, lr=0.001,
shuffle=True)\`. Everything past the first two is a keyword with a default, and
nobody ever passes them positionally. That's not a style preference; it's load
bearing.

Defaults are how a function stays callable in one line while still exposing
thirty knobs. Keywords are how you turn one knob without knowing where the other
twenty-nine sit. And when a library adds a parameter next version, keyword calls
keep working and positional ones silently shift meaning.`,
  },
  watch: {
    code: `def power(base, exp=2):
    return base ** exp

print(power(5))
print(power(5, 3))
print(power(3, 5))
print(power(exp=3, base=5))`,
    notes: {
      1: `\`exp=2\` is a **default**. If the caller doesn't supply \`exp\`, it's \`2\`. \`base\`
has no default, so it's required.

Defaulted parameters have to come after undefaulted ones — Python needs somewhere
unambiguous to put a positional argument.`,
      6: `Same function, arguments the other way round. Look at the answer: \`243\`, not
\`125\`.

Nothing was flagged. Python matched \`3\` to \`base\` and \`5\` to \`exp\` because that's the
order you typed them in, and it has no idea what you meant. A swapped-argument bug
never announces itself — it just returns something plausible.`,
      7: `**Keyword arguments.** Name each one and the order in the parentheses stops
mattering — this is the same call as line 5, written backwards, and it gives \`125\`.

This is the fix for line 6, and it's why real libraries are full of \`key=value\` calls.`,
    },
  },
  predict: {
    code: `def rect(width, height=2):
    return width * height

print(rect(3), rect(3, 4), rect(height=3, width=5))`,
    question: 'What does this print?',
    choices: ['6 12 15', '6 12 8', '5 12 15', '6 7 15'],
    answerIndex: 0,
    explain: `\`6 12 15\`.

- \`rect(3)\` — \`height\` isn't given, so the default \`2\` applies. 3 × 2 = **6**.
- \`rect(3, 4)\` — positional, in order: width 3, height 4. **12**.
- \`rect(height=3, width=5)\` — keywords, so the order on screen is irrelevant.
  Python reads the names, not the positions. 5 × 3 = **15**.

Three calls, three different argument styles, one function. The last one is the
only one you can read months later without scrolling up to check what \`rect\`
expects first.`,
  },
  fix: {
    task: `A car went 100 miles in 2 hours. \`rate\` returns miles per hour, so this should
print \`50.0\`. It prints \`0.02\`. The function is correct — don't change it.`,
    brokenCode: `def rate(distance, time):
    return distance / time

print(rate(2, 100))`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
fn = next((n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef) and n.name == 'rate'), None)
assert fn is not None, "rate is gone. It wasn't the broken part — put it back."
assert [a.arg for a in fn.args.args] == ['distance', 'time'], "The parameters got reordered. rate(distance, time) is the contract every caller relies on — if the definition is right, what's left to be wrong?"
assert isinstance(fn.body[0], ast.Return), "The body of rate should still be just: return distance / time."
assert __stdout__.strip() == "50.0", f"Expected 50.0, got {__stdout__.strip()!r}. 100 miles in 2 hours — which of those two numbers is the distance, and which slot does it land in?"`,
    },
    hints: [
      "It ran. No error. So both numbers reached the function — they just landed in the wrong parameters. `0.02` is 2 ÷ 100. Which of those is supposed to be on top?",
      'Arguments fill parameters left to right: the first thing in the parentheses becomes `distance`, the second becomes `time`. Read `rate(2, 100)` that way and the bug is visible.',
      '`rate(100, 2)` — distance first, then time. Or, immune to this forever: `rate(distance=100, time=2)`.',
    ],
    solution: `def rate(distance, time):
    return distance / time

print(rate(100, 2))`,
  },
  stretch: {
    title: 'Making the swap impossible',
    body: `You can force callers to use keywords. Anything after a bare \`*\` **must** be
named:

\`\`\`python
def rate(*, distance, time):
    return distance / time

rate(100, 2)               # TypeError — refuses to run
rate(distance=100, time=2) # fine
\`\`\`

Now the bug from this level cannot be written. Not "is caught by a test" — cannot
be expressed.

That's the good kind of API design: instead of documenting the order and hoping,
you delete the ambiguity. You'll see \`*\` in the signatures of most modern
libraries, right before the long tail of options. Now you know what it's for.`,
    code: `def rate(*, distance, time):
    return distance / time

print(rate(distance=100, time=2))`,
  },
}
