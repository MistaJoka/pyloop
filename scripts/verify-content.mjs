import { loadPyodide } from 'pyodide'
import { readFileSync } from 'node:fs'

const PROJ = new URL('..', import.meta.url).pathname
const { topics, capstone } = await import(process.env.CONTENT ?? '/tmp/pyloop-content.mjs')

const py = await loadPyodide()
py.runPython(readFileSync(`${PROJ}/src/engine/tracer.py`, 'utf8'))
const trace = py.globals.get('trace')
const runPlain = py.globals.get('run_plain')
const runAsserts = py.globals.get('run_with_asserts')
const runCollect = py.globals.get('run_collect')

let failures = 0
const bad = (msg) => { console.log(`   FAIL  ${msg}`); failures++ }
const ok = (msg) => console.log(`   ok    ${msg}`)

for (const topic of topics) {
  console.log(`\n### ${topic.title} — ${topic.levels.length} levels`)
  for (const lv of topic.levels) {
    console.log(`\n L${lv.level}`)

    // 1. WATCH traces cleanly and actually shows movement.
    //    Unless it declared expectError — then dying is the lesson, and the
    //    check inverts: it must die, of exactly the type it named.
    const t = JSON.parse(trace(lv.watch.code, lv.watch.stdin ?? ''))
    const wantWatchErr = lv.watch.expectError
    if (wantWatchErr) {
      if (!t.error) bad(`watch: expectError ${wantWatchErr}, but it ran clean — the crash IS the lesson here`)
      else if (t.error.type !== wantWatchErr) bad(`watch: expectError ${wantWatchErr}, but it raised ${t.error.type}: ${t.error.msg}`)
      else if (t.error.line == null) bad(`watch: raised ${t.error.type} but with no line — the panel has nothing to point at`)
      else ok(`watch: crashes as declared — ${t.error.type} on line ${t.error.line}`)
    } else if (t.error) bad(`watch errored: ${t.error.type}: ${t.error.msg} (line ${t.error.line})`)
    if (t.steps.length < 3) bad(`watch produced only ${t.steps.length} steps`)
    else {
      const sigs = t.steps.map(s => JSON.stringify(s.locals))
      if (new Set(sigs).size < 2) bad('watch: locals never change across steps (deepcopy bug!)')
      else ok(`watch: ${t.steps.length} steps, values move`)
    }

    // 1b. Line notes must point at lines that exist AND actually run — a note
    //     on a line the trace never reaches can never be read.
    const notes = lv.watch.notes ?? {}
    const srcLines = lv.watch.code.split('\n').length
    const reached = new Set(t.steps.filter(s => s.event === 'line').map(s => s.line))
    for (const k of Object.keys(notes)) {
      const n = Number(k)
      if (!Number.isInteger(n) || n < 1 || n > srcLines) bad(`note on line ${n}: no such line (code has ${srcLines})`)
      else if (!reached.has(n)) bad(`note on line ${n}: that line never runs, so the note is unreachable`)
    }
    if (Object.keys(notes).length) ok(`notes: ${Object.keys(notes).length} on live lines`)

    // 2. PREDICT: does Python actually print the answer I marked correct?
    //    A declared expectError changes only whether the error is a failure —
    //    the stdout comparison below is unchanged and still runs, because for a
    //    crashing snippet "what does it print" is a real question with a real
    //    answer: whatever escaped before it stopped.
    const pr = JSON.parse(runPlain(lv.predict.code, lv.predict.stdin ?? ''))
    const wantPredErr = lv.predict.expectError
    if (wantPredErr && !pr.error) bad(`predict: expectError ${wantPredErr}, but it ran clean`)
    else if (wantPredErr && pr.error.type !== wantPredErr) bad(`predict: expectError ${wantPredErr}, but it raised ${pr.error.type}: ${pr.error.msg}`)
    else if (!wantPredErr && pr.error) bad(`predict errored: ${pr.error.type}: ${pr.error.msg}`)
    else {
      if (wantPredErr) ok(`predict: stops with ${pr.error.type} as declared`)
      const actual = pr.stdout.trim()
      const claimed = lv.predict.choices[lv.predict.answerIndex]
      if (actual !== claimed) bad(`predict: marked "${claimed}" correct but Python prints "${actual}"`)
      else ok(`predict: prints ${actual}, matches answerIndex`)
      if (!lv.predict.choices.includes(actual)) bad(`predict: real answer "${actual}" isn't even a choice`)
    }

    // 3. FIX: broken code must FAIL
    if (!lv.fix.solution) bad('fix: no solution — the hint ladder dead-ends here')
    const broken = JSON.parse(runAsserts(lv.fix.brokenCode, lv.fix.check.code, lv.fix.stdin ?? ''))
    if (broken.passed) bad('fix: the BROKEN code passes the check!')
    else ok(`fix: broken rejected — "${(broken.error?.msg || '').slice(0, 55)}…"`)

    // 4. FIX: the SHIPPED solution must PASS its own check. This is what the
    //    learner is handed when they run out of hints — if it doesn't pass,
    //    the escape hatch is a trap.
    const good = JSON.parse(runAsserts(lv.fix.solution, lv.fix.check.code, lv.fix.stdin ?? ''))
    if (!good.passed) bad(`fix: the SHIPPED solution fails its own check — "${JSON.stringify(good.error)}"`)
    else ok('fix: shipped solution accepted')

    // 4b. BUILD (levels 4 and 5 only): the schema requires it, and its check
    //     must be reachable. Proven using THIS level's own fix.solution as
    //     the witness — build.check is meant to be the same correctness bar
    //     as fix.check, so whatever solves Fix must also solve Build.
    if (lv.level >= 4) {
      if (!lv.build) bad('build: missing — required at levels 4 and 5')
      else if (!lv.build.task?.trim()) bad('build: task is empty')
      else {
        const w = JSON.parse(runAsserts(lv.fix.solution, lv.build.check.code, lv.build.stdin ?? ''))
        if (!w.passed) bad(`build: check not satisfiable — this level's fix.solution fails it: "${JSON.stringify(w.error)}"`)
        else ok('build: check reachable (verified via fix.solution)')
      }
    }

    // 5. Stretch code, if any, must run
    if (lv.stretch?.code) {
      const st = JSON.parse(runPlain(lv.stretch.code, lv.watch.stdin ?? ''))
      if (st.error) bad(`stretch code errored: ${st.error.type}: ${st.error.msg}`)
      else ok(`stretch: runs, prints ${JSON.stringify(st.stdout.trim())}`)
    }
  }
}

