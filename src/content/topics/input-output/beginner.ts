import type { Level } from '../../types'

export const beginner: Level = {
  level: 1,
  blurb: 'print() puts things out, input() takes one line in.',
  concept: {
    body: `Two doors. \`print()\` sends text out to the screen; \`input()\` waits for
someone to type a line and hands it back.

\`\`\`python
print("Hello", "world")
name = input("Name? ")
\`\`\`

\`print()\` takes as many values as you like, separated by commas, and puts **one
space between each one**. You didn't ask for that space — it comes free, and it's
why \`print("Hi", name)\` reads correctly without you gluing anything together.

\`input()\` is different: the string you pass it is just a **prompt** to show
before it waits. It isn't part of the answer. The answer is whatever gets typed,
and like any value, it's gone unless you store it — hence the \`name =\`.`,
    aiFraming: `\`input()\` is the smallest possible version of the thing your whole
career is about: text arriving from outside your program.

A prompt goes out, a line of text comes back, and now your code owns something a
human wrote. Swap the human for a CSV file, an API response, or a user message
hitting a model — the shape doesn't change. Something outside sends text in,
something inside has to make sense of it.

Everything in this topic is about that gap between "text arrived" and "I have
usable data".`,
  },
  watch: {
    code: `print("Hello", "world")
name = input("Name? ")
print("Hi", name)
print("Bye", name, "!")`,
    stdin: 'Andrae\n',
    notes: {
      2: `Two things happen here. \`"Name? "\` gets printed — that's all the prompt is, a
string \`input()\` shows before it waits.

Then Python stops, reads one typed line, and \`=\` stores it in \`name\`. What was typed is
**not** echoed back to the screen — so the output shows the prompt and then, later, the
result. Watch \`name\` appear in the variables panel.`,
      4: `Three values, so \`print()\` inserts two spaces — one before \`!\` too. That's the
free space biting you: \`Bye Andrae !\` is almost certainly not what you wanted.

Level 3 is where you get to say exactly where the spaces go.`,
    },
  },
  predict: {
    code: `print("2 + 2 =", 2 + 2)`,
    question: 'What does this print?',
    choices: ['2 + 2 = 4', '2 + 2 = 2 + 2', '2 + 2 =4', '4'],
    answerIndex: 0,
    explain: `\`2 + 2 = 4\`. Two separate arguments, so two separate fates.

The first is inside quotes — text, printed exactly as written, symbols and all.
The second isn't, so Python **works it out first** and prints the answer \`4\`.

Then \`print\` joins them with its automatic space. Quotes are the whole
difference: they decide whether \`2 + 2\` is a sum or a sentence.`,
  },
  fix: {
    task: `This should greet whoever typed their name — with \`Andrae\` typed in, it should
print \`Name? Hello Andrae\`. It prints \`Name? Hello name\` instead. Fix it.`,
    brokenCode: `name = input("Name? ")
print("Hello", "name")`,
    stdin: 'Andrae\n',
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
texts = [n.value for n in ast.walk(tree) if isinstance(n, ast.Constant) and isinstance(n.value, str)]
assert not any('Andrae' in t for t in texts), "Andrae is typed into the code now — but the program can't know the name until someone types it at the prompt. Where did what they typed get stored?"
assert any(isinstance(n, ast.Call) and getattr(n.func, 'id', '') == 'input' for n in ast.walk(tree)), "Is anything still asking for a name? The prompt has to be there for a line to be read."
assert __stdout__.strip() == "Name? Hello Andrae", f"Expected 'Name? Hello Andrae' (the prompt is part of the output), but it was {__stdout__.strip()!r}. What is different about how the two things after print( are written?"`,
    },
    hints: [
      'Line 1 works — the typed name really is stored. The problem is on line 2: look closely at what `print` is being handed.',
      'Quotes mean "this exact text". Without quotes, a word is a **name** and Python looks up what is stored under it. Which one do you want here?',
      '`print("Hello", name)` — no quotes around `name`, so Python prints the value it holds rather than the four letters n-a-m-e.',
    ],
    solution: `name = input("Name? ")
print("Hello", name)`,
  },
  stretch: {
    title: 'The prompt is just an argument',
    body: `\`input()\` with nothing in the brackets is perfectly legal — it waits without
saying anything, which looks like your program has frozen. The prompt is a
courtesy to the human, not a requirement.

\`\`\`python
name = input()             # works, but the screen just sits there
name = input("Name? ")     # same thing, with a hint
\`\`\`

And nothing stops you printing the prompt yourself first — \`input("Name? ")\` is
shorthand for \`print("Name? ", end="")\` followed by \`input()\`. It's one line
instead of two, and that's the only difference.`,
    code: `print("Name? ", end="")
name = input()
print("Hi", name)`,
  },
}
