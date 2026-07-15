import type { Level } from '../../types'

export const master: Level = {
  level: 5,
  blurb: 'Functions as values, pure vs side-effecting, and the default that remembers.',
  concept: {
    body: `A function is a **value**. \`greet\` is a thing you can store, pass and hand
to other code. \`greet()\` is that thing being *run*. The parentheses are the whole
difference.

\`\`\`python
print(sorted(words, key=len))
\`\`\`

\`len\` — no parentheses. You're not calling \`len\`, you're **giving it to
\`sorted\`**, which calls it once per item and sorts by whatever comes back. Your
own functions work identically; \`sorted\` doesn't care who wrote them.

And one trap that falls out of everything you now know:

\`\`\`python
def collect(item, bag=[]):
\`\`\`

That \`[]\` is built **once**, when the \`def\` line runs — not per call. Every call
with no \`bag\` shares the same list, and it fills up across calls. That's not a
Python quirk; it's the Beginner level (\`def\` runs once) meeting the Advanced
level (mutation is visible), and biting.`,
    aiFraming: `Passing functions is how you write code that doesn't know what it's
doing yet — and that's most useful code. \`sorted(key=...)\`, \`df.apply(fn)\`,
\`map\`, a decorator, an agent's tool list, a callback on epoch end: every one is a
function accepting a function.

Which brings the thread home. A **pure** function — inputs in, value out, nothing
else touched — is safe to hand to something that will call it a million times, in
an order you don't control, possibly on eight cores. A side-effecting one isn't,
and the mutable default is what that looks like when it goes wrong: a function
that returns a different answer for the same input, because it remembers.

Pure functions compose. Everything else is a thing you have to keep in your head.`,
  },
  watch: {
    code: `words = ["cherry", "fig", "apple"]
print(sorted(words))
print(sorted(words, key=len))

def last_letter(w):
    return w[-1]

print(sorted(words, key=last_letter))`,
    notes: {
      3: `\`key=len\` passes the function \`len\` **itself** — note the missing parentheses.
\`len(words)\` would call it and pass the number \`3\`; the bare name \`len\` passes the tool.

\`sorted\` calls it once per word and sorts by what comes back — 3, 5, 6 — not by the
words. The list is unchanged, by the way: \`sorted\` returns a **new** list rather than
rearranging yours. Pure.`,
      8: `Your own function, handed over exactly the way \`len\` was on line 3. \`sorted\`
has no idea who wrote it — it just needs something it can call with one item.

Step in and watch: the frame badge flickers up **once per word**, as \`sorted\` reaches
back into your code mid-sort. You didn't call \`last_letter\` anywhere. You handed it over
and something else did.`,
    },
  },
  predict: {
    code: `words = ["cherry", "fig", "apple"]
print(sorted(words, key=len))`,
    question: 'What does this print?',
    choices: [
      "['apple', 'cherry', 'fig']",
      "['fig', 'apple', 'cherry']",
      "['cherry', 'apple', 'fig']",
      '[6, 3, 5]',
    ],
    answerIndex: 1,
    explain: `\`['fig', 'apple', 'cherry']\`.

\`sorted\` calls \`len\` on each word — 6, 3, 5 — and sorts the **words** by those
numbers: 3, 5, 6 → fig, apple, cherry.

Two things worth pinning down. The \`key\` decides the *order*, never the
*output* — you get the original words back, not their lengths (that's why \`[6, 3,
5]\` is wrong). And without \`key\`, you'd get \`['apple', 'cherry', 'fig']\`:
alphabetical, a completely different answer from the same list.

One function, handed in, changes the whole result.`,
  },
  fix: {
    task: `\`collect\` should start with a fresh empty bag every call, so this prints
\`['a']\` and then \`['b']\`. Instead the second call remembers the first and prints
\`['a', 'b']\`.`,
    brokenCode: `def collect(item, bag=[]):
    bag.append(item)
    return bag

print(collect("a"))
print(collect("b"))`,
    check: {
      kind: 'asserts',
      code: `import ast
tree = ast.parse(__source__)
fn = next((n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef) and n.name == 'collect'), None)
assert fn is not None, "collect is gone. It's the thing being fixed — keep it."
assert len(fn.args.args) == 2 and len(fn.args.defaults) == 1, "collect should still take an item plus an optional bag — calling it with one argument has to keep working."
assert not any(isinstance(d, (ast.List, ast.Dict, ast.Set)) for d in fn.args.defaults), "The default is still a list literal. That list gets built once, when the def line runs. How many times does a def line run, no matter how many calls follow?"
assert __stdout__.strip() == "['a']\\n['b']", f"Expected ['a'] then ['b'], got {__stdout__.strip()!r}."`,
    },
    hints: [
      "The `[]` isn't evaluated per call. It's evaluated once, when the `def` line runs — so there is exactly one list, and both calls append to it.",
      "You can't make a literal default fresh. So use a default that's safe to share (`None` shares fine — you can't mutate it), and build the real list inside the body when you find it missing.",
      '`def collect(item, bag=None):` then, as the first line of the body, `if bag is None: bag = []`. Now the fresh list is built per call, because that line runs per call.',
    ],
    solution: `def collect(item, bag=None):
    if bag is None:
        bag = []
    bag.append(item)
    return bag

print(collect("a"))
print(collect("b"))`,
  },
  stretch: {
    title: 'The contract, in one comparison',
    body: `These two look like the same function:

\`\`\`python
def top(xs, n):          # PURE
    return sorted(xs)[:n]

def top_bad(xs, n):      # NOT
    xs.sort()
    return xs[:n]
\`\`\`

Same answer, both times. But \`top_bad\` rearranged the caller's list on the way
past. Call it twice and the second call sees a list the first one edited. Cache
it and the cache is a lie. Run two of them at once and it's a race.

\`top\` you can call a million times, in any order, on any thread, and test with
one \`assert\`. That's not a style preference — it's the entire reason a pipeline
can be reordered, memoized, or parallelized at all.

**Inputs in, value out, nothing else touched.** That sentence is what this whole
topic was building to. \`sorted\` obeys it. \`.sort()\` doesn't, and its name is the
warning.`,
    code: `def top(xs, n):
    return sorted(xs)[:n]

nums = [5, 1, 9, 3]
print(top(nums, 2))
print(nums)`,
  },
}
