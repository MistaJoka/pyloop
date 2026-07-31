import type { Capstone } from './types'

// The dataset (embedded in stage 1's task and the solution), engineered: 13
// data lines, one blank, one header. Exactly 8 survive cleaning (dev, felix,
// hana and liam are malformed; the second ana is a duplicate), the mean lands
// on exactly 79.5, and Carla tops the board alone — every number in the
// checks is hand-verifiable against the literal.
export const wrangle: Capstone = {
  id: 'wrangle',
  title: 'The Data Wrangler',
  blurb: 'Turn a messy survey file into numbers you can trust — write it to disk, parse it defensively, dedupe it, and report what the data actually says.',
  whyItMatters: `Ask anyone who builds models where the time actually goes: not the model —
the data. Real files arrive exactly like this one: a header, a blank line,
someone's caps-lock name, an age spelled out in letters, the same person
twice. The unglamorous loop of *parse, reject, dedupe, summarize* is most of
what "data science" is on any given Tuesday.

It's also the front door to your AI goal. Every model is downstream of
somebody's \`parse_row\` — a training set is just a file like this one that
survived a pipeline like yours. Garbage rows in, garbage model out; the
person who can clean data is the person whose model can be trusted.`,
  payoffKind: 'table',
  payoffLabel: 'Your pipeline, line by line',
  placeholder: 'One program, built in four pieces. Start by getting the file on disk.',
  runCta: 'Run the pipeline',

  stages: [
    {
      id: 1,
      title: 'Get it on disk, get it back',
      task: `Real data comes from files, so this one starts by making the file real.
You're given the raw survey — paste this at the top of your program:

\`\`\`python
RAW = """name,age,score
ana,20,88
  BEN , 19 , 74
carla,21,91

dev,twenty,60
elena,22,85
felix,19,
gina,20,79
ana,20,88
hana,23,ninety
liam,25
ivan,18,66
jo,21,73
kai,24,80"""
\`\`\`

Write \`RAW\` to a file called \`survey.csv\`, then read the file back and
build \`lines\`: every line stripped of outer whitespace, blank lines
skipped, and the header row (\`name,age,score\`) dropped. Data files
describe themselves first — the header is for humans, not for the pipeline.`,
      check: {
        kind: 'asserts',
        code: `import os
assert os.path.exists("survey.csv"), "No survey.csv on disk — write RAW to the file first, then read it back."
want = ['ana,20,88', 'BEN , 19 , 74', 'carla,21,91', 'dev,twenty,60', 'elena,22,85', 'felix,19,', 'gina,20,79', 'ana,20,88', 'hana,23,ninety', 'liam,25', 'ivan,18,66', 'jo,21,73', 'kai,24,80']
assert isinstance(lines, list) and all(isinstance(l, str) for l in lines), "lines should be a list of strings."
assert 'name,age,score' not in lines, "The header row is still in lines — drop the file's first line."
assert '' not in lines, "There's an empty string in lines — skip blank lines entirely."
for i, (got, exp) in enumerate(zip(lines, want)):
    assert got == exp, f"lines[{i}] is {got!r} — expected {exp!r}. Strip each line's OUTER whitespace only; the inside stays as-is."
assert len(lines) == len(want), f"Expected {len(want)} data lines, got {len(lines)}."`,
      },
      hints: [
        'Two `with open(...)` blocks: one `"w"` mode to write RAW out, one plain to read it back. The file has to be written before it can be read — each run starts with an empty folder.',
        'Looping over an open file gives you its lines. `.strip()` each one, keep the ones that aren\'t `""`, and the header is the first thing left after that — slice it off with `[1:]`.',
        'The whole read fits in one line: `[line.strip() for line in f]`, then filter, then slice. If `with open` still feels foreign, **files · Working** is the rung to replay.',
      ],
      topicRefs: [
        { topicId: 'files', level: 2 },
        { topicId: 'strings', level: 2 },
        { topicId: 'lists-and-tuples', level: 2 },
      ],
    },
    {
      id: 2,
      title: 'Parse one row, defensively',
      task: `One line at a time, and never trust it. Write:

\`\`\`python
def parse_row(line):
\`\`\`

returning \`{"name": ..., "age": ..., "score": ...}\` for a good line —
name stripped and Title-cased, age and score as \`int\`s — or \`None\` for
anything malformed. Malformed means: not exactly three fields, any field
blank after stripping, or an age/score that isn't a number. A bad row is
information too — but it's \`None\`, not a crash.`,
      check: {
        kind: 'asserts',
        code: `assert parse_row("ana,20,88") == {"name": "Ana", "age": 20, "score": 88}, f'parse_row("ana,20,88") should be {{"name": "Ana", "age": 20, "score": 88}} — got {parse_row("ana,20,88")}.'
assert parse_row("  BEN , 19 , 74") == {"name": "Ben", "age": 19, "score": 74}, "Strip every field and Title-case the name — ' BEN ' is the same person as 'Ben'."
assert parse_row("dev,twenty,60") is None, "A word where a number should be isn't data — return None, don't crash."
assert parse_row("felix,19,") is None, "An empty field after stripping means missing data — None."
assert parse_row("liam,25") is None, "Two fields isn't a row — None."
assert parse_row("a,b,c,d") is None, "Four fields isn't a row either — None."`,
      },
      hints: [
        '`line.split(",")` gives the fields; `[f.strip() for f in ...]` cleans them up. Count them BEFORE unpacking — a two-field line should return None, not blow up.',
        'A blank field is `""` after stripping — check for those before converting anything. `.title()` turns `"BEN"` into `"Ben"`, and `int("twenty")` is where the crash lives.',
        'Wrap just the `int(...)` calls in `try:` / `except ValueError: return None` — catch exactly the failure you expect and nothing wider. **exceptions · Working** is this exact move.',
      ],
      topicRefs: [
        { topicId: 'strings', level: 3 },
        { topicId: 'variables-and-types', level: 2 },
        { topicId: 'exceptions', level: 2 },
        { topicId: 'dicts-and-sets', level: 2 },
      ],
    },
    {
      id: 3,
      title: 'Clean the lot',
      task: `Now run the whole file through your parser. Write:

\`\`\`python
def clean(lines):
\`\`\`

returning a list of parsed rows with two kinds of junk removed: lines that
\`parse_row\` rejected, and **duplicates** — if a name has already been
kept, later rows with that name are dropped. First appearance wins, and
the rows keep their original order. (One of these people filled in the
survey twice. The data doesn't get a vote twice.)`,
      check: {
        kind: 'asserts',
        code: `rows = clean(lines)
assert isinstance(rows, list) and all(isinstance(r, dict) for r in rows), "clean should return a list of parsed row dicts."
names = [r["name"] for r in rows]
assert "Dev" not in names and "Hana" not in names and "Liam" not in names and "Felix" not in names, f"Malformed rows are still getting through — parse_row already rejects them, clean just has to skip the Nones. Got names: {names}"
assert names.count("Ana") == 1, "Ana is in there twice — the second appearance of a name gets dropped."
assert names == ["Ana", "Ben", "Carla", "Elena", "Gina", "Ivan", "Jo", "Kai"], f"Expected the 8 clean rows in file order — got {names}."
assert rows[0] == {"name": "Ana", "age": 20, "score": 88}, f"Rows should be the parsed dicts, e.g. Ana first — got {rows[0]}."`,
      },
      hints: [
        'Loop over the lines, `parse_row` each one, and `continue` straight past the Nones — stage 2 already did the judging.',
        'Dedupe with a set of names you\'ve already kept: `if row["name"] in seen: continue`, otherwise add and append. A set answers "have I seen this?" instantly.',
        'Appending in loop order preserves the original order for free. If the seen-set idiom is new ground, **dictionaries and sets · Fluent** is exactly this.',
      ],
      topicRefs: [
        { topicId: 'for-loops', level: 3 },
        { topicId: 'dicts-and-sets', level: 3 },
        { topicId: 'conditionals', level: 2 },
      ],
    },
    {
      id: 4,
      title: 'Report',
      task: `Clean data earns a summary. Write:

\`\`\`python
def stats(rows):
\`\`\`

returning a dict with five keys: \`"count"\` (how many rows), \`"mean_score"\`
(rounded to 1 decimal place), \`"min_score"\`, \`"max_score"\`, and \`"top"\`
— the **name** of the highest scorer. One loop can gather all of it.

Then end the program by printing one report line, something like:

\`\`\`
8 rows clean — mean 79.5, top Carla (91)
\`\`\``,
      check: {
        kind: 'asserts',
        code: `s = stats(clean(lines))
assert isinstance(s, dict), f"stats should return a dict — got {type(s).__name__}."
assert s.get("count") == 8, f'count should be 8 — got {s.get("count")}.'
assert s.get("mean_score") == 79.5, f'mean_score should be 79.5 (rounded to 1 decimal) — got {s.get("mean_score")}.'
assert s.get("min_score") == 66, f'min_score should be 66 — got {s.get("min_score")}.'
assert s.get("max_score") == 91, f'max_score should be 91 — got {s.get("max_score")}.'
assert s.get("top") == "Carla", f'top should be the NAME of the highest scorer — got {s.get("top")!r}.'`,
      },
      hints: [
        'One pass collects everything: a running total, a lowest-so-far, a highest-so-far, and the whole row that currently owns the highest score.',
        '`round(total / len(rows), 1)` gives the mean the check wants — one decimal place, division first.',
        '`"top"` is a name, not a score — keep the best ROW while you loop and take its name at the end. Composing a function out of loop-and-dict parts is **functions · Fluent** ground.',
      ],
      topicRefs: [
        { topicId: 'operators', level: 3 },
        { topicId: 'functions', level: 3 },
        { topicId: 'input-output', level: 3 },
      ],
    },
  ],

  harness: `__raw_lines = RAW.splitlines()
__seen = set()
__verdicts = []
for __i, __ln in enumerate(__raw_lines):
    __s = __ln.strip()
    if __i == 0 or __s == "":
        __verdicts.append({"line": __ln, "kept": False})
        continue
    __p = parse_row(__s)
    if __p is None or __p["name"] in __seen:
        __verdicts.append({"line": __ln, "kept": False})
        continue
    __seen.add(__p["name"])
    __verdicts.append({"line": __ln, "kept": True})
__rows = clean(lines)
__collect__ = {"raw": __raw_lines, "verdicts": __verdicts, "rows": __rows, "stats": stats(__rows)}`,

  payoffAsserts: `assert len(__collect__["raw"]) == len(__collect__["verdicts"]), "one verdict per raw line"
assert sum(1 for v in __collect__["verdicts"] if v["kept"]) == 8, "exactly the 8 clean rows are kept"
assert [r["name"] for r in __collect__["rows"]] == ["Ana", "Ben", "Carla", "Elena", "Gina", "Ivan", "Jo", "Kai"], "clean rows in file order"
assert __collect__["stats"]["count"] == 8 and __collect__["stats"]["mean_score"] == 79.5, "the stats survive into the payoff"
assert __collect__["stats"]["min_score"] == 66 and __collect__["stats"]["max_score"] == 91 and __collect__["stats"]["top"] == "Carla", "min/max/top are right"`,

  solution: `RAW = """name,age,score
ana,20,88
  BEN , 19 , 74
carla,21,91

dev,twenty,60
elena,22,85
felix,19,
gina,20,79
ana,20,88
hana,23,ninety
liam,25
ivan,18,66
jo,21,73
kai,24,80"""

with open("survey.csv", "w") as f:
    f.write(RAW)

with open("survey.csv") as f:
    stripped = [line.strip() for line in f]
lines = [l for l in stripped if l != ""][1:]

def parse_row(line):
    fields = [f.strip() for f in line.split(",")]
    if len(fields) != 3:
        return None
    name, age, score = fields
    if name == "" or age == "" or score == "":
        return None
    try:
        return {"name": name.title(), "age": int(age), "score": int(score)}
    except ValueError:
        return None

def clean(lines):
    rows = []
    seen = set()
    for line in lines:
        row = parse_row(line)
        if row is None:
            continue
        if row["name"] in seen:
            continue
        seen.add(row["name"])
        rows.append(row)
    return rows

def stats(rows):
    total = 0
    best = rows[0]
    lowest = rows[0]["score"]
    highest = rows[0]["score"]
    for r in rows:
        total = total + r["score"]
        if r["score"] > best["score"]:
            best = r
        if r["score"] < lowest:
            lowest = r["score"]
        if r["score"] > highest:
            highest = r["score"]
    return {
        "count": len(rows),
        "mean_score": round(total / len(rows), 1),
        "min_score": lowest,
        "max_score": highest,
        "top": best["name"],
    }

report = stats(clean(lines))
print(f"{report['count']} rows clean — mean {report['mean_score']}, top {report['top']} ({report['max_score']})")`,

  stretches: [
    {
      title: 'Any column, not just score',
      body: `Your \`stats\` only knows about \`"score"\`. Generalize it:

\`\`\`python
def stats(rows, field):
    values = [r[field] for r in rows]
    ...
\`\`\`

Now \`stats(rows, "age")\` works too — the column name became data. Passing
a key around instead of hard-coding it is the move that turns one report
into a report *machine* — **dictionaries and sets · Advanced** territory.`,
    },
    {
      title: 'Write the clean file back out',
      body: `A pipeline that only reads is half a pipeline. Write the survivors out:

\`\`\`python
with open("clean.csv", "w") as f:
    f.write("name,age,score\\n")
    for r in rows:
        f.write(f"{r['name']},{r['age']},{r['score']}\\n")
\`\`\`

Then read \`clean.csv\` back and check it parses to the same 8 rows — a
round-trip test, the cheapest proof a writer works. **files · Advanced**
goes deeper on exactly this.`,
    },
    {
      title: 'The parser Python already ships',
      body: `Your hand-rolled parser just taught you why \`csv\` exists:

\`\`\`python
import csv
with open("survey.csv") as f:
    for row in csv.reader(f):
        print(row)
\`\`\`

\`csv.reader\` handles the case your split-on-comma can't: a quoted field
with a comma inside (\`"Lee, Jr.",20,88\`). Now that you've built the naive
version, you know exactly what the library is protecting you from — that's
the right order to learn it in.`,
    },
  ],
}
