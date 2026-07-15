import type { Level } from '../../types'

export const advanced: Level = {
  level: 4,
  blurb: 'The classic bugs — is vs ==, and why 0.1 + 0.2 is not 0.3.',
  concept: {
    body: `Three conditions that look right and aren't.

**\`is\` is not \`==\`.** \`==\` asks "same value?". \`is\` asks "same object in
memory?". Two lists that look identical are still two separate objects, so
\`[1,2] == [1,2]\` is True and \`[1,2] is [1,2]\` is False. Use \`is\` for \`None\`
only — that's the one case where there's genuinely just one object.

**\`if x == True:\` is not \`if x:\`.** The first demands the actual \`True\` object.
The second accepts anything truthy. \`if [1,2] == True\` is False; \`if [1,2]\` is
true. Just write \`if x:\`.

**Floats aren't exact.** \`0.1\` can't be stored exactly in binary any more than
\`1/3\` can be written exactly in decimal. So:

\`\`\`python
0.1 + 0.2 == 0.3   # False
\`\`\`

Not a bug in Python. Compare with a tolerance instead: \`abs(a - b) < 1e-9\`.`,
    aiFraming: `Float equality is not a curiosity in AI work — it's daily life. Every
weight, loss and probability is a float that came out of a long chain of
arithmetic, and \`==\` on any of them is a coin flip.

So nobody writes it. \`math.isclose(a, b)\`, \`np.allclose(pred, expected)\`,
\`pytest.approx\` — the whole ecosystem is built on "close enough", and every test
you ever write against a model's numbers will use one of them. Reaching for
\`==\` on a float is the tell that someone hasn't been bitten yet.`,
  },
  watch: {
    code: `a = [1, 2]
b = [1, 2]
print(a == b)
print(a is b)
print(0.1 + 0.2 == 0.3)`,
    notes: {
      4: `\`is\` asks a completely different question from \`==\`: not "do these hold the same
value?" but "are these literally the same object?"

Lines 1 and 2 built **two** lists. They match item for item, but they're two things. So
line 3 prints True and line 4 prints False, off the same data.`,
      5: `Neither \`0.1\` nor \`0.2\` can be stored exactly in binary, so their sum lands a
hair away from \`0.3\` — and \`==\` is unforgiving about hairs.

Print \`0.1 + 0.2\` on its own sometime. The digits are right there.`,
    },
  },
  predict: {
    code: `x = 0.1 + 0.2
if x == 0.3:
    print("equal")
else:
    print(x)`,
    question: 'What does this print?',
    choices: ['0.3', '0.30000000000000004', 'equal', 'False'],
    answerIndex: 1,
    explain: `\`0.30000000000000004\`. The \`if\` is False, so the \`else\` runs and prints
the actual value — and there's the reason, in the digits.

\`0.1\` in binary is a repeating fraction, exactly like \`1/3\` is in decimal. It
gets rounded to fit, twice, and the error survives the addition. The result is
astonishingly close to \`0.3\` and **not equal** to it.

\`abs(x - 0.3) < 1e-9\` is the question you actually meant.`,
  },
  fix: {
    task: `\`[3, 4]\` is right there in \`rows\`, so this should print \`1\`. It prints \`0\`.
The loop is fine — the condition is asking the wrong question.`,
    brokenCode: `rows = [[1, 2], [3, 4]]
target = [3, 4]
found = 0
for r in rows:
    if r is target:
        found = found + 1
print(found)`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
ops = [op for n in ast.walk(tree) if isinstance(n, ast.Compare) for op in n.ops]
assert not any(isinstance(op, ast.Is) for op in ops), "There's still an 'is' in the condition. 'is' asks whether two names point at the very same object — is that what 'the row I'm looking for is in this list' actually means?"
assert found == 1, f"found came out as {found}. [3, 4] really is in rows, so 1 is the answer — is the condition comparing values, or identities?"
assert __stdout__.strip() == "1", f"It should print 1, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      "Nothing crashed and nothing was skipped — the loop visited `[3, 4]` and the `if` still said no. So the `if` isn't asking what you think it's asking.",
      '`is` asks "are these the exact same object in memory?". Lines 1 and 2 built two separate lists that happen to look alike. Two objects, same value.',
      '`if r == target:` — you want same value, not same object. Save `is` for `None`.',
    ],
    solution: `rows = [[1, 2], [3, 4]]
target = [3, 4]
found = 0
for r in rows:
    if r == target:
        found = found + 1
print(found)`,
  },
  stretch: {
    title: 'Why is sometimes works, which is the dangerous part',
    body: `Try this:

\`\`\`python
a = 256
b = 256
print(a is b)   # True

a = 1000
b = 1000
print(a is b)   # often False
\`\`\`

CPython pre-builds the small integers \`-5\` to \`256\` and hands out the same
object every time. Above that, you get fresh ones. Short strings get interned
too.

So \`is\` on numbers and strings appears to work — right up until your values get
big, or come from a file, or from user input. Then it breaks, on real data,
having passed every test you wrote with small numbers.

That's worse than a bug that always fails. **Use \`is\` for \`None\` and nothing
else.**`,
    code: `a = 256
b = 256
print(a is b)`,
  },
}
