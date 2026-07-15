import type { Level } from '../../types'

export const advanced: Level = {
  level: 4,
  blurb: 'You do not control what gets typed — check before you convert.',
  concept: {
    body: `\`int("abc")\` doesn't return anything. It **crashes** — \`ValueError\` — and your
program stops dead.

So "just convert it" isn't a plan. \`int()\` works on text that spells a whole
number and nothing else. You have no say in what a human types, and they will
type \`abc\`, \`twenty\`, or an empty line.

Ask first:

\`\`\`python
"25".isdigit()      # True
"abc".isdigit()     # False
" 25 ".isdigit()    # False — the spaces aren't digits
\`\`\`

\`.isdigit()\` is a yes/no question you can ask *before* converting. But typed text
is filthy: stray spaces ride along invisibly, so clean it first with \`.strip()\`,
which returns the same text with whitespace shaved off both ends.

Honest catch: \`int(" 25 ")\` actually forgives the spaces. \`.isdigit()\` and \`==\`
do not. Strip anyway — the check has to agree with the conversion.`,
    aiFraming: `Real data is worse than a careless human, because there's more of it.

A column of ages from a web form contains \`25\`, \`" 30"\`, \`"thirty"\`, \`""\`, and
\`"25 "\` with a trailing space you cannot see. This is why every cleaning pipeline
starts with \`.str.strip()\`, why \`pd.to_numeric(errors="coerce")\` exists at all,
and why "we lost 4% of rows" is a sentence people say out loud.

The invisible-space bug is the one that gets everyone: \`"yes"\` and \`"yes "\` are
different strings, group-by makes them different groups, and your counts are
quietly wrong. Nothing errors. Strip at the boundary, always.`,
  },
  watch: {
    code: `raw = input("Age? ")
print(repr(raw))
print(raw.isdigit())
cleaned = raw.strip()
print(repr(cleaned))
print(cleaned.isdigit())
print(int(cleaned) + 1)`,
    stdin: ' 25 \n',
    notes: {
      2: `\`repr()\` prints the value the way you'd *write* it in code — with the quotes on. That
makes the spaces visible: \`' 25 '\`, not \`25\`.

This is the single most useful debugging habit in the topic. \`print(x)\` shows you what it
looks like; \`print(repr(x))\` shows you what it **is**.`,
      3: `\`False\` — and the value looks like a number. \`.isdigit()\` means *every* character is
a digit, and a space isn't. One invisible character flips the answer.`,
      4: `\`.strip()\` returns a new string with whitespace removed from both ends. It doesn't
change \`raw\` — look at the panel, \`raw\` still has its spaces. \`cleaned\` is the new one.`,
    },
  },
  predict: {
    code: `raw = " 42 "
print(raw.isdigit(), raw.strip().isdigit(), int(raw))`,
    question: 'What does this print?',
    choices: ['False True 42', 'True True 42', 'False False 42', 'False True  42 '],
    answerIndex: 0,
    explain: `\`False True 42\`. Three different opinions about the same string.

\`.isdigit()\` is strict — a leading space is not a digit, so \`False\`. Strip the
spaces and every remaining character is a digit, so \`True\`. And \`int()\` is the
lenient one: it quietly forgives surrounding whitespace and gives you \`42\`.

That mismatch is the trap. Your check says "not a number", your converter says
"42". Whichever one you trust, the other disagrees — so strip **first** and hand
both of them the same clean text.`,
  },
  fix: {
    task: `Someone typed \` 25\` — a stray space, then their age. This should print
\`Age? is it a number? True\`, but it says \`False\`. Fix the check, not the input.`,
    brokenCode: `raw = input("Age? ")
print("is it a number?", raw.isdigit())`,
    stdin: ' 25\n',
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
assert any(isinstance(n, ast.Call) and getattr(n.func, 'id', '') == 'input' for n in ast.walk(tree)), "Is the line still being read from the person? The typed text is what's being tested."
assert not any(isinstance(n, ast.Constant) and n.value is True for n in ast.walk(tree)), "Printing True isn't checking anything — it's just claiming. What question about raw should come out True?"
assert 'isdigit' in {getattr(n, 'attr', '') for n in ast.walk(tree)}, "The question 'is every character a digit?' is still the right question to ask. What is it being asked about?"
assert __stdout__.strip() == "Age? is it a number? True", f"Expected 'Age? is it a number? True' but it was {__stdout__.strip()!r}. The typed text isn't '25' — print repr(raw) and look at what's actually in there."`,
    },
    hints: [
      "`.isdigit()` is answering honestly. Try `print(repr(raw))` and look hard at what it says — there's a character in there you can't see.",
      'A leading space is not a digit, so `.isdigit()` says False. Something has to remove the whitespace before the question gets asked.',
      "`print(\"is it a number?\", raw.strip().isdigit())` — strip returns the cleaned text, and `.isdigit()` is asked about *that*.",
    ],
    solution: `raw = input("Age? ")
print("is it a number?", raw.strip().isdigit())`,
  },
  stretch: {
    title: 'isdigit() is narrower than you think',
    body: `\`.isdigit()\` answers "is every character a digit", which is not the same as
"is this a number":

\`\`\`python
"-5".isdigit()     # False — the minus sign isn't a digit
"3.5".isdigit()    # False — nor is the dot
"".isdigit()       # False — an empty line, and rightly so
"25".isdigit()     # True
\`\`\`

So it's exactly the right check for **non-negative whole numbers** and wrong for
everything else. Know which one you're validating.

Its cousins are worth knowing too: \`.isalpha()\`, \`.isspace()\`, and
\`.strip()\`'s one-sided versions \`.lstrip()\` / \`.rstrip()\`. Also \`.lower()\` —
because \`"Yes"\`, \`"yes"\` and \`"YES "\` are three different strings, and
\`raw.strip().lower()\` is the standard way to make them one.

There is a proper tool for "try it and cope if it fails" — \`try\`/\`except\`. It's
a topic of its own, and it's how you'd handle \`-5\` and \`3.5\`. Checking first is
what you reach for when the rule is simple enough to state.`,
    code: `print("-5".isdigit(), "3.5".isdigit(), "".isdigit(), "25".isdigit())
print(repr("  YES  ".strip().lower()))`,
  },
}
