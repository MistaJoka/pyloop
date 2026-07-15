import { RunawayError, type Check, type CheckResult } from './types'
import type { Runtime } from './runtime'

/** Trailing whitespace and stray blank lines are never the lesson. */
function normalize(s: string) {
  return s
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '')
}

const RUNAWAY =
  "That ran forever — it never stopped on its own. Check your loop's exit condition."

export async function checkSubmission(
  runtime: Runtime,
  code: string,
  check: Check,
  stdin = '',
): Promise<CheckResult> {
  try {
    if (check.kind === 'asserts') {
      return await runtime.checkAsserts(code, check.code, stdin)
    }
    const res = await runtime.run(code, stdin)
    if (res.error) return { passed: false, stdout: res.stdout, error: res.error }
    const passed = normalize(res.stdout) === normalize(check.expected)
    return {
      passed,
      stdout: res.stdout,
      error: passed ? null : { type: 'Mismatch', msg: 'Output does not match yet.', line: null },
    }
  } catch (e) {
    // Only a genuine runaway says "ran forever". Everything else says what it
    // was — the old code conflated the two and blamed the learner for an
    // unrelated worker restart.
    if (e instanceof RunawayError) {
      return { passed: false, stdout: '', error: { type: 'Runaway', msg: RUNAWAY, line: null } }
    }
    const msg = e instanceof Error ? e.message : String(e)
    return { passed: false, stdout: '', error: { type: 'Error', msg, line: null } }
  }
}
