import type { Level } from '../../types'

export const working: Level = {
  level: 2,
  blurb: 'Modulo — the leftover, and the two jobs it actually does.',
  concept: {
    body: `\`%\` gives you the **remainder** — what's left over after \`//\` has taken all
the whole parts out.

\`\`\`python
17 // 5    # 3   — three whole fives fit
17 % 5     # 2   — and 2 is left over
\`\`\`

That definition is not why you'd ever use it. These two are:

**1. Does it divide evenly?** A remainder of 0 means yes.

\`\`\`python
10 % 2     # 0  -> even
7 % 2      # 1  -> odd
\`\`\`

**2. Wrap around a range.** \`% 60\` can only ever give you 0–59. \`% 12\` can only
give 0–11. Feed it any number at all and it lands inside the range:

\`\`\`python
130 % 60   # 10  — 130 minutes is 2 hours and 10
25 % 12    # 1   — 25 o'clock is 1 o'clock
\`\`\`

That's the one worth keeping. \`%\` is how you make a number **wrap** instead of
run off the end.`,
    aiFraming: `Wrap-around is not a toy. It's how you cycle through a fixed set of
things forever without ever going out of range — colours in a palette, workers
in a pool, which GPU gets the next batch, which shard a record lands on.

\`index % len(items)\` is the whole trick, and it turns up everywhere from
\`hash(key) % num_buckets\` in a dictionary to a learning-rate schedule that
restarts every N steps. Any time something has to repeat on a cycle, \`%\` is
almost certainly underneath it.

The even/odd use is the same idea worn small: \`n % 2\` is asking which of the 2
slots \`n\` lands in.`,
  },
  watch: {
    code: `n = 17
print(n // 5)
print(n % 5)
minutes = 130
print(minutes % 60)
print(10 % 2)
print(7 % 2)`,
    notes: {
      3: `\`%\` is the leftover. Line 2 said three whole fives fit inside 17; this line says
2 is what didn't fit.

\`//\` and \`%\` are two halves of one division — the whole part and the leftover.`,
      5: `The wrap. 130 is way past 60, so \`% 60\` takes the whole hours out and leaves
where you actually land on the clock face: 10.

Whatever you put on the left, \`% 60\` can only ever come back with 0 to 59.`,
      6: `The evenness test. A leftover of 0 means 2 divided in cleanly — so \`10 % 2\` being
0 *is* "10 is even". Line 7 is the odd case: 1 left over.`,
    },
  },
  predict: {
    code: `hour = 22
print((hour + 5) % 24)`,
    question: 'What does this print?',
    choices: ['3', '27', '2', '22'],
    answerIndex: 0,
    explain: `\`3\`. Five hours after 22:00 is 03:00 — you went past midnight.

\`22 + 5\` really is \`27\`, and \`27 % 24\` is \`3\`. Twenty-four hours' worth is taken
out and what's left is where you actually land on the clock.

That's the pattern in its general form: \`(position + step) % size\`. It can never
hand you a number outside \`0\` to \`size - 1\`, which is exactly why it's the safe
way to move around a fixed-size thing.`,
  },
  fix: {
    task: `A carousel has 12 slots, numbered 0 to 11. Starting at slot 9 and moving 7
forward should land on slot \`4\` — you go past the end and come round. It prints
\`16\`, which isn't a slot at all. Fix it.`,
    brokenCode: `slot = 9
step = 7
new_slot = slot + step
print(new_slot)`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
names = {n.id for n in ast.walk(tree) if isinstance(n, ast.Name)}
assert 'slot' in names and 'step' in names, "Are slot and step both still part of the sum, or did the answer get written in by hand? It should still work for any starting slot."
assert any(isinstance(n, ast.BinOp) and isinstance(n.op, ast.Mod) for n in ast.walk(tree)), "Nothing here wraps yet. Which operator gives you what's left once you've taken whole 12s out?"
assert slot == 9 and step == 7, f"slot is {slot!r} and step is {step!r} now. The starting values aren't the bug — leave them and change what happens to them."
assert new_slot == 4, f"new_slot came out as {new_slot!r}. There are only 12 slots, so anything outside 0-11 hasn't come round yet. What's 16 with a whole 12 taken out of it?"
assert __stdout__.strip() == "4", f"It should print 4, but it printed {__stdout__.strip()!r}."`,
    },
    hints: [
      "`slot + step` is 16, and there is no slot 16. You went one whole lap past 11 and nothing brought you back round.",
      'Twelve of those 16 are a full lap that puts you exactly where you started. Only the leftover moves you. Which operator gives you the leftover?',
      '`new_slot = (slot + step) % 12`. Mind the brackets — without them Python does `step % 12` first and you get 16 again.',
    ],
    solution: `slot = 9
step = 7
new_slot = (slot + step) % 12
print(new_slot)`,
  },
  stretch: {
    title: 'Two more things % quietly does',
    body: `**Pull digits off a number.** \`% 10\` is the last digit, because dividing
by 10 in decimal is just shifting the digits along:

\`\`\`python
1234 % 10     # 4
1234 // 10    # 123  — and now % 10 gives you the 3
\`\`\`

**Every Nth thing.** \`i % 3 == 0\` is true for 0, 3, 6, 9… — that's how you say
"do this every third time" without counting separately. \`n % 2 == 0\` is the same
sentence with N = 2, and it's the standard way to write "is even".

One thing to know before it bites you: with a negative left side, Python's \`%\`
follows the sign of the **right** side, so \`-1 % 12\` is \`11\`, not \`-1\`. That's
the behaviour you want for wrapping — going back one from slot 0 lands you on
slot 11 — and it's different from C and Java, which give \`-1\`.`,
    code: `print(1234 % 10, 1234 // 10)
print(10 % 2, 7 % 2)
print(-1 % 12)`,
  },
}
