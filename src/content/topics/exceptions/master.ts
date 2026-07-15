import type { Level } from '../../types'

export const master: Level = {
  level: 5,
  blurb: 'Fail fast or fail soft — decide, and never decide by accident.',
  concept: {
    body: `You can throw errors too. \`raise\` stops the program on purpose, at the
moment you know something is wrong:

\`\`\`python
if rate < 0:
    raise ValueError("rate must be >= 0, got " + str(rate))
\`\`\`

A message worth reading has two halves: **what was expected**, and **what
actually turned up**. "bad rate" has neither.

So every error you meet is now one of two honest choices:

- **Fail fast** — stop now, loudly. Right when carrying on would produce a
  confidently wrong answer.
- **Fail soft** — handle it, **count it**, carry on. Right when the bad item is
  one of many and losing a few is acceptable.

\`except: pass\` is neither of these. It's fail-soft with the counting deleted —
all of the data loss, none of the evidence. It is not a third option; it's the
absence of a decision.`,
    aiFraming: `Weigh the two failures honestly.

An **unhandled** error costs you an hour. It's loud, it has a line number, and it
happens on your machine while you're looking at it. That's the cheap one.

A **handled-and-hidden** error costs you a model you can't trust and can't debug.
The \`except: pass\` in the loader drops 40% of rows — the malformed ones, which
are never randomly distributed; they're the night shift's exports, or one
sensor, or everything after the schema changed. Training runs. Accuracy comes out
at 94%. It ships. Nothing, anywhere, ever printed a warning.

Then it underperforms in production and you go looking. The model's fine. The
features are fine. The bug is a two-word line in a file nobody's opened in eight
months, and there is **no trace of it in the output** — that's the whole problem.
You can't grep for the rows that aren't there.

Crashes get fixed because crashes get noticed. That's not a consolation prize.
That's the feature.`,
  },
  watch: {
    code: `def to_rate(text):
    r = float(text)
    if r < 0:
        raise ValueError("rate must be >= 0, got " + text)
    return r

print(to_rate("0.5"))
print(to_rate("-1"))`,
    expectError: 'ValueError',
    notes: {
      4: `Your own error, thrown by you, on purpose. Nothing was broken — \`float("-1")\` worked
perfectly. \`-1\` is a fine number; it's just not a fine **rate**.

Only this function knows that. Twenty lines downstream, \`-1\` is just a number that
multiplies like any other, and the wrongness is invisible forever. This is the last
moment anyone can tell.

So it stops here, and the message says what it expected and what it got.`,
      8: `Watch the crash climb. It raised on line 4, inside \`to_rate\` — and it kills line 8
too, out here in the caller, because nobody caught it in between.

That's what an uncaught exception does: it doesn't stop at the function's edge, it walks
back up through everyone who called it until something catches it, or nothing does and
the program is over.

And note \`0.5\` already printed. Line 7 worked fine. The program did real work and then
died — errors don't tidy up after themselves.`,
    },
  },
  predict: {
    code: `def clean(rows):
    out = []
    for r in rows:
        try:
            out.append(int(r))
        except:
            pass
    return out

rows = ["1", "2", "three", "4"]
cleaned = clean(rows)
print(len(rows), "in,", len(cleaned), "out")`,
    question: 'What does this print?',
    choices: ['4 in, 3 out', '4 in, 4 out', '3 in, 3 out', '4 in, 0 out'],
    answerIndex: 0,
    explain: `\`4 in, 3 out\`.

A row went in and did not come out, and \`clean\` returned \`[1, 2, 4]\` — a
perfectly tidy list of perfectly good integers. No error. No warning. No mark of
any kind that anything was ever dropped.

**The only reason you know is that this program happened to count.** Delete line
10 and line 12, print \`cleaned\`, and the output is flawless and the loss is
invisible. That's not a contrived example — that *is* the function, and nobody
counts.

Now scale it: 400,000 rows, and \`clean\` returns 240,000 without a word. The
number that would have told you is the one nobody wrote. Everything downstream
works. Everything downstream is wrong.

\`except: pass\` isn't lazy error handling. It's the deletion of evidence.`,
  },
  fix: {
    task: `\`to_rate\` hands back \`-1.0\` without a murmur. Downstream, \`-1\` is just a
number — it multiplies, it averages, and nothing will ever notice it was never a
real rate.

Make it \`raise ValueError\` when the rate is negative, with a message that says
what was expected **and** what actually arrived. The \`try\` below is already
waiting for it — get it to print \`rejected: ...\`.`,
    brokenCode: `def to_rate(text):
    r = float(text)
    return r

try:
    print(to_rate("-1"))
except ValueError as e:
    print("rejected:", e)`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
assert any(isinstance(n, ast.Raise) for n in ast.walk(tree)), "Nothing raises yet. A negative rate is a bug, and to_rate is the last place that can still recognise it as one — say so, with raise ValueError(...)."
assert to_rate("0.5") == 0.5, "A good rate has to still come straight back: 0.5 in, 0.5 out. Only the negative ones should raise — don't guard the whole function."
_out = __stdout__.strip()
assert _out.startswith("rejected:"), f"The except branch never fired, so to_rate('-1') still returned quietly. It printed {_out!r}."
assert len(_out) > len("rejected:") + 5, "It raises, but the message is empty. What would you want to read at 2am, six months from now, with no memory of this code?"
assert "-1" in _out, "The message never says what actually turned up. 'rate must be >= 0, got -1' tells you the whole story; 'invalid rate' makes you go and find the data yourself."`,
    },
    hints: [
      'The check belongs after `float()` and before `return` — you need `r` to exist before you can ask whether it\'s negative, and if it is, `to_rate` should never reach that return at all.',
      '`raise ValueError(...)` ends the function on the spot and hands the exception up to whoever called it — which is exactly what the `try` underneath is waiting for. Whatever you pass in the brackets becomes the message that `as e` gives you.',
      '```python\nif r < 0:\n    raise ValueError("rate must be >= 0, got " + text)\n```\nExpected on the left, actual on the right. That message is the entire reason anyone will thank you for crashing instead of carrying on.',
    ],
    solution: `def to_rate(text):
    r = float(text)
    if r < 0:
        raise ValueError("rate must be >= 0, got " + text)
    return r

try:
    print(to_rate("-1"))
except ValueError as e:
    print("rejected:", e)`,
  },
  stretch: {
    title: 'Let the count itself fail fast',
    body: `Level 4 said: count the failures. Level 5 finishes the thought — **give the
count a threshold, and let it raise.**

\`\`\`python
bad = 0
for row in rows:
    try:
        clean.append(parse(row))
    except ValueError:
        bad = bad + 1

if bad > len(rows) * 0.05:
    raise ValueError(f"{bad} of {len(rows)} rows unparseable — expected under 5%")
print(f"dropped {bad} of {len(rows)} rows")
\`\`\`

Read what that does. A few bad rows: fail soft, note it, carry on — because a few
bad rows is Tuesday. A **fifth** of them: fail fast, because that isn't dirty
data anymore, that's the wrong file, or a schema that moved, or an export that
half-finished. Same code, same loop, and the decision is made *by the data* at
runtime.

That's the whole topic in one block. You are not choosing between "handle errors"
and "let it crash" once, in general, forever. You're deciding **per error, and
sometimes per run**, whether this one is survivable — and then leaving evidence
either way.

The line you never want to write is the one that makes 400,000 rows and 240,000
rows look exactly the same.`,
    code: `rows = ["1", "2", "three", "4"]
clean = []
bad = 0
for row in rows:
    try:
        clean.append(int(row))
    except ValueError:
        bad = bad + 1
if bad > len(rows) * 0.05:
    print("would raise:", bad, "of", len(rows), "rows unparseable - expected under 5%")
print("kept", clean)`,
  },
}
