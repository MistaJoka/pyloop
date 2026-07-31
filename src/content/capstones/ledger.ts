import type { Capstone } from './types'

// The harness script is fixed: 100 → +250 → −40 → refuse 5000 (Insufficient
// Funds) → refuse −10 (ValueError) → +75 → −120 lands on 265, then the
// account is saved and rebuilt by replaying the file through the real
// methods — final must equal replayed. Every balance in the checks is
// hand-traceable.
export const ledger: Capstone = {
  id: 'ledger',
  title: 'The Ledger',
  blurb: 'A bank account that refuses bad money, remembers everything, and can rebuild itself from its own paper trail.',
  whyItMatters: `Strip any fintech backend to the studs and you find this exact shape:
**state** (a balance), **rules about legal transitions** (no negative
deposits, no spending money you don't have), and an **audit trail** (every
change, written down, forever). The class you're about to write is that
architecture in miniature — and checkpoint 4's rebuild-by-replay is the
pattern the industry calls event sourcing, by name, in production, today.

It matters for the AI road too. An agent that acts in the world — moves
money, sends messages, edits files — needs exactly this: guarded state
changes it can refuse, and a trail it can prove afterwards. A model
predicts; a system like this one is what makes acting on the prediction
safe.`,
  payoffKind: 'ledger',
  payoffLabel: 'The statement, replayed from disk',
  placeholder: 'One program, built in four pieces. Start with the account itself.',
  runCta: 'Run the ledger',

  stages: [
    {
      id: 1,
      title: 'The account object',
      task: `Money needs a home with rules attached — that's a class. Write:

\`\`\`python
class Account:
\`\`\`

with \`__init__(self, owner, balance=0)\` storing both on \`self\`, and
two methods: \`deposit(self, amount)\` adds to the balance,
\`withdraw(self, amount)\` subtracts. No guards yet — this checkpoint is
about state and the methods that move it. The refusals come next.`,
      check: {
        kind: 'asserts',
        code: `a = Account("Ana", 100)
assert a.owner == "Ana", f'a.owner should be "Ana" — got {getattr(a, "owner", "<missing>")!r}.'
assert a.balance == 100, f"a.balance should be 100 — got {getattr(a, 'balance', '<missing>')}."
b = Account("Ben")
assert b.balance == 0, "balance should default to 0 — Account('Ben') opens an empty account."
a.deposit(50)
assert a.balance == 150, f"deposit(50) should raise the balance to 150 — got {a.balance}."
a.withdraw(30)
assert a.balance == 120, f"withdraw(30) should lower the balance to 120 — got {a.balance}."
assert b.balance == 0, "Depositing into a must not touch b — each account owns its own balance."`,
      },
      hints: [
        '`class Account:` then `def __init__(self, owner, balance=0):` — the `=0` default is what lets `Account("Ben")` open empty.',
        'Store what you\'re given: `self.owner = owner` and `self.balance = balance`. Everything else reads and writes `self.balance`.',
        '`deposit` and `withdraw` are one-liners that move `self.balance`. If `self` still reads as noise, **classes · Working** is the rung that makes it click.',
      ],
      topicRefs: [
        { topicId: 'classes', level: 2 },
        { topicId: 'functions', level: 2 },
      ],
    },
    {
      id: 2,
      title: 'Refuse bad money',
      task: `A bank that accepts a negative deposit is a bug with a vault. Add the
rules:

\`\`\`python
class InsufficientFunds(Exception):
    pass
\`\`\`

- \`deposit\` and \`withdraw\` **raise \`ValueError\`** for a zero or
  negative amount
- \`withdraw\` **raises \`InsufficientFunds\`** when the amount exceeds
  the balance (taking the exact balance is fine — broke is legal,
  overdrawn is not)
- a refused operation leaves the balance **exactly** where it was

Validate first, then act. The raise happens before the balance moves.`,
      check: {
        kind: 'asserts',
        code: `assert issubclass(InsufficientFunds, Exception), "InsufficientFunds should be its own exception class."
a = Account("Ana", 100)
try:
    a.withdraw(500)
    assert False, "withdraw(500) on a balance of 100 should raise InsufficientFunds."
except InsufficientFunds:
    pass
assert a.balance == 100, f"A refused withdrawal must leave the balance untouched — got {a.balance}."
try:
    a.deposit(-5)
    assert False, "A negative deposit should raise ValueError."
except ValueError:
    pass
try:
    a.deposit(0)
    assert False, "A zero deposit should raise ValueError — nothing happened is not a transaction."
except ValueError:
    pass
try:
    a.withdraw(-1)
    assert False, "A negative withdrawal should raise ValueError."
except ValueError:
    pass
assert a.balance == 100, f"Refusals must not move money — the balance should still be 100, got {a.balance}."
a.withdraw(100)
assert a.balance == 0, "Withdrawing the exact balance is allowed — broke is legal, overdrawn is not."`,
      },
      hints: [
        'Name the failure first: `class InsufficientFunds(Exception): pass` — two lines, a precise name for one kind of wrong.',
        'Guard order matters: check `amount <= 0` (→ `ValueError`) before checking the funds (→ `InsufficientFunds`). Validate, THEN act.',
        '`raise` stops the method cold — a refused withdrawal never reaches the line that subtracts, and that\'s what keeps the balance honest. **exceptions · Fluent** covers raising your own.',
      ],
      topicRefs: [
        { topicId: 'exceptions', level: 3 },
        { topicId: 'classes', level: 3 },
        { topicId: 'conditionals', level: 2 },
      ],
    },
    {
      id: 3,
      title: 'The audit trail',
      task: `Banks don't trust balances; they trust *records*. Give the account a
memory:

- \`__init__\` seeds \`self.history\` with one entry:
  \`("open", balance, balance)\`
- every **successful** \`deposit\` and \`withdraw\` appends
  \`(op, amount, balance_after)\` — e.g. \`("deposit", 50, 150)\`
- refused operations append **nothing** — the book records what
  happened, not what was attempted

Tuples, deliberately: an audit entry is a record nobody edits later.`,
      check: {
        kind: 'asserts',
        code: `a = Account("Ana", 100)
assert a.history == [("open", 100, 100)], f"Opening an account seeds the history — expected [('open', 100, 100)], got {a.history}."
a.deposit(50)
a.withdraw(30)
try:
    a.withdraw(999)
except InsufficientFunds:
    pass
try:
    a.deposit(-1)
except ValueError:
    pass
a.deposit(25)
assert a.history == [("open", 100, 100), ("deposit", 50, 150), ("withdraw", 30, 120), ("deposit", 25, 145)], f"History records only what actually happened, as (op, amount, balance_after) — got {a.history}."
assert isinstance(a.history[0], tuple), "Entries are tuples — immutable records; an audit trail you can't quietly edit."`,
      },
      hints: [
        'Seed it at birth: in `__init__`, `self.history = [("open", balance, balance)]`.',
        'Append AFTER the balance moves, using the new balance: `self.history.append(("deposit", amount, self.balance))`.',
        'The refusals need no new code — `raise` already exits before the append line. If tuple-vs-list still feels arbitrary, **lists and tuples · Fluent** has the why.',
      ],
      topicRefs: [
        { topicId: 'lists-and-tuples', level: 3 },
        { topicId: 'classes', level: 3 },
      ],
    },
    {
      id: 4,
      title: 'Persist and replay',
      task: `Last piece: the account must survive the power going out. Write:

\`\`\`python
def save_history(account, filename):
def load_account(filename):
\`\`\`

\`save_history\` writes the owner on line one, then one
\`op,amount,balance\` line per history entry. \`load_account\` rebuilds
the account **by replaying**: read the \`open\` line to construct the
account, then call the real \`deposit\` / \`withdraw\` for every later
row. Don't copy the history in — let the methods re-earn it. If the
replayed account matches the original, your rules and your records agree,
and that's the whole point of a ledger.`,
      check: {
        kind: 'asserts',
        code: `a = Account("Rex", 100)
a.deposit(250)
a.withdraw(40)
save_history(a, "ledger.txt")
with open("ledger.txt") as f:
    first = f.readline().strip()
assert first == "Rex", f'Line one of the file is the owner — got {first!r}.'
b = load_account("ledger.txt")
assert isinstance(b, Account), "load_account should return an Account."
assert b.owner == "Rex", f"The owner survives the disk — got {b.owner!r}."
assert b.balance == 310, f"The replayed balance should be 310 — got {b.balance}."
assert b.history == a.history, f"Replaying through the real methods must rebuild the exact history — got {b.history}."`,
      },
      hints: [
        'Writing is a loop of f-strings: the owner first, then `f"{op},{amount},{balance}\\n"` per entry.',
        'Loading is REPLAYING: the `open` row tells you `Account(owner, opening_balance)`; every later row is a real `deposit(...)` or `withdraw(...)` call. The methods rebuild the history for free — that\'s the trick.',
        '`line.split(",")` hands back strings — `int(...)` the numbers before using them. **files · Fluent** if the read-loop feels thin.',
      ],
      topicRefs: [
        { topicId: 'files', level: 3 },
        { topicId: 'strings', level: 3 },
        { topicId: 'for-loops', level: 2 },
      ],
    },
  ],

  harness: `__acct = Account("A. Worthington", 100)
__script = [("deposit", 250), ("withdraw", 40), ("withdraw", 5000), ("deposit", -10), ("deposit", 75), ("withdraw", 120)]
__steps = []
for __op, __amt in __script:
    try:
        if __op == "deposit":
            __acct.deposit(__amt)
        else:
            __acct.withdraw(__amt)
        __steps.append({"op": __op, "amount": __amt, "ok": True, "balance": __acct.balance, "error": None})
    except Exception as __e:
        __steps.append({"op": __op, "amount": __amt, "ok": False, "balance": __acct.balance, "error": type(__e).__name__})
save_history(__acct, "ledger.txt")
__re = load_account("ledger.txt")
__collect__ = {"owner": __acct.owner, "opening": 100, "steps": __steps, "final": __acct.balance, "replayed": __re.balance}`,

  payoffAsserts: `assert __collect__["final"] == 265, "the fixed script lands on 265"
assert __collect__["final"] == __collect__["replayed"], "the money survives the disk — replay matches"
__b = __collect__["opening"]
for __s in __collect__["steps"]:
    if __s["ok"]:
        __b = __b + __s["amount"] if __s["op"] == "deposit" else __b - __s["amount"]
    assert __s["balance"] == __b, "every step's balance moves by exactly the amount, and refusals don't move it at all"
assert [s["error"] for s in __collect__["steps"] if not s["ok"]] == ["InsufficientFunds", "ValueError"], "the two refusals name their exceptions"`,

  solution: `class InsufficientFunds(Exception):
    pass

class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance
        self.history = [("open", balance, balance)]

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("deposit must be a positive amount")
        self.balance += amount
        self.history.append(("deposit", amount, self.balance))

    def withdraw(self, amount):
        if amount <= 0:
            raise ValueError("withdrawal must be a positive amount")
        if amount > self.balance:
            raise InsufficientFunds(f"{amount} exceeds balance {self.balance}")
        self.balance -= amount
        self.history.append(("withdraw", amount, self.balance))

def save_history(account, filename):
    with open(filename, "w") as f:
        f.write(account.owner + "\\n")
        for op, amount, balance in account.history:
            f.write(f"{op},{amount},{balance}\\n")

def load_account(filename):
    with open(filename) as f:
        lines = [line.strip() for line in f if line.strip() != ""]
    owner = lines[0]
    op, amount, balance = lines[1].split(",")
    account = Account(owner, int(amount))
    for line in lines[2:]:
        op, amount, balance = line.split(",")
        if op == "deposit":
            account.deposit(int(amount))
        else:
            account.withdraw(int(amount))
    return account`,

  stretches: [
    {
      title: 'Transfer — two accounts, one hard question',
      body: `Moving money between accounts is a withdraw and a deposit:

\`\`\`python
def transfer(a, b, amount):
    a.withdraw(amount)
    try:
        b.deposit(amount)
    except Exception:
        a.deposit(amount)   # put it back
        raise
\`\`\`

The interesting part is the failure: if the withdraw succeeds and the
deposit then blows up, money has *vanished* unless you put it back. That
put-it-back-and-re-raise is a hand-rolled transaction — databases exist
in large part because this problem gets hard fast.`,
      code: `class InsufficientFunds(Exception):
    pass

class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("bad amount")
        self.balance += amount

    def withdraw(self, amount):
        if amount <= 0:
            raise ValueError("bad amount")
        if amount > self.balance:
            raise InsufficientFunds("not enough")
        self.balance -= amount

def transfer(a, b, amount):
    a.withdraw(amount)
    try:
        b.deposit(amount)
    except Exception:
        a.deposit(amount)
        raise

ana = Account("Ana", 100)
ben = Account("Ben", 20)
transfer(ana, ben, 60)
print(ana.balance, ben.balance)`,
    },
    {
      title: 'Make it printable',
      body: `Right now \`print(account)\` shows a memory address — useless. One
method fixes it:

\`\`\`python
def __repr__(self):
    return f"Account({self.owner!r}, balance={self.balance})"
\`\`\`

\`__repr__\` is what Python calls when it needs to *show* your object —
in prints, in lists, in error messages. The convention: return something
a developer could paste back into code. Debugging an object you can't
see is archaeology; this is the flashlight.`,
      code: `class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def __repr__(self):
        return f"Account({self.owner!r}, balance={self.balance})"

print(Account("Ana", 100))
print([Account("Ben"), Account("Cy", 55)])`,
    },
    {
      title: 'A savings account, by inheritance',
      body: `A savings account is an account *plus* interest. Say exactly that:

\`\`\`python
class SavingsAccount(Account):
    def add_interest(self, rate):
        self.balance = round(self.balance * (1 + rate), 2)
\`\`\`

\`SavingsAccount(Account)\` means "everything Account has, and then
some" — \`__init__\`, \`deposit\`, \`withdraw\` all come along for free.
Inheritance is how a class family shares its rules without copying them.
**classes · Advanced** takes this the rest of the way.`,
      code: `class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

class SavingsAccount(Account):
    def add_interest(self, rate):
        self.balance = round(self.balance * (1 + rate), 2)

s = SavingsAccount("Ana", 200)
s.add_interest(0.05)
print(s.owner, s.balance)`,
    },
  ],
}