console.log(`\n### ${capstone.title} — ${capstone.stages.length} stages`)
const topicIds = new Set(topics.map((t) => t.id))
for (const st of capstone.stages) {
  console.log(`\n Stage ${st.id}: ${st.title}`)

  // 1. No blank editor may pass: the check against an EMPTY program must fail.
  const blank = JSON.parse(runAsserts('', st.check.code, ''))
  if (blank.passed) bad(`stage ${st.id}: an empty program passes the check!`)
  else ok(`stage ${st.id}: empty program rejected`)

  // 2. The hidden solution must pass every stage's check (cumulative by
  //    construction — the whole program runs each time).
  const good = JSON.parse(runAsserts(capstone.solution, st.check.code, ''))
  if (!good.passed) bad(`stage ${st.id}: the reference solution fails — ${JSON.stringify(good.error)}`)
  else ok(`stage ${st.id}: reference solution accepted`)

  // 3. Hints: at least one, and the last names a real topic (by id) so
  //    "out of hints" always points somewhere that exists.
  if (!st.hints.length) bad(`stage ${st.id}: no hints — the ladder is empty`)
  else {
    const last = st.hints[st.hints.length - 1]
    const named = [...topicIds].some((id) => {
      const t = topics.find((x) => x.id === id)
      return last.toLowerCase().includes(t.title.toLowerCase())
    })
    if (!named) bad(`stage ${st.id}: last hint doesn't name a real topic to review`)
    else ok(`stage ${st.id}: ${st.hints.length} hints, last one points at a real topic`)
  }
}

// 4. The payoff: solution + harness must produce a valid, moving history.
const col = JSON.parse(runCollect(capstone.solution, capstone.harness, ''))
if (col.error) bad(`capstone collect errored: ${JSON.stringify(col.error)}`)
else {
  const h = col.value
  const want = capstone.generations + 1
  if (!Array.isArray(h) || h.length !== want) bad(`history should be ${want} frames (seed + ${capstone.generations}), got ${Array.isArray(h) ? h.length : typeof h}`)
  else if (!h.every((g) => Array.isArray(g) && g.length === h[0].length && g.every((row) => Array.isArray(row) && row.length === h[0][0].length))) bad('history frames are not uniformly-shaped 2D grids')
  else if (!h.every((g) => g.every((row) => row.every((c) => c === 0 || c === 1)))) bad('history contains cells that are not 0/1')
  else if (JSON.stringify(h[0]) === JSON.stringify(h[1])) bad('the simulation is frozen — generation 1 is identical to the seed')
  else ok(`capstone: ${want}-frame history, uniform grids, and the glider moves`)
}

console.log(`\n${failures === 0 ? 'ALL CONTENT CHECKS PASSED' : failures + ' FAILURE(S)'}`)
process.exit(failures ? 1 : 0)
