import type { ReactNode } from 'react'
import type { PayoffKind } from '../../content/capstones/types'
import { payoffValidators, type GridHistory } from '../../content/capstones/payoff'
import { GridPlayer } from './GridPlayer'

/** One entry per payoff kind: the shared shape gate, what to say when the
 *  harness returned the wrong shape, and how to render a valid payload.
 *  Partial while the catalog grows — CapstoneShell guards the lookup. */
export type PayoffEntry = {
  validate: (v: unknown) => boolean
  badShapeMsg: string
  render: (value: unknown) => ReactNode
}

export const payoffPlayers: Partial<Record<PayoffKind, PayoffEntry>> = {
  grid: {
    validate: payoffValidators.grid,
    badShapeMsg:
      'step() ran, but the history it produced is not a stack of same-sized 0/1 grids.',
    render: (v) => <GridPlayer history={v as GridHistory} />,
  },
}
