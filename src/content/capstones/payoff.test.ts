import { describe, expect, it } from 'vitest'
import {
  isCipherPayoff,
  isGridHistory,
  isLedgerPayoff,
  isTablePayoff,
  isTextGenPayoff,
} from './payoff'

const grid = (n: number) => Array.from({ length: n }, () => Array(n).fill(0))

describe('isGridHistory', () => {
  it('accepts a uniform stack of 0/1 grids', () => {
    expect(isGridHistory([grid(5), grid(5), grid(5)])).toBe(true)
  })

  it('rejects non-arrays, empty histories, and empty grids', () => {
    expect(isGridHistory(null)).toBe(false)
    expect(isGridHistory('nope')).toBe(false)
    expect(isGridHistory([])).toBe(false)
    expect(isGridHistory([[]])).toBe(false)
  })

  it('rejects ragged or mismatched frames', () => {
    expect(isGridHistory([grid(5), grid(4)])).toBe(false)
    expect(isGridHistory([[[0, 1], [0]]])).toBe(false)
  })

  it('rejects cells that are not 0 or 1', () => {
    expect(isGridHistory([[[0, 2], [1, 0]]])).toBe(false)
  })
})

const tableOk = {
  raw: ['name,age,score', 'ana,20,88'],
  verdicts: [
    { line: 'name,age,score', kept: false },
    { line: 'ana,20,88', kept: true },
  ],
  rows: [{ name: 'Ana', age: 20, score: 88 }],
  stats: { count: 1, mean_score: 88, min_score: 88, max_score: 88, top: 'Ana' },
}

describe('isTablePayoff', () => {
  it('accepts the full shape', () => {
    expect(isTablePayoff(tableOk)).toBe(true)
  })

  it('rejects a verdict list that does not match the raw lines one-to-one', () => {
    expect(isTablePayoff({ ...tableOk, verdicts: tableOk.verdicts.slice(0, 1) })).toBe(false)
  })

  it('rejects rows with non-numeric fields and missing stats', () => {
    expect(
      isTablePayoff({ ...tableOk, rows: [{ name: 'Ana', age: 'twenty', score: 88 }] }),
    ).toBe(false)
    expect(isTablePayoff({ ...tableOk, stats: { count: 1 } })).toBe(false)
    expect(isTablePayoff(null)).toBe(false)
  })
})

const cipherOk = {
  message: 'hi',
  shift: 7,
  encoded: 'op',
  chars: [
    { plain: 'h', cipher: 'o' },
    { plain: 'i', cipher: 'p' },
  ],
  candidates: Array.from({ length: 26 }, (_, s) => ({ shift: s, text: 'xx' })),
  cracked: 7,
}

describe('isCipherPayoff', () => {
  it('accepts the full shape', () => {
    expect(isCipherPayoff(cipherOk)).toBe(true)
  })

  it('rejects length mismatches between message, encoded, and chars', () => {
    expect(isCipherPayoff({ ...cipherOk, encoded: 'opq' })).toBe(false)
    expect(isCipherPayoff({ ...cipherOk, chars: cipherOk.chars.slice(0, 1) })).toBe(false)
  })

  it('rejects a candidate list that is not exactly 26, and an out-of-range crack', () => {
    expect(isCipherPayoff({ ...cipherOk, candidates: cipherOk.candidates.slice(0, 25) })).toBe(false)
    expect(isCipherPayoff({ ...cipherOk, cracked: 26 })).toBe(false)
    expect(isCipherPayoff(null)).toBe(false)
  })
})

const textgenOk = {
  start: 'the',
  tokens: ['the', 'cat', 'saw'],
  steps: [
    { word: 'the', options: [['cat', 2], ['sea', 1]] as [string, number][], chosen: 'cat' },
    { word: 'cat', options: [['saw', 1]] as [string, number][], chosen: 'saw' },
  ],
}

describe('isTextGenPayoff', () => {
  it('accepts the full shape', () => {
    expect(isTextGenPayoff(textgenOk)).toBe(true)
  })

  it('requires tokens to be steps plus the start word', () => {
    expect(isTextGenPayoff({ ...textgenOk, tokens: ['the', 'cat'] })).toBe(false)
  })

  it('rejects empty option tables and malformed pairs', () => {
    expect(
      isTextGenPayoff({
        ...textgenOk,
        steps: [{ word: 'the', options: [], chosen: 'cat' }, textgenOk.steps[1]],
      }),
    ).toBe(false)
    expect(
      isTextGenPayoff({
        ...textgenOk,
        steps: [{ word: 'the', options: [['cat']], chosen: 'cat' }, textgenOk.steps[1]],
      }),
    ).toBe(false)
    expect(isTextGenPayoff(null)).toBe(false)
  })
})

const ledgerOk = {
  owner: 'A.',
  opening: 100,
  steps: [
    { op: 'deposit', amount: 250, ok: true, balance: 350, error: null },
    { op: 'withdraw', amount: 5000, ok: false, balance: 350, error: 'InsufficientFunds' },
  ],
  final: 350,
  replayed: 350,
}

describe('isLedgerPayoff', () => {
  it('accepts the full shape', () => {
    expect(isLedgerPayoff(ledgerOk)).toBe(true)
  })

  it('rejects empty step lists and malformed steps', () => {
    expect(isLedgerPayoff({ ...ledgerOk, steps: [] })).toBe(false)
    expect(
      isLedgerPayoff({
        ...ledgerOk,
        steps: [{ op: 'deposit', amount: 250, ok: 'yes', balance: 350, error: null }],
      }),
    ).toBe(false)
    expect(isLedgerPayoff({ ...ledgerOk, replayed: 'matches' })).toBe(false)
    expect(isLedgerPayoff(null)).toBe(false)
  })
})
