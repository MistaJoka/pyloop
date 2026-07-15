import type { Level } from '../../types'

export const working: Level = {
  level: 2,
  blurb: 'input() always hands back a str — even when they typed a number.',
  concept: {
    body: `This is the one to keep. **\`input()\` always returns a \`str\`. Always.**

Type \`25\` and you do not get the number 25. You get \`"25"\` — two characters that
look like a number and behave like text:

\`\`\`python
age = input("Age? ")   # they type 25
age + 1                # TypeError
age + "1"              # "251"  — worse: no error at all
\`\`\`

\`+\` joins text and adds numbers, so a typed number silently goes down the wrong
path. The fix is one word:

\`\`\`python
age = int(input("Age? "))
\`\`\`

\`int()\` **converts** — it reads the characters and builds the number they spell.
Do it at the door, the moment the text arrives, and the rest of your program gets
a real number.`,
    aiFraming: `Every dataset arrives as text. A CSV is characters on disk; nothing in
the file says "this column is numbers". Something has to decide.

That's exactly what \`pd.read_csv\` is doing when it *guesses* a dtype per column
— it's running \`int()\` on your behalf, millions of times. And when one row has
\`N/A\` in the age column, the guess collapses: the whole column becomes
\`object\`, meaning str, and your \`.mean()\` either explodes or lies.

\`input()\` returning str is that problem shrunk to one line. Same question,
same answer: text is not data until something converts it, and you should know
where that conversion happens.`,
  },
  watch: {
    code: `age = input("Age? ")
print(age)
print(type(age))
print(age + "1")
number = int(age)
print(type(number))
print(number + 1)`,
    stdin: '25\n',
    notes: {
      3: `\`type()\` asks Python what kind of value this is. It says \`<class 'str'>\` — text —
even though \`25\` was typed and it looks like a number on screen.

Nothing about typing digits makes it a number. It's characters, all the way.`,
      4: `The trap, in one line. \`+\` on two strings **joins**, so \`"25" + "1"\` is \`"251"\`.

No error. No warning. Just a wrong answer that happens to look plausible.`,
      5: `\`int()\` reads the characters \`"25"\` and builds the number 25 from them. It doesn't
change \`age\` — it returns a new value, which is why it has to be stored.

Look at the variables panel: \`age\` is still \`'25'\` with quotes; \`number\` is \`25\` without.`,
    },
  },
  predict: {
    code: `x = "7"
y = int(x)
print(x + x, y + y)`,
    question: 'What does this print?',
    choices: ['77 14', '14 14', '77 77', '7777 14'],
    answerIndex: 0,
    explain: `\`77 14\`. Same \`+\`, same-looking values, two different jobs — because the
types differ.

\`x\` is the text \`"7"\`, so \`x + x\` **joins** it to itself: \`"77"\`. \`y\` is the
number 7, so \`y + y\` **adds**: \`14\`. And note the space between them: that's
\`print\` joining its two arguments, nothing to do with the maths.

The output gives no hint that \`77\` is text and \`14\` is a number. On screen they
look like siblings. That's what makes this bug survive.`,
  },
  fix: {
    task: `Someone types their age and this should print \`Next year you turn 26\`. It prints
\`Next year you turn 251\`. Fix it.`,
    brokenCode: `age = input("Age? ")
next_age = age + "1"
print("Next year you turn", next_age)`,
    stdin: '25\n',
    check: {
      kind: 'asserts',
      code: `assert 'next_age' in dir(), "There's no variable called next_age anymore — keep it."
assert isinstance(next_age, int), f"next_age is {next_age!r} — that's a str, not a number. input() handed back text, and + on text joins instead of adding. What has to happen to the text before the + can mean 'add'?"
assert next_age == 26, f"next_age came out as {next_age}, expected 26."
assert __stdout__.strip() == "Age? Next year you turn 26", f"Expected 'Age? Next year you turn 26' (the prompt is part of the output too), but it was {__stdout__.strip()!r}."`,
    },
    hints: [
      'Nothing here crashed, which is the tell. Python found a perfectly good meaning for what you wrote — just not the one you wanted. What type is `age`?',
      "`age` is `\"25\"`, text. `\"1\"` is text. Text plus text is longer text. You need both sides to be numbers before `+` will add.",
      '`next_age = int(age) + 1` — convert the text to a number first, then add the number 1 (no quotes).',
    ],
    solution: `age = input("Age? ")
next_age = int(age) + 1
print("Next year you turn", next_age)`,
  },
  stretch: {
    title: 'Convert at the door',
    body: `Both of these work:

\`\`\`python
age = input("Age? ")
age = int(age)
\`\`\`
\`\`\`python
age = int(input("Age? "))
\`\`\`

The second reads inside-out: \`input()\` runs first, its result goes straight into
\`int()\`. One line, and \`age\` is never briefly a string.

Prefer it. It means there is exactly **one** place in your program where text
becomes a number, right at the boundary, and everything downstream can assume
it's a number. The alternative — converting wherever you happen to need it — is
how you end up with \`int(age)\` in four places and one place you forgot.

Same for \`float(input(...))\` when decimals are allowed. \`int("3.5")\` is an
error, not 3.`,
    code: `age = int(input("Age? "))
print(age * 2)`,
  },
}
