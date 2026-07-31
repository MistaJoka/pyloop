import type { Capstone } from './types'

// The corpus (embedded in stage 1's task and the solution) is original text,
// engineered: 68 tokens, 9 distinct words, every word appears in non-final
// position — so every word has a follower and a 40-step walk can never dead-
// end. The transition counts the checks pin (to→the ×8, saw→the ×4, the→each
// noun ×6, moon→{saw 1, the 2, sang 1, ran 1}) are hand-counted from it.
// Randomness is always seeded in checks and harness; assertions are property-
// based (membership, adjacency, distribution) — never exact-sequence.
export const markov: Capstone = {
  id: 'markov',
  title: 'The Predictor',
  blurb: 'Count which word follows which, then let the counts write sentences — a tiny language model, built from a dict.',
  whyItMatters: `Here is the bet underneath every language model ever built: *the next word
can be predicted from the words before it.* You're about to make that bet
with a dict — count what follows what, then pick the next word by those
counts. Watch the payoff and you'll see your program weigh its options and
choose, forty times in a row.

This is the direct line to where you're headed. GPT is this same bet with a
vastly better memory for context — the lookup got smarter, the idea didn't
move. Build the skeleton once with your own hands and the big models stop
being magic: they're your \`chain\` dict, scaled until it works
unreasonably well.`,
  payoffKind: 'textgen',
  payoffLabel: 'Your model, choosing 40 words',
  placeholder: 'One program, built in four pieces. Start by breaking text into words.',
  runCta: 'Generate again',

  stages: [
    {
      id: 1,
      title: 'Tokenize',
      task: `A model reads words, not prose. You're given a tiny corpus — paste this
at the top of your program:

\`\`\`python
CORPUS = """the moon saw the cat. the cat saw the river.
the river ran to the sea. the sea sang to the moon.
the cat ran to the moon. the moon sang to the river.
the sea saw the cat. the river sang to the sea.
the moon ran to the cat. the sea ran to the river.
the cat sang to the sea. the river saw the moon."""
\`\`\`

Write:

\`\`\`python
def tokenize(text):
\`\`\`

returning the words of \`text\` in order: split on whitespace, lowercase
each word, and strip \`.,!?\` off the ends (punctuation inside a word
stays). Then apply it: \`words = tokenize(CORPUS)\`.`,
      check: {
        kind: 'asserts',
        code: `assert tokenize("The moon. Saw!") == ["the", "moon", "saw"], f'tokenize("The moon. Saw!") should be ["the", "moon", "saw"] — got {tokenize("The moon. Saw!")}.'
assert tokenize("Stop, go? stop.") == ["stop", "go", "stop"], "Strip .,!? from the ends of each word — and lowercase everything."
assert tokenize("well-known fact") == ["well-known", "fact"], "Punctuation INSIDE a word stays — only the ends get stripped."
assert words[:8] == ["the", "moon", "saw", "the", "cat", "the", "cat", "saw"], f"words should start with the corpus's first two sentences — got {words[:8]}."
assert len(words) == 68, f"The corpus tokenizes to 68 words — got {len(words)}."`,
      },
      hints: [
        '`text.split()` handles all the whitespace at once — spaces and newlines both.',
        'Each raw word needs two touches: `.strip(".,!?")` takes punctuation off both ends, `.lower()` flattens the case. Order doesn\'t matter.',
        'Collect into a list with a loop or a comprehension, and don\'t forget the last line: `words = tokenize(CORPUS)`. If strip-and-lower feels wobbly, **strings · Fluent** is the rung.',
      ],
      topicRefs: [
        { topicId: 'strings', level: 3 },
        { topicId: 'lists-and-tuples', level: 2 },
        { topicId: 'for-loops', level: 2 },
      ],
    },
    {
      id: 2,
      title: 'Count what follows',
      task: `Now the model's memory. Write:

\`\`\`python
def build_chain(words):
\`\`\`

returning a dict of dicts: for each word, which words ever came right
after it, and how many times. In this corpus \`"saw"\` is followed by
\`"the"\` four times, so \`chain["saw"]\` is \`{"the": 4}\`.

Walk the word pairs — position \`i\` and position \`i + 1\` — and count.
The last word has no pair; it simply isn't a key unless it appeared
earlier too. Then apply it: \`chain = build_chain(words)\`.`,
      check: {
        kind: 'asserts',
        code: `assert chain.get("to") == {"the": 8}, f'Every "to" in the corpus is followed by "the" — chain["to"] should be {{"the": 8}}, got {chain.get("to")}.'
assert chain.get("saw") == {"the": 4}, f'chain["saw"] should be {{"the": 4}} — got {chain.get("saw")}.'
assert chain.get("the") == {"moon": 6, "cat": 6, "river": 6, "sea": 6}, f'"the" is followed by each of the four nouns exactly 6 times — got {chain.get("the")}.'
assert chain.get("moon") == {"saw": 1, "the": 2, "sang": 1, "ran": 1}, f'Careful at the very end: the corpus\\'s last word has no follower, so the final "moon" adds nothing. Expected {{"saw": 1, "the": 2, "sang": 1, "ran": 1}} — got {chain.get("moon")}.'
assert chain.get("sang") == {"to": 4} and chain.get("ran") == {"to": 4}, "sang and ran are always followed by to."`,
      },
      hints: [
        'Pairs live at positions `i` and `i + 1` — so the loop runs `for i in range(len(words) - 1)`. That minus-one IS the last-word rule.',
        'Two levels of dict: `if word not in chain: chain[word] = {}` makes the inner one exist before you count into it.',
        'The inner count is the classic `.get` move: `chain[word][nxt] = chain[word].get(nxt, 0) + 1`. Nested dicts are **dictionaries and sets · Advanced** ground if this shape is new.',
      ],
      topicRefs: [
        { topicId: 'dicts-and-sets', level: 4 },
        { topicId: 'for-loops', level: 3 },
      ],
    },
    {
      id: 3,
      title: 'Choose the next word',
      task: `Prediction time. Add \`import random\` at the top of your program, then
write:

\`\`\`python
def next_word(chain, word):
\`\`\`

returning a randomly chosen follower of \`word\` — **weighted by the
counts**. If \`"moon"\` was followed by \`"the"\` twice and \`"saw"\` once,
then \`"the"\` should come up about twice as often. The straightforward
way: build a list where each follower appears as many times as its count,
then \`random.choice\` it. A word the chain has never seen returns
\`None\` — the model can't predict from nothing.`,
      check: {
        kind: 'asserts',
        code: `import random
random.seed(11)
for _ in range(50):
    w = next_word(chain, "the")
    assert w in chain["the"], f"next_word must return an actual follower of 'the' — got {w!r}."
seen = set()
random.seed(7)
for _ in range(200):
    seen.add(next_word(chain, "the"))
assert len(seen) >= 2, "200 draws from 'the' always gave the same word — that's a max(), not a weighted random choice."
random.seed(2026)
counts = {"saw": 0, "the": 0, "sang": 0, "ran": 0}
for _ in range(600):
    w = next_word(chain, "moon")
    assert w in counts, f"next_word returned {w!r}, which never follows 'moon'."
    counts[w] += 1
assert counts["the"] > counts["saw"] * 1.5, f"'the' follows 'moon' twice as often as 'saw' — 600 draws should show it. Got {counts}."
assert next_word(chain, "zeppelin") is None, "A word the chain has never seen returns None."`,
      },
      hints: [
        'Guard first: `if word not in chain: return None`. Everything after can trust the lookup.',
        'The weighting trick is repetition: `candidates.extend([follower] * count)` for each pair in `chain[word].items()` — now a plain `random.choice(candidates)` is automatically weighted.',
        'The check draws hundreds of seeded samples, so a shortcut like always-the-biggest gets caught. If items()-loops feel new, **dictionaries and sets · Fluent** is exactly this.',
      ],
      topicRefs: [
        { topicId: 'dicts-and-sets', level: 3 },
        { topicId: 'conditionals', level: 3 },
        { topicId: 'functions', level: 3 },
      ],
    },
    {
      id: 4,
      title: 'Generate',
      task: `Now let it write. Write:

\`\`\`python
def generate(chain, start, n):
\`\`\`

returning a string of up to \`n\` words separated by spaces: it begins
with \`start\`, and each next word is \`next_word\` of the previous one —
a **while** loop that keeps walking until it has \`n\` words or
\`next_word\` returns \`None\`, whichever comes first.

That's the whole model: counts in, sentences out.`,
      check: {
        kind: 'asserts',
        code: `import random
random.seed(5)
text = generate(chain, "the", 12)
out = text.split()
assert out[0] == "the", f"The walk starts at start — got {out[:3]}."
assert len(out) == 12, f"This corpus never dead-ends, so a 12-word walk goes the distance — got {len(out)} words."
for a, b in zip(out, out[1:]):
    assert b in chain[a], f"'{b}' never follows '{a}' in the corpus — every step must be a real transition."
random.seed(1)
t1 = generate(chain, "the", 20)
random.seed(2)
t2 = generate(chain, "the", 20)
assert t1 != t2, "Different seeds should wander differently — the walk is random, not fixed."
assert generate(chain, "zeppelin", 5) == "zeppelin", "An unknown start has nowhere to go: the walk stops immediately with just the start word."`,
      },
      hints: [
        'Keep a list that starts as `[start]` and a `current` word. The loop condition is about length: `while len(out) < n:`.',
        'Each lap: ask `next_word(chain, current)`; on `None`, `break`; otherwise append it and it becomes `current`.',
        'Finish with `" ".join(out)` — a string built from pieces at the end, not along the way. If the walk-until-stopped shape wobbles, **while loops · Fluent** is the rung.',
      ],
      topicRefs: [
        { topicId: 'while-loops', level: 3 },
        { topicId: 'functions', level: 4 },
        { topicId: 'strings', level: 4 },
      ],
    },
  ],

  harness: `import random as __rnd
__rnd.seed(2026)
__walk = ["the"]
__steps = []
__cur = "the"
for _ in range(40):
    __opts = sorted(chain[__cur].items(), key=lambda kv: (-kv[1], kv[0]))
    __nxt = next_word(chain, __cur)
    __steps.append({"word": __cur, "options": [[__w, __c] for __w, __c in __opts], "chosen": __nxt})
    __walk.append(__nxt)
    __cur = __nxt
__collect__ = {"start": "the", "tokens": __walk, "steps": __steps}`,

  payoffAsserts: `assert len(__collect__["tokens"]) >= 30, "the corpus is circular — a 40-step walk never dead-ends"
assert len(__collect__["tokens"]) == len(__collect__["steps"]) + 1, "tokens are the start word plus one per step"
assert all(s["chosen"] == __collect__["tokens"][i + 1] for i, s in enumerate(__collect__["steps"])), "each step's chosen word is the next token"
assert all(any(o[0] == s["chosen"] for o in s["options"]) for s in __collect__["steps"]), "every chosen word appears on its step's option table"
assert all(s["chosen"] in chain[s["word"]] for s in __collect__["steps"]), "every transition is real"`,

  solution: `import random

CORPUS = """the moon saw the cat. the cat saw the river.
the river ran to the sea. the sea sang to the moon.
the cat ran to the moon. the moon sang to the river.
the sea saw the cat. the river sang to the sea.
the moon ran to the cat. the sea ran to the river.
the cat sang to the sea. the river saw the moon."""

def tokenize(text):
    words = []
    for raw in text.split():
        words.append(raw.strip(".,!?").lower())
    return words

words = tokenize(CORPUS)

def build_chain(words):
    chain = {}
    for i in range(len(words) - 1):
        word = words[i]
        nxt = words[i + 1]
        if word not in chain:
            chain[word] = {}
        chain[word][nxt] = chain[word].get(nxt, 0) + 1
    return chain

chain = build_chain(words)

def next_word(chain, word):
    if word not in chain:
        return None
    candidates = []
    for follower, count in chain[word].items():
        candidates.extend([follower] * count)
    return random.choice(candidates)

def generate(chain, start, n):
    out = [start]
    current = start
    while len(out) < n:
        nxt = next_word(chain, current)
        if nxt is None:
            break
        out.append(nxt)
        current = nxt
    return " ".join(out)`,

  stretches: [
    {
      title: 'Trigrams — give it two words of memory',
      body: `Your model remembers one word. Give it two and watch the sentences
snap into focus:

\`\`\`python
def build_chain2(words):
    chain = {}
    for i in range(len(words) - 2):
        key = (words[i], words[i + 1])
        nxt = words[i + 2]
        if key not in chain:
            chain[key] = {}
        chain[key][nxt] = chain[key].get(nxt, 0) + 1
    return chain
\`\`\`

The key is a **tuple** — two words as one dict key, which is exactly what
tuples are for. More context, better predictions, bigger table: you've
just discovered the trade every language model makes. **dictionaries and
sets · Master** territory.`,
      code: `def tokenize(text):
    return [w.strip(".,!?").lower() for w in text.split()]

words = tokenize("the moon saw the cat. the cat saw the river. the river ran to the sea.")

def build_chain2(words):
    chain = {}
    for i in range(len(words) - 2):
        key = (words[i], words[i + 1])
        nxt = words[i + 2]
        if key not in chain:
            chain[key] = {}
        chain[key][nxt] = chain[key].get(nxt, 0) + 1
    return chain

print(build_chain2(words)[("the", "cat")])`,
    },
    {
      title: 'The one-liner the stdlib was hiding',
      body: `Your flatten-and-choose is exactly what \`random.choices\` does with its
\`weights\` argument:

\`\`\`python
def next_word(chain, word):
    if word not in chain:
        return None
    followers = list(chain[word].keys())
    counts = list(chain[word].values())
    return random.choices(followers, weights=counts)[0]
\`\`\`

Same behavior, no repeated-elements list. Building the naive version first
is why this reads as obvious now instead of as magic.`,
      code: `import random
random.seed(3)
chain = {"moon": {"saw": 1, "the": 2, "sang": 1}}

def next_word(chain, word):
    if word not in chain:
        return None
    followers = list(chain[word].keys())
    counts = list(chain[word].values())
    return random.choices(followers, weights=counts)[0]

print([next_word(chain, "moon") for _ in range(8)])`,
    },
    {
      title: 'Temperature — the knob on every model',
      body: `Sharpen or flatten the counts before choosing and you control how daring
the model is:

\`\`\`python
weighted = {w: count ** (1 / temperature) for w, count in options.items()}
\`\`\`

Temperature below 1 exaggerates the differences — the model plays it
safe, picking favorites. Above 1 flattens them — it takes risks. This is
*literally* the temperature setting on every LLM API: the same exponent,
applied to the same kind of table your \`chain\` holds. You now know what
the knob does from the inside.`,
      code: `options = {"the": 4, "saw": 2, "ran": 1}
for temperature in (0.5, 1.0, 2.0):
    weighted = {w: round(c ** (1 / temperature), 2) for w, c in options.items()}
    print(temperature, weighted)`,
    },
  ],
}
