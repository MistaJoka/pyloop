import { loadPyodide } from 'pyodide'
import { readFileSync } from 'node:fs'

const PROJ = new URL('..', import.meta.url).pathname
const { topics, capstones, payoffValidators, walkthroughProgram } = await import(process.env.CONTENT ?? '/tmp/pyloop-content.mjs')

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

console.log(`\n### Capstones — ${capstones.length}`)
const seenIds = new Set()
for (const c of capstones) {
  console.log(`\n## ${c.title} (${c.id})`)
  const stdin = c.stdin ?? ''

  // 0. Identity: unique id, all the copy present, exactly 4 stages and 3
  //    stretches, and a payoff kind the shared validator map actually knows.
  if (seenIds.has(c.id)) bad(`${c.id}: duplicate capstone id`)
  seenIds.add(c.id)
  if (!c.title?.trim() || !c.blurb?.trim() || !c.whyItMatters?.trim() || !c.payoffLabel?.trim())
    bad(`${c.id}: missing copy — title, blurb, whyItMatters and payoffLabel are all required`)
  if (c.stages.length !== 4 || !c.stages.every((s, i) => s.id === i + 1))
    bad(`${c.id}: stages must be exactly 1..4 in order`)
  if (c.stretches.length !== 3) bad(`${c.id}: expected exactly 3 stretches, got ${c.stretches.length}`)
  const validate = payoffValidators[c.payoffKind]
  if (!validate) bad(`${c.id}: no payoff validator for kind "${c.payoffKind}"`)

  for (const st of c.stages) {
    console.log(`\n Stage ${st.id}: ${st.title}`)

    // 1. No blank editor may pass: the check against an EMPTY program must fail.
    const blank = JSON.parse(runAsserts('', st.check.code, stdin))
    if (blank.passed) bad(`stage ${st.id}: an empty program passes the check!`)
    else ok(`stage ${st.id}: empty program rejected`)

    // 2. The hidden solution must pass every stage's check (cumulative by
    //    construction — the whole program runs each time).
    const good = JSON.parse(runAsserts(c.solution, st.check.code, stdin))
    if (!good.passed) bad(`stage ${st.id}: the reference solution fails — ${JSON.stringify(good.error)}`)
    else ok(`stage ${st.id}: reference solution accepted`)

    // 3. Hints: the ladder can't be empty — its last rung is the exit sign.
    if (!st.hints.length) bad(`stage ${st.id}: no hints — the ladder is empty`)
    else ok(`stage ${st.id}: ${st.hints.length} hints`)

    // 4. topicRefs are the machine truth of "this stage stands on that rung":
    //    every ref must resolve to a real topic AND a level it actually has.
    if (!st.topicRefs?.length) bad(`stage ${st.id}: no topicRefs — the stage floats on nothing`)
    else {
      for (const ref of st.topicRefs) {
        const t = topics.find((x) => x.id === ref.topicId)
        if (!t) bad(`stage ${st.id}: topicRef points at unknown topic "${ref.topicId}"`)
        else if (!t.levels.some((l) => l.level === ref.level))
          bad(`stage ${st.id}: topicRef ${ref.topicId} · ${ref.level} — that topic has no such level`)
      }
      ok(`stage ${st.id}: ${st.topicRefs.length} topicRef(s) resolve`)
    }
  }

  // 5. The payoff, two layers. Shape: run_collect must succeed and satisfy
  //    the SAME validator the UI gates the player with — if this passes, the
  //    player renders. Semantics: the capstone's own payoffAsserts run over
  //    __collect__ in the harness's namespace.
  const col = JSON.parse(runCollect(c.solution, c.harness, stdin))
  if (col.error) bad(`${c.id}: collect errored — ${JSON.stringify(col.error)}`)
  else if (validate && !validate(col.value)) bad(`${c.id}: payoff shape rejected by the ${c.payoffKind} validator`)
  else ok(`${c.id}: payoff shape valid — the ${c.payoffKind} player will render this`)

  if (!c.payoffAsserts?.trim()) bad(`${c.id}: no payoffAsserts — the payoff's meaning is unverified`)
  else {
    const pa = JSON.parse(runAsserts(c.solution, c.harness + '\n' + c.payoffAsserts, stdin))
    if (!pa.passed) bad(`${c.id}: payoffAsserts fail — ${JSON.stringify(pa.error)}`)
    else ok(`${c.id}: payoffAsserts hold`)
  }

  // 6. Stretch code, if any, must run.
  for (const [n, s] of c.stretches.entries()) {
    if (!s.code) continue
    const st = JSON.parse(runPlain(s.code, stdin))
    if (st.error) bad(`${c.id} stretch ${n + 1}: code errored — ${st.error.type}: ${st.error.msg}`)
    else ok(`${c.id} stretch ${n + 1}: code runs`)
  }

  // 7. The walkthrough IS a working build — the reading view's honesty gate.
  //    What the learner reads, joined, must pass every checkpoint and play
  //    the payoff, because the Run button runs exactly that joined code.
  if (!Array.isArray(c.walkthrough) || c.walkthrough.length < 2)
    bad(`${c.id}: walkthrough needs at least a program section and the harness aside`)
  else {
    for (const [n, s] of c.walkthrough.entries()) {
      if (!s.title?.trim() || !s.body?.trim() || !s.code?.trim())
        bad(`${c.id} walkthrough §${n + 1}: title, body and code are all required`)
      const secLines = (s.code ?? '').split('\n')
      for (const k of Object.keys(s.notes ?? {})) {
        const ln = Number(k)
        if (!Number.isInteger(ln) || ln < 1 || ln > secLines.length)
          bad(`${c.id} walkthrough §${n + 1}: note on line ${k} — no such line (section has ${secLines.length})`)
        else if (!secLines[ln - 1].trim())
          bad(`${c.id} walkthrough §${n + 1}: note on line ${k} points at a blank line`)
      }
      for (const ref of s.topicRefs ?? []) {
        const t = topics.find((x) => x.id === ref.topicId)
        if (!t) bad(`${c.id} walkthrough §${n + 1}: topicRef points at unknown topic "${ref.topicId}"`)
        else if (!t.levels.some((l) => l.level === ref.level))
          bad(`${c.id} walkthrough §${n + 1}: topicRef ${ref.topicId} · ${ref.level} — no such level`)
      }
    }
    if (!c.walkthrough.some((s) => !s.aside)) bad(`${c.id}: every walkthrough section is an aside — no program left`)

    const joined = walkthroughProgram(c)
    let wOk = true
    for (const st of c.stages) {
      const r = JSON.parse(runAsserts(joined, st.check.code, stdin))
      if (!r.passed) {
        bad(`${c.id} walkthrough: joined sections fail stage ${st.id}'s check — ${JSON.stringify(r.error)}`)
        wOk = false
      }
    }
    const wcol = JSON.parse(runCollect(joined, c.harness, stdin))
    if (wcol.error) {
      bad(`${c.id} walkthrough: joined sections fail to collect — ${JSON.stringify(wcol.error)}`)
      wOk = false
    } else if (validate && !validate(wcol.value)) {
      bad(`${c.id} walkthrough: joined sections' payoff rejected by the ${c.payoffKind} validator`)
      wOk = false
    }
    const wpa = JSON.parse(runAsserts(joined, c.harness + '\n' + c.payoffAsserts, stdin))
    if (!wpa.passed) {
      bad(`${c.id} walkthrough: joined sections fail payoffAsserts — ${JSON.stringify(wpa.error)}`)
      wOk = false
    }
    if (wOk) ok(`${c.id}: walkthrough (${c.walkthrough.length} sections) is a working build — all checks + payoff`)
  }
}

// 7. The catalog-level claim: together, the capstones exercise EVERY topic on
//    the map. This is the "entire course worth of knowledge" gate — a topic
//    no capstone stands on is a gap in the story, and the build fails on it.
console.log('\n### Catalog coverage')
const covered = new Set()
for (const c of capstones) for (const st of c.stages) for (const r of st.topicRefs ?? []) covered.add(r.topicId)
const missing = topics.filter((t) => !covered.has(t.id)).map((t) => t.id)
if (missing.length) bad(`catalog: topics no capstone exercises: ${missing.join(', ')}`)
else ok(`catalog: all ${topics.length} topics exercised across ${capstones.length} capstones`)

console.log(`\n${failures === 0 ? 'ALL CONTENT CHECKS PASSED' : failures + ' FAILURE(S)'}`)
process.exit(failures ? 1 : 0)
