import type { ReactNode } from 'react'
import type { PayoffKind } from '../../content/capstones/types'
import {
  payoffValidators,
  type CipherPayoff,
  type GridHistory,
  type TablePayoff,
  type TextGenPayoff,
} from '../../content/capstones/payoff'
import { CipherPlayer } from './CipherPlayer'
import { GridPlayer } from './GridPlayer'
import { TablePlayer } from './TablePlayer'
import { TextGenPlayer } from './TextGenPlayer'

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
  table: {
    validate: payoffValidators.table,
    badShapeMsg:
      'The pipeline ran, but what it produced is not the raw-lines / verdicts / rows / stats shape the player expects.',
    render: (v) => <TablePlayer payoff={v as TablePayoff} />,
  },
  cipher: {
    validate: payoffValidators.cipher,
    badShapeMsg:
      'The cipher ran, but what it produced is not the message / chars / 26-candidates / cracked shape the player expects.',
    render: (v) => <CipherPlayer payoff={v as CipherPayoff} />,
  },
  textgen: {
    validate: payoffValidators.textgen,
    badShapeMsg:
      'The model ran, but what it produced is not the tokens-plus-steps walk the player expects.',
    render: (v) => <TextGenPlayer payoff={v as TextGenPayoff} />,
  },
}
