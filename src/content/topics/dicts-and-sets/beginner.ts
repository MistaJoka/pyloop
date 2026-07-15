import type { Level } from '../../types'

export const beginner: Level = {
  level: 1,
  blurb: 'A dict maps keys to values — and in checks the key, not the value.',
  concept: {
    body: `A list finds things by **position**. A dict finds them by **name**.

\`\`\`python
ages = {"ana": 31, "bo": 24}
ages["ana"]        # 31
\`\`\`

Left of the colon is the **key**, right is the **value**. You look up by key —
there's no \`ages[0]\`, because a dict has no positions to count.

Assignment does double duty: \`ages["cy"] = 19\` adds a new pair, and
\`ages["ana"] = 32\` replaces an existing one. Same syntax, and the dict decides
which happened based on whether the key was already there.

Two things bite everyone once:

- \`"bo" in ages\` checks the **keys**. \`24 in ages\` is \`False\` even though 24
  is sitting right there as a value.
- Asking for a key that isn't there is a \`KeyError\`. That's not the dict being
  fragile — it's the dict telling you the name you asked for doesn't exist.`,
    aiFraming: `A dict is a lookup table, and lookup tables are most of what data work is
made of: word → id, id → label, class name → index, column name → dtype.

The vocabulary in a language model is a dict. The label map in every classifier
you'll build is a dict. When a model reports 87% accuracy on class \`3\` and you
need to know what \`3\` *is*, you go to a dict.

So \`KeyError\` becomes a friend fast. It means "that name isn't in my vocabulary"
— which, nine times out of ten, is the actual bug you were looking for.`,
  },
  watch: {
    code: `ages = {"ana": 31, "bo": 24}
print(ages["ana"])
ages["cy"] = 19
ages["ana"] = 32
print("bo" in ages)
print(24 in ages)
print(ages)`,
    notes: {
      1: `Curly braces, and \`key: value\` pairs separated by commas. The keys here are
strings; the values are numbers.

Nothing is numbered. \`"ana"\` **is** the address.`,
      3: `\`"cy"\` isn't in the dict yet, so this **adds** it. A list would raise IndexError if
you assigned past the end — a dict just grows.`,
      4: `Identical syntax to line 3, opposite effect: \`"ana"\` already exists, so this
**replaces** its value. A dict holds one value per key, always.`,
      6: `\`in\` looks at the **keys** only. \`24\` is a value, not a key, so this is False —
even though you can see it in the dict on line 1.`,
    },
  },
  predict: {
    code: `d = {"a": 1, "b": 2}
d["a"] = 5
print("a" in d, 5 in d)`,
    question: 'What does this print?',
    choices: ['True False', 'True True', 'False True', 'False False'],
    answerIndex: 0,
    explain: `\`True False\`.

\`"a" in d\` → True: \`"a"\` is a key. Line 2 changed its value from 1 to 5, but the
key was there before and after — assignment to an existing key replaces, it
doesn't add a second \`"a"\`.

\`5 in d\` → False, and this is the one that catches people. \`5\` is a **value**.
\`in\` on a dict only ever asks about keys. If you really want to search the
values, that's \`5 in d.values()\` — a different question, and a slower one.`,
  },
  fix: {
    task: `This should print \`5\` — the number of pears in stock. Instead it dies with
\`KeyError: 'Pear'\`. The data is correct. Fix the lookup.`,
    brokenCode: `stock = {"apple": 3, "pear": 5}
print(stock["Pear"])`,
    check: {
      kind: 'asserts',
      code: `assert 'stock' in dir(), "There's no dict called stock anymore — keep it."
assert stock == {"apple": 3, "pear": 5}, f"stock is now {stock!r}. The dict was already right — was the broken thing the data, or the key you asked it for?"
assert __stdout__.strip() == "5", f"It should print 5, pear's value. It printed {__stdout__.strip()!r}."`,
    },
    hints: [
      "A `KeyError` isn't the dict malfunctioning. It's the dict saying: nothing in me is filed under that name. The name it's complaining about is printed right in the error.",
      'Compare `"Pear"` with the keys on line 1, character for character. `"Pear"` and `"pear"` are two different strings, so they are two different keys — a dict does zero guessing.',
      '`print(stock["pear"])` — lowercase, spelled exactly as it was when the dict was built.',
    ],
    solution: `stock = {"apple": 3, "pear": 5}
print(stock["pear"])`,
  },
  stretch: {
    title: 'The other way to "fix" it, and why it\'s worse',
    body: `You could have made the error go away like this:

\`\`\`python
stock = {"apple": 3, "pear": 5, "Pear": 5}
\`\`\`

Now nothing crashes. You also have two keys for one fruit, and the next time
someone adds pears only one of them updates. The crash was a symptom; that
change treats the symptom and keeps the disease.

This shows up for real when keys come from a file: \`"Pear"\`, \`"pear "\`,
\`"PEAR"\` are three distinct keys and your counts split three ways. The fix is
always the same — **normalize the key on the way in**, don't patch the dict on
the way out:

\`\`\`python
key = raw.strip().lower()
\`\`\`

That one line is doing real work in more data pipelines than you'd guess.`,
    code: `raw = "  Pear "
stock = {"apple": 3, "pear": 5}
print(stock[raw.strip().lower()])`,
  },
}
