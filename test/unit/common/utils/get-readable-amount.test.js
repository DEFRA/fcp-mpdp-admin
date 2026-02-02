import { describe, test, expect } from 'vitest'
import { getReadableAmount } from '../../../../src/common/utils/get-readable-amount.js'

describe('Get readable amount', () => {
  test('getReadableAmount returns a 0 if number is undefined', () => {
    const amount = getReadableAmount(undefined)
    expect(amount).toMatch('0')
  })

  test.each([
    [1000, '1,000'],
    [10000, '10,000'],
    [100000, '100,000'],
    [1000000, '1,000,000'],
    [10000000, '10,000,000'],
    [10000000.05, '10,000,000.05'],
    [10000000.50, '10,000,000.50'],
    [10000000.67, '10,000,000.67']
  ])('getReadableAmount returns a number with correctly placed commas', (originalAmount, readableAmount) => {
    const amount = getReadableAmount(originalAmount)
    expect(amount).toMatch(readableAmount)
  })
})
