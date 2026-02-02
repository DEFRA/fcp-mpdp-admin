import { describe, test, expect } from 'vitest'
import { getFinancialYearSummary } from '../../../../src/common/utils/get-financial-year-summary.js'

describe('getFinancialYearSummary', () => {
  test('should return sorted financial years, startYear, and endYear', () => {
    const input = ['21/22', '19/20', '20/21']
    const result = getFinancialYearSummary(input)

    expect(result.sortedFinancialYears).toEqual(['19/20', '20/21', '21/22'])
    expect(result.startYear).toBe('2019')
    expect(result.endYear).toBe('2022')
  })

  test('should return an empty object if array is empty', () => {
    const result = getFinancialYearSummary([])
    expect(result).toEqual({})
  })

  test('should handle a single financial year', () => {
    const input = ['22/23']
    const result = getFinancialYearSummary(input)

    expect(result.sortedFinancialYears).toEqual(['22/23'])
    expect(result.startYear).toBe('2022')
    expect(result.endYear).toBe('2023')
  })

  test('should correctly sort years even if input is in reverse order', () => {
    const input = ['23/24', '21/22', '22/23']
    const result = getFinancialYearSummary(input)

    expect(result.sortedFinancialYears).toEqual(['21/22', '22/23', '23/24'])
    expect(result.startYear).toBe('2021')
    expect(result.endYear).toBe('2024')
  })
})
