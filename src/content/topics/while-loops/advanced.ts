import type { Level } from '../../types'

export const advanced: Level = {
  level: 4,
  blurb: 'Loops driven by state instead of a counter.',
  concept: {
    body: `Drop the counter. The test can look at anything.

\`\`\`python
queue = [3, 1, 4]
while queue:
    job = queue.pop(0)
    print(job)
\`\`\`

\`while queue:\` reads as **"while there's anything left"** — an empty list is
false, any non-empty list is true. No \`i\`, no \`len\`, no off-by-one.

The three parts are all still there. The change is just \`pop\` making the list
shorter instead of \`+= 1\` making a number bigger.

That's the real shape of \`while\`: **the body changes the world, and the test
asks whether it's done yet.** A counter was only ever one way to answer that.`,
    aiFraming: `This is the worklist, and it's everywhere: pop a task, do it, maybe push
two more tasks, stop when the list is empty. Graph search, crawlers, tokenizers,
the outer loop of an agent that decides its own next step.

You *cannot* write that as a \`for\`. \`for\` fixes what it's walking the moment it
starts; here the collection is being rewritten by the loop that's walking it.
That's not a hack around \`for\` — it's a genuinely different kind of loop, and
it's the one that shows up once you leave neat lists of numbers behind.`,
  },
  watch: {
    code: `queue = [3, 1, 4]
seen = []
while queue:
    job = queue.pop(0)
    seen.append(job)
print(seen)`,
    notes: {
      3: `No counter, no length check. An empty list is false and a non-empty list is true,
so this reads as "while there's anything left".

Watch \`queue\` in the variables panel — the test is looking straight at it.`,
      4: `\`pop(0)\` takes the first item **out** of the list and hands it to you. The list is
one shorter afterwards.

That's the change. It's what eventually empties \`queue\` and makes the test on line 3 go
false — but nothing about it looks like \`count = count - 1\`.`,
    },
  },
  predict: {
    code: `nums = [5, 3, 8, 2]
total = 0
while nums and total < 10:
    total = total + nums.pop(0)
print(total)`,
    question: 'What does this print?',
    choices: ['16', '10', '18', '8'],
    answerIndex: 0,
    explain: `\`16\`. Not 10, and not 18.

\`total\` goes 5, then 8, then 16. At 8 the test still says \`8 < 10\` — true — so
the loop takes another pass, and that pass adds the whole \`8\` and lands on 16.
Then it stops. The \`2\` is never touched.

**Accumulate-until loops always overshoot.** The test runs *before* the pass, so
it can only ever tell you where you were, not where you're about to land. If you
need the exact boundary, you have to check before adding, not after.

(\`while nums and ...\` is the guard: without it, a list that ran out before
\`total\` got to 10 would crash on the \`pop\`.)`,
  },
  fix: {
    task: `This should drain the queue completely, printing every job — \`a\`, \`b\`, \`c\`.
It prints \`a\` and \`b\` and leaves \`c\` sitting in the queue. Fix it.`,
    brokenCode: `queue = ["a", "b", "c"]
while len(queue) > 1:
    print(queue.pop(0))`,
    check: {
      kind: 'asserts',
      code: `assert queue == [], f"The queue still has {queue} in it. Say the test out loud: 'keep going while there is more than one job left.' When should this loop actually stop — at one left, or at none?"
lines = __stdout__.strip().split("\\n")
assert lines == ["a", "b", "c"], f"It printed {lines}, expected ['a', 'b', 'c']."`,
    },
    hints: [
      "One job never gets done, and it's always the last one. Read the test back to yourself as English and listen to what it promises.",
      'You want the loop to keep going while there is *anything* left — and one job left is still something left.',
      "`while queue:` — a non-empty list is true, an empty one is false, so this stops exactly when the queue runs dry. (`while len(queue) > 0:` says the same thing the long way.)",
    ],
    solution: `queue = ["a", "b", "c"]
while queue:
    print(queue.pop(0))`,
  },
  stretch: {
    title: 'The loop and a half',
    body: `Sometimes you can't test at the top, because the thing you'd test doesn't
exist until you've done some work:

\`\`\`python
while True:
    text = read_next()      # do a bit of work...
    if text == "":          # ...now you can test...
        break
    print(text)             # ...and then the rest of the body.
\`\`\`

That's the **loop and a half**: a bit of body, the test, the rest of the body.
One and a half passes' worth of code, with the exit wedged in the middle.

Python has no syntax for it. Some languages do (\`do...while\` gets close). So the
idiom is \`while True\` + \`break\` — not because anyone's being clever, but because
it's the only way to put the test where it honestly belongs.

The tell that you're in one: you catch yourself wanting to write the first line
of the body *twice* — once before the loop to get things started, and once at the
bottom to keep them going. The moment you're copy-pasting a line to make a
\`while\` header work, you wanted a loop and a half.`,
    code: `lines = ["hi", "there", "", "never read"]
i = 0
while True:
    text = lines[i]
    i = i + 1
    if text == "":
        break
    print(text)`,
  },
}
