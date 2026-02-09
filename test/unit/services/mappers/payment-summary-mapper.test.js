import { describe, test, expect } from 'vitest'
import { toViewModel, toApiModel, summariesToViewModel } from '../../../../src/services/mappers/payment-summary-mapper.js'

describe('payment-summary-mapper', () => {
  describe('toViewModel', () => {
    test('should map summary to view model', () => {
      const summary = {
        id: 1,
        financial_year: '23/24',
        scheme: 'SFI',
        total_amount: 50000.75
      }

      const result = toViewModel(summary)

      expect(result).toEqual({
        id: 1,
        financialYear: '23/24',
        scheme: 'SFI',
        totalAmount: 50000.75
      })
    })

    test('should handle summary with all fields', () => {
      const summary = {
        id: 123,
        financial_year: '22/23',
        scheme: 'BPS',
        total_amount: 100000.50
      }

      const result = toViewModel(summary)

      expect(result.id).toBe(123)
      expect(result.financialYear).toBe('22/23')
      expect(result.scheme).toBe('BPS')
      expect(result.totalAmount).toBe(100000.50)
    })
  })

  describe('toApiModel', () => {
    test('should map view model to API model', () => {
      const viewModel = {
        financialYear: '23/24',
        scheme: 'SFI',
        totalAmount: 50000.75
      }

      const result = toApiModel(viewModel)

      expect(result).toEqual({
        financial_year: '23/24',
        scheme: 'SFI',
        total_amount: 50000.75
      })
    })

    test('should handle view model with all fields', () => {
      const viewModel = {
        financialYear: '22/23',
        scheme: 'BPS',
        totalAmount: 100000.50
      }

      const result = toApiModel(viewModel)

      expect(result.financial_year).toBe('22/23')
      expect(result.scheme).toBe('BPS')
      expect(result.total_amount).toBe(100000.50)
    })
  })

  describe('summariesToViewModel', () => {
    test('should map array of summaries to view models', () => {
      const summaries = [
        {
          id: 1,
          financial_year: '23/24',
          scheme: 'SFI',
          total_amount: 50000.75
        },
        {
          id: 2,
          financial_year: '22/23',
          scheme: 'BPS',
          total_amount: 75000.50
        },
        {
          id: 3,
          financial_year: '23/24',
          scheme: 'CS',
          total_amount: 30000.25
        }
      ]

      const result = summariesToViewModel(summaries)

      expect(result).toHaveLength(3)
      expect(result[0].financialYear).toBe('23/24')
      expect(result[0].scheme).toBe('SFI')
      expect(result[1].financialYear).toBe('22/23')
      expect(result[1].scheme).toBe('BPS')
      expect(result[2].financialYear).toBe('23/24')
      expect(result[2].scheme).toBe('CS')
    })

    test('should handle empty array', () => {
      const result = summariesToViewModel([])

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    test('should handle single summary', () => {
      const summaries = [
        {
          id: 1,
          financial_year: '23/24',
          scheme: 'SFI',
          total_amount: 50000.75
        }
      ]

      const result = summariesToViewModel(summaries)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
      expect(result[0].financialYear).toBe('23/24')
    })
  })
})
