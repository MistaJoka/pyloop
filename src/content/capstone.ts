import type { Check } from '../engine/types'

export type CapstoneStage = {
  id: 1 | 2 | 3 | 4
  title: string
  /** What to write, as markdown. Includes any literal data the stage needs. */
  task: string
  /** Runs against the learner's WHOLE program — checks are cumulative by
   *  construction. */
  check: Check
  /** Fix-style ladder. The LAST hint names the topic · rung to review —
   *  there is no solution reveal in the capstone. */
  hints: string[]
}

export type Capstone = {
  title: string
  blurb: string
  stages: CapstoneStage[]
  /** Runs after stage 4 passes, in the same namespace as the learner's
   *  program; must assign the 41-frame history to __collect__. */
  harness: string
  generations: number
  /** Reference program satisfying all four checks. verify-content only —
   *  never surfaced in the UI. */
  solution: string
  stretches: { title: string; body: string; code?: string }[]
}

export const capstone: Capstone = {
  title: 'The Capstone',
  blurb: 'Build a world that runs itself — Conway\'s Game of Life, from an empty grid to a glider walking across your screen.',
  generations: 40,

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
    },
  ],

  harness: `__g = [row[:] for row in grid]
__hist = [[row[:] for row in __g]]
for _ in range(40):
    __g = step(__g)
    __hist.append([row[:] for row in __g])
__collect__ = __hist`,

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
