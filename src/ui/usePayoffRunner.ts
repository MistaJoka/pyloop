import { useState } from 'react'
import type { Capstone } from '../content/capstones/types'
import type { Runtime } from '../engine/runtime'
import type { PyError } from '../engine/types'
import { RunawayError } from '../engine/types'
import { payoffPlayers } from './payoff'

/** The collect → shape-gate → play sequence, shared by the build view (runs
 *  the learner's code) and the reading view (runs the finished program).
 *  `payoffValue` only ever holds a value the kind's validator accepted. */
export function usePayoffRunner(capstone: Capstone, runtime: Runtime) {
  const [busy, setBusy] = useState(false)
  const [payoffValue, setPayoffValue] = useState<unknown>(null)
  const [playError, setPlayError] = useState<PyError | null>(null)

  const payoff = payoffPlayers[capstone.payoffKind]

  async function run(source: string) {
    setBusy(true)
    setPlayError(null)
    setPayoffValue(null)
    try {
      const col = await runtime.collect(source, capstone.harness, capstone.stdin ?? '')
      if (col.error) {
        setPlayError(col.error)
        return
      }
      if (!payoff || !payoff.validate(col.value)) {
        setPlayError({
          type: 'Shape',
          msg:
            payoff?.badShapeMsg ??
            'The program ran, but what it produced is not a shape this capstone can play.',
          line: null,
        })
        return
      }
      setPayoffValue(col.value)
    } catch (e) {
      setPlayError(
        e instanceof RunawayError
          ? { type: 'Runaway', msg: "That ran forever — it never stopped on its own. Check your loop's exit condition.", line: null }
          : { type: 'Error', msg: e instanceof Error ? e.message : String(e), line: null },
      )
    } finally {
      setBusy(false)
    }
  }

  return { busy, payoffValue, playError, payoff, run }
}
