import type { Capstone } from './types'

export const life: Capstone = {
  id: 'life',
  title: 'The Game of Life',
  blurb: 'Build a world that runs itself — Conway\'s Game of Life, from an empty grid to a glider walking across your screen.',
  whyItMatters: `Every cell follows one tiny rule, and no cell can see the whole board — yet
gliders walk, blinkers tick, and whole structures live and die. That's
**emergence**: global behavior nobody wrote, falling out of local rules
everybody follows.

It's also the founding intuition of the field you're headed toward. A neural
network is a huge pile of tiny units each doing something trivial; what the
network *does* lives nowhere in particular, the way the glider lives in no
single cell. Build the rule once, step it forty times, and you've touched the
idea that makes complex systems — and AI — worth studying.`,
  payoffKind: 'grid',
  payoffLabel: 'Your world, 40 generations',
  placeholder: 'One program, built in four pieces. Start with the grid.',
  runCta: 'Run the world',

  stages: [
    {
      id: 1,
      title: 'Represent the grid',
      task: `A world is a grid: 10 rows, 10 columns, each cell either alive (\`1\`)
or dead (\`0\`).

Build \`grid\` as a list of 10 lists of 10 numbers, all dead — then bring
these five cells to life (that shape is a **glider**):

\`\`\`
(row 0, col 1) · (row 1, col 2) · (row 2, col 0) · (row 2, col 1) · (row 2, col 2)
\`\`\`

So \`grid[0][1]\` is \`1\`, \`grid[4][4]\` is \`0\`, and exactly five cells
in the whole grid are alive.`,
      check: {
        kind: 'asserts',
        code: `assert isinstance(grid, list) and len(grid) == 10, f"grid should be a list of 10 rows — got {type(grid).__name__}."
assert all(isinstance(row, list) and len(row) == 10 for row in grid), "Each row should be a list of 10 cells."
assert all(c in (0, 1) for row in grid for c in row), "Every cell must be 0 (dead) or 1 (alive) — nothing else."
live = {(r, c) for r in range(10) for c in range(10) if grid[r][c] == 1}
assert live == {(0, 1), (1, 2), (2, 0), (2, 1), (2, 2)}, f"The glider isn't where the task placed it. Your live cells: {sorted(live)}"`,
      },
      hints: [
        'A grid is a list of rows, and each row is a list of 10 numbers. `[0] * 10` makes one all-dead row.',
        'Careful building 10 rows: `[[0]*10]*10` makes ten names for ONE row — change one cell and the whole column lights up. Build each row fresh: `[[0]*10 for _ in range(10)]`.',
        'Then flip the five cells one assignment at a time: `grid[0][1] = 1`, and so on. If nested lists still fight you, replay **lists and tuples · Advanced** — this stage stands on exactly that ground.',
      ],
      topicRefs: [{ topicId: 'lists-and-tuples', level: 4 }],
    },
    {
      id: 2,
      title: 'Count neighbors',
      task: `Every cell has up to eight neighbors — the cells touching it, including
diagonals. Write:

\`\`\`python
def count_neighbors(grid, row, col):
\`\`\`

returning how many of the eight cells around \`(row, col)\` are alive. Cells
off the edge of the grid count as dead — the corners have only three real
neighbors, and asking about them must not crash.`,
      check: {
        kind: 'asserts',
        code: `g = [[0] * 5 for _ in range(5)]
for r, c in [(1, 1), (1, 2), (2, 1)]:
    g[r][c] = 1
assert count_neighbors(g, 2, 2) == 3, f"count_neighbors(g, 2, 2) should be 3 — got {count_neighbors(g, 2, 2)}."
assert count_neighbors(g, 1, 1) == 2, "A cell doesn't count itself: (1,1) has exactly 2 live neighbors."
assert count_neighbors(g, 0, 0) == 1, f"Corner (0,0): off-grid neighbors count as dead. Expected 1 — got {count_neighbors(g, 0, 0)}."
assert count_neighbors(g, 4, 4) == 0, "The far corner has no live neighbors."
assert count_neighbors([[1]], 0, 0) == 0, "On a 1x1 grid the only cell has zero neighbors — if this crashes, an edge case isn't handled."`,
      },
      hints: [
        'Eight neighbors means every (dr, dc) with dr and dc each in (-1, 0, 1) — except (0, 0), which is the cell itself. Two nested loops.',
        'Guard the edges: only read `grid[r][c]` when `0 <= r < len(grid)` and `0 <= c < len(grid[0])`. An off-grid position simply adds nothing.',
        'Skip the center with `if dr == 0 and dc == 0: continue`, otherwise add `grid[row+dr][col+dc]` (alive cells are 1, so summing counts them). If the nested loops themselves are the wall, **for loops · Advanced** is this exact shape.',
      ],
      topicRefs: [{ topicId: 'for-loops', level: 4 }],
    },
    {
      id: 3,
      title: 'Apply the rule',
      task: `Life has one rule, asked of every cell at once. Write:

\`\`\`python
def next_state(alive, count):
\`\`\`

where \`alive\` is the cell now (\`1\` or \`0\`) and \`count\` is its live
neighbors. Return the cell's next state:

- a **live** cell survives with 2 or 3 neighbors — fewer starves it, more
  crowds it out
- a **dead** cell comes alive on exactly 3 neighbors
- everything else is \`0\``,
      check: {
        kind: 'asserts',
        code: `assert next_state(1, 2) == 1 and next_state(1, 3) == 1, "A live cell with 2 or 3 neighbors survives."
assert next_state(1, 1) == 0, "A live cell with only 1 neighbor dies — underpopulation."
assert next_state(1, 4) == 0, "A live cell with 4 neighbors dies — overcrowding."
assert next_state(0, 3) == 1, "A dead cell with exactly 3 neighbors is born."
assert next_state(0, 2) == 0, "A dead cell with 2 neighbors stays dead."
assert next_state(0, 0) == 0 and next_state(1, 0) == 0, "Isolation: nothing lives with zero neighbors."`,
      },
      hints: [
        'Two cases — the cell is alive, or it is dead. Handle them as two separate branches.',
        'Alive: return 1 only when count is 2 or 3. Dead: return 1 only when count is exactly 3. Everything else returns 0.',
        'No loops here at all — pure if/elif/else on two inputs. If the branching feels slippery, **conditionals · Fluent** is the rung to replay.',
      ],
      topicRefs: [{ topicId: 'conditionals', level: 3 }],
    },
    {
      id: 4,
      title: 'Step the world',
      task: `Now one tick of the universe. Write:

\`\`\`python
def step(grid):
\`\`\`

returning a **new** grid where every cell got its \`next_state\`, judged by
neighbor counts from the **current** grid. Never write into the grid you're
reading — a half-updated world judges its own future with contaminated
evidence, and that's the classic Life bug.`,
      check: {
        kind: 'asserts',
        code: `before = [row[:] for row in grid]
g2 = step(grid)
assert g2 is not grid, "step must build and return a NEW grid, not hand back the one it was given."
assert grid == before, "step changed the original grid — build the next generation without touching the current one."
live2 = {(r, c) for r in range(10) for c in range(10) if g2[r][c] == 1}
assert live2 == {(1, 0), (1, 2), (2, 1), (2, 2), (3, 1)}, f"One step of the glider should light exactly (1,0), (1,2), (2,1), (2,2), (3,1) — got {sorted(live2)}."`,
      },
      hints: [
        'Build a brand-new grid and fill it in; only ever READ the old one. Deciding cell (2,3) from a grid where (2,2) already changed is how gliders dissolve into static.',
        'For every position: the new value is `next_state(grid[r][c], count_neighbors(grid, r, c))`. Your stages 2 and 3 do all the real work — this stage just asks them a hundred times.',
        'Nested loops appending row by row works; so does one list comprehension over rows and columns. If building-a-new-list-from-an-old-one is the sticking point, **for loops · Master** covers exactly that collapse.',
      ],
      topicRefs: [{ topicId: 'for-loops', level: 5 }],
    },
  ],

  harness: `__g = [row[:] for row in grid]
__hist = [[row[:] for row in __g]]
for _ in range(40):
    __g = step(__g)
    __hist.append([row[:] for row in __g])
__collect__ = __hist`,

  payoffAsserts: `assert isinstance(__collect__, list) and len(__collect__) == 41, f"expected 41 frames (seed + 40 generations), got {len(__collect__) if isinstance(__collect__, list) else type(__collect__).__name__}"
assert all(isinstance(g, list) and len(g) == 10 and all(isinstance(row, list) and len(row) == 10 for row in g) for g in __collect__), "frames must be uniform 10x10 grids"
assert all(c in (0, 1) for g in __collect__ for row in g for c in row), "cells must be 0 or 1"
assert __collect__[1] != __collect__[0], "the simulation is frozen — generation 1 is identical to the seed"`,

  solution: `grid = [[0] * 10 for _ in range(10)]
for r, c in [(0, 1), (1, 2), (2, 0), (2, 1), (2, 2)]:
    grid[r][c] = 1

def count_neighbors(grid, row, col):
    count = 0
    for dr in (-1, 0, 1):
        for dc in (-1, 0, 1):
            if dr == 0 and dc == 0:
                continue
            r, c = row + dr, col + dc
            if 0 <= r < len(grid) and 0 <= c < len(grid[0]):
                count += grid[r][c]
    return count

def next_state(alive, count):
    if alive == 1:
        return 1 if count in (2, 3) else 0
    return 1 if count == 3 else 0

def step(grid):
    return [[next_state(grid[r][c], count_neighbors(grid, r, c)) for c in range(len(grid[0]))] for r in range(len(grid))]`,

  walkthrough: [
    {
      title: 'Represent the grid',
      body: `A world has to be data before it can be anything else. Here it's a list
of 10 rows, each row a list of 10 numbers — so \`grid[r][c]\` reads exactly
like "row r, column c". Five cells get flipped alive by hand: that L-shaped
cluster is a **glider**, the smallest pattern that travels.`,
      code: `grid = [[0] * 10 for _ in range(10)]
for r, c in [(0, 1), (1, 2), (2, 0), (2, 1), (2, 2)]:
    grid[r][c] = 1`,
      notes: {
        1: 'The comprehension builds each row **fresh**. The tempting shortcut `[[0]*10]*10` makes ten names for ONE row — flip one cell and a whole column lights up. This line is the difference between a grid and a hall of mirrors.',
        2: 'Tuple unpacking in the loop header: each `(r, c)` pair splits into two names as it arrives. Five coordinates, five assignments, no counter in sight.',
      },
      topicRefs: [{ topicId: 'lists-and-tuples', level: 4 }],
    },
    {
      title: 'Count neighbors',
      body: `Every rule in Life is asked in terms of a cell's eight neighbors, so
counting them is the load-bearing function. The shape: two nested loops
sweep the 3×3 block around the cell, skip the center, and only read cells
that actually exist — off the edge counts as dead, never as a crash.`,
      code: `def count_neighbors(grid, row, col):
    count = 0
    for dr in (-1, 0, 1):
        for dc in (-1, 0, 1):
            if dr == 0 and dc == 0:
                continue
            r, c = row + dr, col + dc
            if 0 <= r < len(grid) and 0 <= c < len(grid[0]):
                count += grid[r][c]
    return count`,
      notes: {
        5: 'The center of the 3×3 block is the cell itself — a cell is not its own neighbor. `continue` skips it and the loop moves on.',
        8: 'The edge guard. Both chained comparisons must hold before the grid is read, so a corner cell quietly gets 5 of its 8 "neighbors" contributing nothing — instead of an IndexError.',
        9: 'Alive is `1`, dead is `0` — so *adding* cells IS counting the live ones. No if needed.',
      },
      topicRefs: [{ topicId: 'for-loops', level: 4 }],
    },
    {
      title: 'Apply the rule',
      body: `The whole physics of this universe, in four lines. No loops, no grid —
just two inputs (am I alive? how many neighbors?) and one output. Keeping
the rule separate from the sweep is what made both easy to test: the rule
never has to know a grid exists.`,
      code: `def next_state(alive, count):
    if alive == 1:
        return 1 if count in (2, 3) else 0
    return 1 if count == 3 else 0`,
      topicRefs: [{ topicId: 'conditionals', level: 3 }],
    },
    {
      title: 'Step the world',
      body: `One tick: every cell gets judged by the *current* grid, and the verdicts
build a *new* grid. That separation is the classic Life bug in reverse —
write into the grid you're reading and cells start judging a half-updated
world, and gliders dissolve into static.`,
      code: `def step(grid):
    return [[next_state(grid[r][c], count_neighbors(grid, r, c)) for c in range(len(grid[0]))] for r in range(len(grid))]`,
      notes: {
        2: 'A comprehension inside a comprehension: the outer one walks rows, the inner one walks columns, and every cell value comes from functions that only ever READ the old grid. New world out, old world untouched.',
      },
      topicRefs: [{ topicId: 'for-loops', level: 5 }],
    },
    {
      title: 'Forty ticks, kept as frames',
      body: `You never wrote this part — PyLoop runs it after your program, and it's
how the player gets something to play. (Tidied for reading; the real
harness does exactly this with guarded names.) It steps the world 40 times
and photographs it after each tick — 41 frames including the seed.`,
      code: `world = [row[:] for row in grid]
history = [[row[:] for row in world]]
for _ in range(40):
    world = step(world)
    history.append([row[:] for row in world])`,
      notes: {
        2: '`row[:]` copies a row; doing it for every row copies the whole grid. Without the copies, every frame in the history would be a name for the SAME final grid — a 41-frame film of one photograph.',
      },
      aside: true,
    },
  ],

  stretches: [
    {
      title: 'Wrap it in a class',
      body: `Your three functions and a grid are begging to travel together:

\`\`\`python
class Life:
    def __init__(self, grid):
        self.grid = grid

    def step(self):
        self.grid = step(self.grid)
\`\`\`

Now \`world = Life(grid)\` then \`world.step()\` — the state and the rules
live in one place, which is the whole argument for classes. **classes ·
Working** if you want the full treatment.`,
    },
    {
      title: 'Load a pattern from a file',
      body: `Patterns are just text — \`.\` for dead, \`#\` for alive:

\`\`\`python
with open("pattern.txt") as f:
    grid = [[1 if ch == "#" else 0 for ch in line.strip()] for line in f]
\`\`\`

Write a pattern file, load it, run it. \`with open\` closes the file for you
even if a line surprises you — **files · Working** has the why.`,
    },
    {
      title: 'Reject a bad pattern loudly',
      body: `What if a row is short, or a character isn't \`.\` or \`#\`? Silence is
the enemy:

\`\`\`python
class BadPattern(Exception):
    pass

def parse(text):
    rows = [line for line in text.splitlines() if line]
    if len({len(r) for r in rows}) > 1:
        raise BadPattern("rows have different lengths")
    return [[1 if ch == "#" else 0 for ch in row] for row in rows]
\`\`\`

A custom exception names the failure so the caller can catch exactly it —
**exceptions · Fluent** is the deeper cut.`,
    },
  ],
}
