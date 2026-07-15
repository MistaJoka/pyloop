import type { Level } from '../../types'

export const fluent: Level = {
  level: 3,
  blurb: 'Catching the right thing — as e, and how a bare except hides the bug you needed.',
  concept: {
    body: `Four ways to write it, in descending order of how much you should trust
yourself with them:

\`\`\`python
except ValueError:                 # one type
except (ValueError, TypeError):    # either of two — note the brackets
except Exception as e:             # nearly anything, and you keep it
except:                            # everything. including your typos.
\`\`\`

\`as e\` names the exception object so you can look at it. \`str(e)\` — or just
\`print(e)\` — gives you **the message**: the same text that would have appeared
after the colon if it had crashed.

\`\`\`python
except ValueError as e:
    print("skipping:", e)
    # skipping: invalid literal for int() with base 10: 'n/a'
\`\`\`

Now the trap. A bare \`except:\` catches **everything** — including the
\`NameError\` from a variable you misspelled. Your typo gets treated as a bad data
row, silently, forever. The bug doesn't go away; it just stops being reported.

Catch narrow. You can only handle what you predicted.`,
    aiFraming: `A handler that catches everything is a handler that can't tell the
difference between "this row is malformed" and "I misspelled a column name".

Those need opposite responses. Bad row: drop it, count it, carry on — that's
Tuesday. Misspelled column: **stop**, because every row is about to be dropped
and your cleaning step is about to return an empty list and report zero errors.

Wrap that loop in \`except: pass\` and both look identical from the outside: no
complaints, plausible-looking output, and a number at the end that you have no
reason to distrust. Bugs live for months in that gap. Not because they're subtle
— because nothing was ever going to tell you.`,
  },
  watch: {
    code: `row = {"temp": "21.5"}
try:
    value = float(row["temperature"])
except ValueError:
    print("not a number")
print("finished")`,
    expectError: 'KeyError',
    notes: {
      3: `Two things could go wrong on this line, and you only defended against one.

\`row["temperature"]\` looks the key up — but the key is \`"temp"\`. That's a **KeyError**,
and it happens *before* \`float()\` is ever reached. The \`ValueError\` you were bracing
for never gets a chance to occur.`,
      4: `Watch this line carefully — it **runs**, and it doesn't help.

Python arrives here, asks "is a KeyError a ValueError?", gets "no", and re-raises. The
handler is right there, visibly present, and completely irrelevant. Then the program
dies anyway: **crashed here**, in red, on line 3.

An \`except\` that doesn't match is worth exactly as much as no \`except\` at all.`,
    },
  },
  predict: {
    code: `def parse(text):
    try:
        return int(text)
    except:
        return -1

print(parse("7"), parse("x"), parse(None))`,
    question: 'What does this print?',
    choices: ['7 -1 -1', '7 -1', '7 -1 TypeError', '7 x None'],
    answerIndex: 0,
    explain: `\`7 -1 -1\`.

\`parse("x")\` raises a **ValueError** — a string that isn't a number. Fair enough;
that's what the handler was for.

\`parse(None)\` raises a **TypeError** — \`int()\` won't even look at \`None\`. That's
a completely different kind of problem: not "bad data", but "something upstream
handed me a hole where a value should be". The bare \`except:\` flattens it into
the same \`-1\`.

And \`-1\` is a *number*. It'll add, average, and plot without complaint. Two very
different failures went in and one indistinguishable answer came out — and
nothing anywhere printed a warning.

Change line 4 to \`except ValueError:\` and \`parse(None)\` crashes loudly, which
is what you wanted, because that one is a bug in **your** code.`,
  },
  fix: {
    task: `This should print \`total: 19\` — 12 + 7, skipping \`n/a\`. It prints \`total: 0\`
and never complains once. The bare \`except:\` is hiding a real bug from you.

Narrow the catch to \`ValueError\`, read the error that then gets through, and fix
what it points at. Grab the exception with \`as e\` and print it, so the skipped
reading says why it was skipped.`,
    brokenCode: `readings = ["12", "7", "n/a"]
total = 0
for r in readings:
    try:
        total = total + int(reading)
    except:
        pass
print("total:", total)`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
handlers = [h for n in ast.walk(tree) if isinstance(n, ast.Try) for h in n.handlers]
assert handlers, "The try/except is gone entirely. Keep it — 'n/a' is genuinely unreadable and still needs skipping."
assert all(h.type is not None for h in handlers), "There's still a bare 'except:' in there. That's the thing hiding the bug — name the type you actually expect."
_wide = {'Exception', 'BaseException'}
assert not any(isinstance(h.type, ast.Name) and h.type.id in _wide for h in handlers), "'except Exception:' is a bare 'except:' wearing a hat — it still swallows the NameError. What does int('n/a') raise, specifically?"
assert any(h.name for h in handlers), "Nothing is holding on to the exception itself. 'except ValueError as e:' names it, and print(e) shows you its message."
assert total == 19, f"total came out as {total}, expected 19 (12 + 7). Only one of the three readings is unreadable — so why did none of them get added?"
assert "n/a" in __stdout__, "The reading you skipped should say so — print which one it was."
assert "invalid literal" in __stdout__, "You caught the exception with 'as e', but its message never made it to the screen. print(e) is the whole reason to grab it."
assert __stdout__.strip().endswith("total: 19"), f"It should end with 'total: 19'. It printed {__stdout__.strip()!r}."`,
    },
    hints: [
      "Look hard at the output: `total: 0`. Not 12, not 19 — **zero**. Only one of those three readings is unreadable, so a working program would still get 19. Nothing at all was added. That means every single pass is failing, not just the `n/a` one, and something is eating the evidence.",
      "Change `except:` to `except ValueError:` and run it. Don't fix anything else first. Now the thing that was being swallowed gets through, and Python tells you its type, its message, and its line — for free.",
      'The `NameError` points at `int(reading)`: there is no `reading`. The loop variable is `r` — that typo was failing on all three passes and the bare `except:` was catching it and calling it a bad data row. Fix it to `int(r)`, then `except ValueError as e:` and `print("skipping:", r, "-", e)`.',
    ],
    solution: `readings = ["12", "7", "n/a"]
total = 0
for r in readings:
    try:
        total = total + int(r)
    except ValueError as e:
        print("skipping:", r, "-", e)
print("total:", total)`,
  },
  stretch: {
    title: 'Catch it, say something, and let it go anyway',
    body: `Catching isn't only "handle it and carry on". A bare \`raise\` inside an
\`except\` re-throws the exact exception you just caught:

\`\`\`python
try:
    total = total + int(r)
except ValueError as e:
    print("row", i, "is unusable:", e)
    raise
\`\`\`

You get to say something useful — *which* row, in *your* words, with *your*
context — and the program still stops. Nothing is hidden. The traceback that
comes out is the original one, pointing at the original line.

This is the honest middle. It's the move when you can add information but you
can't add a **decision**: you know the row is broken, you don't know whether
carrying on without it is acceptable, and quietly deciding it is would be a lie.

Compare the three:

- \`except: pass\` — hides the error, invents an answer
- \`except ValueError as e: print(e)\` — reports it, carries on, **decides** it's survivable
- \`except ValueError as e: print(e); raise\` — reports it, stops, decides nothing

The last one is the safest thing to write when you don't yet know which of the
other two is right.`,
  },
}
