import type { Level } from '../../types'

export const working: Level = {
  level: 2,
  blurb: 'get versus square brackets — when you want the crash and when you don\'t.',
  concept: {
    body: `Two ways to read a key, and they disagree about what "missing" means.

\`\`\`python
cfg["epochs"]           # KeyError if it's not there
cfg.get("epochs")       # None if it's not there
cfg.get("epochs", 10)   # 10 if it's not there
\`\`\`

\`.get\` never raises. That's its whole job, and it's also the trap.

The rule isn't "\`.get\` is safer". It's:

- **The key must be there** (it's your own data, your own spelling) → use
  \`[...]\`. You *want* the crash, immediately, at the line that's wrong.
- **The key might legitimately be missing** (optional setting, user input, a
  sparse record) → use \`.get\` with a sensible default.

A \`.get\` in the first situation doesn't prevent the bug. It hides it, hands you
a \`None\` or a \`0\`, and lets it travel — so you find out about it ten functions
later, where nothing looks wrong.

One more thing: \`.get\` **does not** add the key. Asking doesn't create.`,
    aiFraming: `Config dicts are where this gets you. \`params.get("learning_rate", 0.001)\`
looks responsible — until you type \`"learing_rate"\` in your config file. No
crash. The default silently wins, your run trains at the wrong rate, and the
only evidence is a loss curve that looks a bit off.

A \`KeyError\` at second zero costs you nothing. A \`.get\` default that swallowed a
typo costs you the six GPU-hours and the afternoon spent trying to explain the
numbers.

Reach for \`.get\` when absence is a real, expected case — \`row.get("middle_name", "")\`.
Not to make a red message go away.`,
  },
  watch: {
    code: `cfg = {"lr": 0.01}
lr = cfg.get("lr")
epochs = cfg.get("epochs")
epochs = cfg.get("epochs", 10)
print(lr, epochs)
print("epochs" in cfg)`,
    notes: {
      3: `\`"epochs"\` isn't a key, so \`.get\` hands back \`None\` and moves on. No error, no
message, nothing to notice. That silence is the entire point of this level.`,
      4: `The second argument is the fallback: "if the key isn't there, give me this instead".
So \`epochs\` becomes \`10\` — a real number you can use, rather than a \`None\` that will
blow up later in some arithmetic that looks innocent.`,
      6: `False. Two \`.get\` calls asked about \`"epochs"\` and the dict still doesn't have it.
Reading never writes.`,
    },
  },
  predict: {
    code: `d = {"a": 1}
print(d.get("b"), d.get("b", 0))`,
    question: 'What does this print?',
    choices: ['None 0', '0 0', 'None None', 'KeyError'],
    answerIndex: 0,
    explain: `\`None 0\`.

Neither call raises — that's what \`.get\` is for. The first has no default, so it
falls back to \`None\`. The second was told what to fall back to, so it says \`0\`.

Notice how little difference there is on screen between this and a dict that
genuinely contained \`{"b": 0}\`. That's the problem with \`.get\`: the output of
"key missing, used the default" and "key present, value is 0" are identical.
\`d["b"]\` would have told you which world you're in.`,
  },
  fix: {
    task: `\`total\` should be \`48\` — the quiz score plus the exam score. It prints \`8\`, and
nothing crashed, which is the real problem. Both keys are *supposed* to exist,
so make the lookups raise when one doesn't, and get the right total.`,
    brokenCode: `scores = {"quiz": 8, "exam": 40}
total = scores.get("quiz", 0) + scores.get("exams", 0)
print(total)`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
gets = [n for n in ast.walk(tree) if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute) and n.func.attr == "get"]
assert not gets, "There's still a .get here. If a key is supposed to exist, what do you actually want to happen on the day it doesn't — a silent 0, or a crash naming the key?"
assert 'total' in dir(), "There's no variable called total anymore — keep it."
assert total == 48, f"total came out as {total}, but 8 + 40 is 48. One of the key names doesn't match the dict — which one, and how did it stay quiet?"
assert __stdout__.strip() == "48", f"It should print 48, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      'Nothing went wrong on screen, and that *is* what went wrong. `.get("exams", 0)` looked for a key called `exams`, found none, and did exactly what you told it to: hand back 0.',
      'There are two things to change. One is a misspelled key. The other is the `.get` default that let the misspelling pass without a word — swap it for `[...]`, which refuses to make things up.',
      '`total = scores["quiz"] + scores["exam"]` — square brackets, and `exam` with no `s`. Now a typo is a KeyError with the bad name printed in it.',
    ],
    solution: `scores = {"quiz": 8, "exam": 40}
total = scores["quiz"] + scores["exam"]
print(total)`,
  },
  stretch: {
    title: 'The third option: ask first',
    body: `Sometimes you need to *know* whether the key was there, not just get a value:

\`\`\`python
if "epochs" in cfg:
    epochs = cfg["epochs"]
else:
    print("no epochs set, using 10")
    epochs = 10
\`\`\`

Wordier than \`.get\`, and worth it exactly when the absence itself is
information — something you want to log, count, or report on.

That's the whole family:

| you want | use |
|---|---|
| a crash if it's missing | \`d[k]\` |
| a value either way, don't care which | \`d.get(k, default)\` |
| to *react* to it being missing | \`if k in d:\` |

None of these is the safe one. They're three different questions, and picking
the wrong one is how silent bugs get born.`,
    code: `cfg = {"lr": 0.01}
if "epochs" in cfg:
    epochs = cfg["epochs"]
else:
    print("no epochs set, using 10")
    epochs = 10
print(epochs)`,
  },
}
