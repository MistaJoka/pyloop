import type { Capstone } from './types'

// The message rides in on stdin (input-output coverage). Substitution KEY is
// a fixed permutation; the crack's scorer is prescribed in the task so every
// faithful implementation lands the same answer the checks pin.
export const cipher: Capstone = {
  id: 'cipher',
  title: 'The Cipher Kit',
  blurb: 'Scramble a secret message with arithmetic, unscramble it — then break the whole cipher with nothing but letter statistics.',
  whyItMatters: `A cipher is text arithmetic: \`ord\` turns a letter into a number, \`chr\`
turns it back, and everything between is math you already know. That
letters-are-numbers move is the ground floor of language processing — before
a model can read anything, someone turns every character into an integer.
You're about to do it one character at a time.

The last checkpoint is the real lesson. You don't break the cipher with a
key — you break it with *statistics*: English leans hard on a few letters,
and that fingerprint survives any shift. Finding the pattern the scrambler
couldn't hide is the same instinct machine learning runs on, and here you
get it in four lines of counting.`,
  payoffKind: 'cipher',
  payoffLabel: 'The encode, then the break',
  stdin: 'meet me at the old pier at midnight',
  placeholder: 'One program, built in four pieces. Start with a single letter.',
  runCta: 'Run the break',

  stages: [
    {
      id: 1,
      title: 'One letter',
      task: `Caesar's whole trick is sliding the alphabet. Write:

\`\`\`python
def shift_char(ch, k):
\`\`\`

returning \`ch\` shifted \`k\` places: \`"a"\` shifted 1 is \`"b"\`, and
\`"z"\` shifted 1 wraps around to \`"a"\`. Uppercase shifts inside the
uppercase alphabet, lowercase inside lowercase, and anything that isn't a
letter — spaces, punctuation, digits — passes through untouched. Negative
shifts slide backwards.`,
      check: {
        kind: 'asserts',
        code: `assert shift_char("a", 1) == "b", f'shift_char("a", 1) should be "b" — got {shift_char("a", 1)!r}.'
assert shift_char("m", 7) == "t", f'shift_char("m", 7) should be "t" — got {shift_char("m", 7)!r}.'
assert shift_char("z", 1) == "a", 'The end of the alphabet wraps: "z" shifted 1 is "a". That is what % 26 is for.'
assert shift_char("Z", 2) == "B", 'Uppercase wraps inside uppercase: "Z" shifted 2 is "B".'
assert shift_char("A", 3) == "D" and shift_char("Q", 5) == "V", "Uppercase letters shift within A–Z, keeping their case."
assert shift_char("a", -1) == "z", 'Negative shifts slide backwards: "a" shifted -1 is "z".'
assert shift_char(" ", 5) == " " and shift_char("!", 9) == "!" and shift_char("7", 3) == "7", "Non-letters pass through unchanged."`,
      },
      hints: [
        'Letters are numbers in costume: `ord("a")` is 97 and `chr(97)` is `"a"` again. Move to 0–25 space first — subtract `ord("a")` — then shift, then come back.',
        'Two branches for the two alphabets: lowercase anchors at `ord("a")`, uppercase at `ord("A")`. A character that fits neither returns as-is.',
        '`% 26` is the entire wraparound story, and it handles negative shifts for free — Python\'s `%` always lands in 0–25. If mod arithmetic feels slippery, **operators and expressions · Advanced** is the rung.',
      ],
      topicRefs: [
        { topicId: 'operators', level: 4 },
        { topicId: 'strings', level: 2 },
        { topicId: 'conditionals', level: 3 },
      ],
    },
    {
      id: 2,
      title: 'The whole message',
      task: `The secret arrives on standard input — read it first:

\`\`\`python
message = input()
\`\`\`

Then scale one letter up to a whole text. Write:

\`\`\`python
def encode(text, k):
def decode(text, k):
\`\`\`

\`encode\` shifts every character of \`text\` by \`k\` (your \`shift_char\`
does the real work); \`decode\` undoes it. Decoding is not new math —
think about what undoes a slide of \`k\`.`,
      check: {
        kind: 'asserts',
        code: `assert message == "meet me at the old pier at midnight", f"message should be read from input() — got {message!r}."
assert encode("abc", 1) == "bcd", f'encode("abc", 1) should be "bcd" — got {encode("abc", 1)!r}.'
assert encode("hello, world!", 5) == "mjqqt, btwqi!", f'Punctuation stays put: encode("hello, world!", 5) should be "mjqqt, btwqi!" — got {encode("hello, world!", 5)!r}.'
assert encode("Zebra Zoo", 2) == "Bgdtc Bqq", "Case survives encoding — capitals stay capital, and Z wraps to B."
assert decode(encode("attack at dawn", 9), 9) == "attack at dawn", "decode must undo encode exactly."
for k in (1, 7, 13, 25):
    assert decode(encode(message, k), k) == message, f"Round trip broke at shift {k} — decode(encode(m, k), k) must give m back."`,
      },
      hints: [
        '`encode` is one loop: shift each character with `shift_char`, collect the pieces, and `"".join(...)` them at the end.',
        '`decode` needs no new machinery — undoing a slide of `k` is sliding by `-k`. One line that calls `encode`.',
        'Don\'t forget `message = input()` at the top — the check reads it. If building-a-string-from-pieces is the wall, **strings · Advanced** covers join and friends.',
      ],
      topicRefs: [
        { topicId: 'input-output', level: 2 },
        { topicId: 'for-loops', level: 2 },
        { topicId: 'functions', level: 2 },
        { topicId: 'strings', level: 4 },
      ],
    },
    {
      id: 3,
      title: 'Substitution',
      task: `Sliding is guessable — 25 tries and you're in. A **substitution** cipher
scrambles the whole alphabet instead. Paste this key:

\`\`\`python
KEY = "qwertyuiopasdfghjklzxcvbnm"
\`\`\`

Position 0 says \`"a"\` becomes \`"q"\`, position 1 says \`"b"\` becomes
\`"w"\`, and so on. Write:

\`\`\`python
def make_table(key):   # {"a": "q", "b": "w", ...}
def flip(table):       # {"q": "a", "w": "b", ...} — the decoder
def sub_encode(text, table):
\`\`\`

\`sub_encode\` replaces each character via the table; characters not in
the table pass through. Encoding with \`flip\`'s output is decoding.`,
      check: {
        kind: 'asserts',
        code: `t = make_table(KEY)
assert isinstance(t, dict) and len(t) == 26, f"make_table should return a 26-entry dict — got {len(t) if isinstance(t, dict) else type(t).__name__}."
assert t["a"] == "q" and t["b"] == "w" and t["z"] == "m", f'Position i of the plain alphabet maps to position i of KEY — got a→{t.get("a")!r}, b→{t.get("b")!r}, z→{t.get("z")!r}.'
r = flip(t)
assert r["q"] == "a" and r["w"] == "b" and r["m"] == "z", "flip swaps every pair: the value becomes the key."
assert sub_encode("meet me", t) == "dttz dt", f'sub_encode("meet me", t) should be "dttz dt" — got {sub_encode("meet me", t)!r}.'
assert sub_encode(sub_encode(message, t), r) == message, "Encoding with the table then with its flip must give the message back."
assert sub_encode("a-b!", t) == "q-w!", "Characters that aren't in the table pass through."`,
      },
      hints: [
        'Walk two alphabets in step: for each `i` in `range(26)`, the letter `chr(ord("a") + i)` maps to `key[i]`.',
        'Flipping is one loop over `table.items()` — store each pair the other way around.',
        '`sub_encode` is a lookup with a guard: `table[ch] if ch in table else ch`, joined up. If dict lookups still feel new, **dictionaries and sets · Working** is exactly this.',
      ],
      topicRefs: [
        { topicId: 'dicts-and-sets', level: 2 },
        { topicId: 'strings', level: 3 },
      ],
    },
    {
      id: 4,
      title: 'Crack it',
      task: `Now switch sides. You've intercepted a Caesar-encoded message and you
don't know the shift. Write:

\`\`\`python
def crack(ciphertext):
\`\`\`

returning the shift that was used. The attack: a \`while\` loop tries every
shift from 0 to 25, decodes with it, and **scores** the result by counting
its characters that appear in \`"etaoin"\` — the six most common letters in
English. Real English lights that counter up; wrong shifts read like
static. Keep the first shift with the highest score and return it.

No key, no luck — just counting. That's the whole break.`,
      check: {
        kind: 'asserts',
        code: `for k in (3, 7, 19):
    got = crack(encode(message, k))
    assert got == k, f"crack should recover shift {k} from the encoded message — got {got}."
assert crack(encode("the cat sat on the mat", 11)) == 11, "crack should work on other English text too — it's counting letters, not memorizing messages."`,
      },
      hints: [
        'Brute force is honest work at this scale: `k = 0`, then `while k < 26:` — decode with `k`, score it, `k += 1`.',
        'The score is one count: how many characters of the decoded guess are in `"etaoin"`. A `for ch in guess:` with an `if ch in "etaoin":` inside does it.',
        'Keep a champion: best score and best shift so far, replaced only on strictly-greater. If the loop-with-a-champion shape wobbles, **while loops · Fluent** is exactly it.',
      ],
      topicRefs: [
        { topicId: 'while-loops', level: 3 },
        { topicId: 'dicts-and-sets', level: 3 },
        { topicId: 'operators', level: 2 },
      ],
    },
  ],

  harness: `__k = 7
__enc = encode(message, __k)
__chars = [{"plain": __p, "cipher": __c} for __p, __c in zip(message, __enc)]
__cands = []
__s = 0
while __s < 26:
    __cands.append({"shift": __s, "text": decode(__enc, __s)})
    __s += 1
__collect__ = {"message": message, "shift": __k, "encoded": __enc, "chars": __chars, "candidates": __cands, "cracked": crack(__enc)}`,

  payoffAsserts: `assert __collect__["encoded"] != message, "the encoding actually changed the text"
assert len(__collect__["chars"]) == len(message), "one plain/cipher pair per character"
assert all(c["plain"] == c["cipher"] for c in __collect__["chars"] if not c["plain"].isalpha()), "non-letters pass through unchanged"
assert __collect__["candidates"][7]["text"] == message, "decoding with the true shift recovers the message"
assert __collect__["cracked"] == 7, "the statistics find shift 7"`,

  solution: `message = input()

def shift_char(ch, k):
    if "a" <= ch <= "z":
        return chr((ord(ch) - ord("a") + k) % 26 + ord("a"))
    if "A" <= ch <= "Z":
        return chr((ord(ch) - ord("A") + k) % 26 + ord("A"))
    return ch

def encode(text, k):
    out = []
    for ch in text:
        out.append(shift_char(ch, k))
    return "".join(out)

def decode(text, k):
    return encode(text, -k)

KEY = "qwertyuiopasdfghjklzxcvbnm"

def make_table(key):
    table = {}
    for i in range(26):
        table[chr(ord("a") + i)] = key[i]
    return table

def flip(table):
    flipped = {}
    for plain, secret in table.items():
        flipped[secret] = plain
    return flipped

def sub_encode(text, table):
    out = []
    for ch in text:
        if ch in table:
            out.append(table[ch])
        else:
            out.append(ch)
    return "".join(out)

def crack(ciphertext):
    best_shift = 0
    best_score = -1
    k = 0
    while k < 26:
        guess = decode(ciphertext, k)
        score = 0
        for ch in guess:
            if ch in "etaoin":
                score += 1
        if score > best_score:
            best_score = score
            best_shift = k
        k += 1
    return best_shift`,

  walkthrough: [
    {
      title: 'The message, and one letter',
      body: `Everything in this kit rests on one idea: **letters are numbers wearing
costumes**. \`ord\` takes the costume off, arithmetic does the work, \`chr\`
puts it back on. \`shift_char\` handles exactly one character — the whole
message is someone else's job, which is what keeps each function small
enough to trust.`,
      code: `message = input()

def shift_char(ch, k):
    if "a" <= ch <= "z":
        return chr((ord(ch) - ord("a") + k) % 26 + ord("a"))
    if "A" <= ch <= "Z":
        return chr((ord(ch) - ord("A") + k) % 26 + ord("A"))
    return ch`,
      notes: {
        1: "input() reads whatever gets typed — here, PyLoop types the mission text for this capstone: `meet me at the old pier at midnight`. The program never hard-codes its message; it processes whatever arrives.",
        5: 'The whole cipher in one expression, inside-out: `ord(ch) - ord("a")` turns the letter into 0–25, `+ k` shifts it, `% 26` wraps z back around to a (and handles negative shifts too), `+ ord("a")` and `chr` turn it back into a letter.',
        8: "Anything that isn't a letter — spaces, punctuation — passes through untouched. That's why the encoded message keeps its word shapes.",
      },
      topicRefs: [
        { topicId: 'input-output', level: 2 },
        { topicId: 'operators', level: 4 },
      ],
    },
    {
      title: 'The whole message',
      body: `Scaling one character up to a full message is a loop and a join — and
then \`decode\` costs one line, because undoing a shift of \`k\` is just
shifting by \`-k\`. When an inverse falls out this cheaply, it's a sign the
design underneath is right.`,
      code: `def encode(text, k):
    out = []
    for ch in text:
        out.append(shift_char(ch, k))
    return "".join(out)

def decode(text, k):
    return encode(text, -k)`,
      notes: {
        5: 'Collect pieces in a list, join once at the end. Building a string with `+=` in a loop works too, but the list-then-join shape is the idiom you\'ll meet everywhere real text gets assembled.',
        8: 'The whole decoder. Encoding moved every letter k steps clockwise; decoding is k steps back — same machine, reversed.',
      },
      topicRefs: [
        { topicId: 'for-loops', level: 2 },
        { topicId: 'strings', level: 4 },
        { topicId: 'functions', level: 2 },
      ],
    },
    {
      title: 'Substitution — a scrambled alphabet',
      body: `A Caesar shift is one secret number; a substitution cipher is a whole
scrambled alphabet, and the natural home for "this maps to that" is a
dict. Two tables — forward and flipped — and encoding becomes lookup.`,
      code: `KEY = "qwertyuiopasdfghjklzxcvbnm"

def make_table(key):
    table = {}
    for i in range(26):
        table[chr(ord("a") + i)] = key[i]
    return table

def flip(table):
    flipped = {}
    for plain, secret in table.items():
        flipped[secret] = plain
    return flipped

def sub_encode(text, table):
    out = []
    for ch in text:
        if ch in table:
            out.append(table[ch])
        else:
            out.append(ch)
    return "".join(out)`,
      notes: {
        6: 'Position i of the real alphabet maps to position i of the key: a→q, b→w, c→e… The dict makes the pairing explicit and instant to look up.',
        12: 'Decoding is the same table inside-out — swap every key with its value and lookups now run in reverse. One loop, and the decoder exists.',
      },
      topicRefs: [{ topicId: 'dicts-and-sets', level: 2 }],
    },
    {
      title: 'Crack it',
      body: `The payoff twist: a Caesar cipher has only 26 possible keys, and English
has a *shape*. Try every shift, score each guess by how much it looks like
English, and the right one rises. No secrets survive counting — which is
the whole reason modern ciphers don't work anything like this.`,
      code: `def crack(ciphertext):
    best_shift = 0
    best_score = -1
    k = 0
    while k < 26:
        guess = decode(ciphertext, k)
        score = 0
        for ch in guess:
            if ch in "etaoin":
                score += 1
        if score > best_score:
            best_score = score
            best_shift = k
        k += 1
    return best_shift`,
      notes: {
        9: '`"etaoin"` — the six most common letters in English, in order. The correct decode is full of them; the 25 wrong ones read like static and score low. Frequency is the fingerprint.',
      },
      topicRefs: [
        { topicId: 'while-loops', level: 3 },
        { topicId: 'dicts-and-sets', level: 3 },
      ],
    },
    {
      title: 'The lineup',
      body: `You never wrote this — PyLoop runs it after your program to stage the
payoff. (Tidied for reading; the real harness is this with guarded names.)
It encodes your message with shift 7, pairs every plain character with its
cipher twin for the sweep animation, builds all 26 candidate decodings,
and asks your \`crack\` to pick the culprit.`,
      code: `k = 7
encoded = encode(message, k)
pairs = list(zip(message, encoded))
candidates = []
s = 0
while s < 26:
    candidates.append({"shift": s, "text": decode(encoded, s)})
    s += 1
cracked = crack(encoded)`,
      notes: {
        3: '`zip` walks two strings in lockstep, pairing character with character — plain `m` with cipher `t`, and so on. Those pairs are exactly what the character-by-character animation plays.',
      },
      aside: true,
    },
  ],

  stretches: [
    {
      title: 'Vigenère — a keyword of shifts',
      body: `One shift is crackable by counting. A **keyword** of shifts is the
16th-century upgrade: each letter of the keyword is its own Caesar shift,
cycling as you go.

\`\`\`python
def vig_encode(text, keyword):
    out = ""
    i = 0
    for ch in text:
        if "a" <= ch <= "z":
            k = ord(keyword[i % len(keyword)]) - ord("a")
            out += chr((ord(ch) - ord("a") + k) % 26 + ord("a"))
            i += 1
        else:
            out += ch
    return out

print(vig_encode("meet me at the old pier", "key"))
\`\`\`

Notice \`i\` only advances on letters — spaces don't burn keyword
positions. Your frequency crack fails against this. What would it take to
fix it? (That question kept cryptographers busy for 300 years.)`,
      code: `def vig_encode(text, keyword):
    out = ""
    i = 0
    for ch in text:
        if "a" <= ch <= "z":
            k = ord(keyword[i % len(keyword)]) - ord("a")
            out += chr((ord(ch) - ord("a") + k) % 26 + ord("a"))
            i += 1
        else:
            out += ch
    return out

print(vig_encode("meet me at the old pier", "key"))`,
    },
    {
      title: 'See the fingerprint',
      body: `Your crack works because English has a shape. Look at it directly:

\`\`\`python
text = "the quick brown fox jumps over the lazy dog again and again"
counts = {}
for ch in text:
    if ch.isalpha():
        counts[ch] = counts.get(ch, 0) + 1
for letter in sorted(counts, key=counts.get, reverse=True)[:5]:
    print(letter, "#" * counts[letter])
\`\`\`

A histogram out of \`#\` marks — the fingerprint no shift can hide,
because shifting moves the bars without changing their heights.
**dictionaries and sets · Fluent** has the counting pattern cold.`,
      code: `text = "the quick brown fox jumps over the lazy dog again and again"
counts = {}
for ch in text:
    if ch.isalpha():
        counts[ch] = counts.get(ch, 0) + 1
for letter in sorted(counts, key=counts.get, reverse=True)[:5]:
    print(letter, "#" * counts[letter])`,
    },
    {
      title: 'ROT13 — the cipher that undoes itself',
      body: `Shift by 13 and something funny happens: 13 + 13 is 26, a full lap.
Encoding twice is decoding.

\`\`\`python
def rot13(text):
    out = ""
    for ch in text:
        if "a" <= ch <= "z":
            out += chr((ord(ch) - ord("a") + 13) % 26 + ord("a"))
        else:
            out += ch
    return out

once = rot13("secret rendezvous")
print(once)
print(rot13(once))
\`\`\`

One function is its own inverse — a tiny piece of group theory hiding in
a toy cipher. It's also genuinely used: old forums ROT13'd spoilers so you
couldn't read one by accident.`,
      code: `def rot13(text):
    out = ""
    for ch in text:
        if "a" <= ch <= "z":
            out += chr((ord(ch) - ord("a") + 13) % 26 + ord("a"))
        else:
            out += ch
    return out

once = rot13("secret rendezvous")
print(once)
print(rot13(once))`,
    },
  ],
}
