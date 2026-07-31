import { describe, expect, it } from 'vitest'
import { isValidHistory } from './GridPlayer'

const grid = (n: number) => Array.from({ length: n }, () => Array(n).fill(0))

describe('isValidHistory', () => {
  it('accepts a uniform stack of 0/1 grids', () => {
    expect(isValidHistory([grid(5), grid(5), grid(5)])).toBe(true)
  })

  it('rejects non-arrays, empty histories, and empty grids', () => {
    expect(isValidHistory(null)).toBe(false)
    expect(isValidHistory('nope')).toBe(false)
    expect(isValidHistory([])).toBe(false)
    expect(isValidHistory([[]])).toBe(false)
  })

  it('rejects ragged or mismatched frames', () => {
    const bad = [grid(5), grid(4)]
    expect(isValidHistory(bad)).toBe(false)
    const ragged = [[[0, 1], [0]]]
    expect(isValidHistory(ragged)).toBe(false)
  })

  it('rejects cells that are not 0 or 1', () => {
    expect(isValidHistory([[[0, 2], [1, 0]]])).toBe(false)
  })
})
