import type { Level } from '../../types'

export const working: Level = {
  level: 2,
  blurb: 'try / except — the program survives, and the line after it still runs.',
  concept: {
    body: `\`try\` means "run this, it might blow up". \`except\` means "if it blows up
**with this type**, do that instead of dying".

\`\`\`python
try:
    n = int(text)
except ValueError:
    n = 0
print("carrying on")
\`\`\`

Two things to watch, and the second is the one people miss.

**The rest of the \`try\` block is abandoned.** The moment \`int(text)\` raises,
Python jumps to the \`except\`. Any line still sitting below it in the \`try\`
never runs.

**The line after the whole thing runs anyway.** \`print("carrying on")\` happens —
that's the entire point. Without the \`try\`, the program stopped at line 2 and
line 5 was never reached. With it, the error became a detour instead of an
ending.

Name the type. \`except ValueError:\`, not \`except:\`.`,
    aiFraming: `Notice what you just did: you made a **decision**. "An unreadable
value is survivable, and 0 is what we use instead."

That's a real judgement call with real consequences — and it's now buried in two
lines of code that no one will ever read again. Sometimes it's exactly right.
Sometimes \`n = 0\` quietly poisons an average with fake zeroes for the next two
years.

The skill this whole topic is building isn't avoiding errors. It's deciding, per
error, whether to stop or carry on — and knowing you decided.`,
  },
  watch: {
    code: `text = "n/a"
try:
    n = int(text)
    print("converted", n)
except ValueError:
    n = 0
    print("could not read", text, "- using", n)
print("n is", n)
print("still running")`,
    notes: {
      2: `\`try:\` — "the next few lines are risky; if one of them raises, don't die, jump down
to the \`except\` instead."

It costs nothing when nothing goes wrong. Python doesn't check anything here; it just
marks where to land if it has to.`,
      3: `This raises. Watch the badge: **raised here — caught below**, not "crashed here".

Same error as last level, same line, same message. The difference is entirely what's
sitting around it — and this time the trace **carries on**, so you can follow where it
lands.

Notice line 4 gets skipped completely. The raise abandoned the rest of the \`try\` block
on the spot: \`try\` means "run these lines **until** one fails, then leave", not "run
these lines and tell me about the bad ones".`,
      5: `\`except ValueError:\` — the landing spot, and it's picky. It catches a \`ValueError\`
and nothing else.

Feed this same code a \`TypeError\` and it will sail straight past this line and crash,
even though an \`except\` is sitting right there. Matching the type is not a formality.`,
      8: `**Look at this line.** It ran.

Last level the program was already dead by now. That's what \`try\`/\`except\` bought — not
a fixed value, but a program still standing to use it.`,
    },
  },
  predict: {
    code: `steps = 0
try:
    steps = steps + 1
    n = int("x")
    steps = steps + 1
except ValueError:
    pass
print("steps:", steps)`,
    question: 'What does this print?',
    choices: ['steps: 1', 'steps: 2', 'steps: 0', 'nothing — it crashed'],
    answerIndex: 0,
    explain: `\`steps: 1\`.

Line 3 runs — \`steps\` is 1. Line 4 raises. And line 5 **never happens**: the
raise abandoned the rest of the block and jumped to the \`except\`.

That's the misread worth killing now. \`try\` is not "attempt each of these lines
and skip the bad one". It's "run these lines until one fails, then leave the
block entirely". Everything below the failure is gone, however innocent it looks.

Which is why a fat \`try\` block is a liability: the more lines you put in it, the
more lines can get silently skipped by a failure at the top. (\`pass\` is Python's
"deliberately do nothing" — here it means the error is noted and ignored. Level 3
is about how much that costs.)`,
  },
  fix: {
    task: `The program from Level 1, still crashing on \`"n/a"\`. Make it survive: skip
anything \`int()\` refuses and still print \`total: 19\` at the end. Catch
\`ValueError\` by name — no bare \`except:\`.`,
    brokenCode: `readings = ["12", "7", "n/a"]
total = 0
for r in readings:
    total = total + int(r)
print("total:", total)`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
handlers = [h for n in ast.walk(tree) if isinstance(n, ast.Try) for h in n.handlers]
assert handlers, "Nothing here catches anything yet — this is still Level 1's program. The risky line needs to sit inside a try, with an except under it."
assert all(h.type is not None for h in handlers), "There's a bare 'except:' in there. It works, and it also catches every typo you haven't found yet. Which error type does int('n/a') actually raise?"
assert 'total' in dir(), "There's no variable called total anymore — the total is still the thing you're after."
assert total == 19, f"total came out as {total}, expected 19 (12 + 7). Is the bad reading being stepped over, or is it taking the rest of the loop down with it?"
assert __stdout__.strip().endswith("total: 19"), f"It should end by printing 'total: 19'. It printed {__stdout__.strip()!r}."`,
    },
    hints: [
      'Only one of the three readings is a problem. So you want the protection wrapped around the one line that can fail — `total = total + int(r)` — not around the whole program.',
      "Inside the loop: `try:` with the risky line under it, then `except ValueError:` with what to do instead. What *should* happen for a reading you can't use? Nothing, really — except that you'd want to know it happened.",
      '```python\nfor r in readings:\n    try:\n        total = total + int(r)\n    except ValueError:\n        print("skipping", r)\n```\nEach pass gets its own attempt, so a bad one costs you that reading and nothing more.',
    ],
    solution: `readings = ["12", "7", "n/a"]
total = 0
for r in readings:
    try:
        total = total + int(r)
    except ValueError:
        print("skipping", r)
print("total:", total)`,
  },
  stretch: {
    title: 'The except block is a decision, not a formality',
    body: `You wrote \`print("skipping", r)\`. Here are three other endings for that
same \`except\`, all one line, all "working code":

\`\`\`python
except ValueError:
    print("skipping", r)      # 1. tell someone, carry on
except ValueError:
    total = total + 0         # 2. treat it as zero
except ValueError:
    pass                      # 3. pretend it never happened
\`\`\`

They are not variations. They're three different claims about the world.

**1** says the reading is missing and missing is worth mentioning. **2** says an
unreadable reading *is* a zero — which is a lie, and it drags every average you
compute afterwards toward zero. **3** says nothing at all, to anyone, ever.

Same bug, three totals, no complaints from Python about any of them. The
\`except\` block is where you say what a broken value *means*, and that is a
question about your data, not about Python.

Option 3 is the one that gets people. It's covered in Level 5.`,
    code: `readings = ["12", "7", "n/a"]
total = 0
skipped = 0
for r in readings:
    try:
        total = total + int(r)
    except ValueError:
        skipped = skipped + 1
print("total:", total, "from", len(readings) - skipped, "of", len(readings), "readings")`,
  },
}
