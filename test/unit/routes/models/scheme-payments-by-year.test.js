import { describe, test, expect, vi, beforeEach } from 'vitest'
import { schemePaymentsByYearModel } from '../../../../src/routes/models/scheme-payments-by-year.js'
import { getFinancialYearSummary } from '../../../../src/common/utils/get-financial-year-summary.js'
import { getReadableAmount } from '../../../../src/common/utils/get-readable-amount.js'

vi.mock('../../../../src/common/utils/get-financial-year-summary.js', () => ({
  getFinancialYearSummary: vi.fn()
}))

vi.mock('../../../../src/common/utils/get-readable-amount.js', () => ({
  getReadableAmount: vi.fn()
}))

describe('schemePaymentsByYearModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should return a summary object with totals and transformed data', async () => {
    const mockRawData = {
      '21/22': [
        { scheme: 'A', total_amount: '1000' },
        { scheme: 'B', total_amount: '2000' }
      ],
      '22/23': [
        { scheme: 'A', total_amount: '1500' },
        { scheme: 'C', total_amount: '2500' }
      ]
    }

    getFinancialYearSummary.mockReturnValue({ financial_years: ['21/22', '22/23'], startYear: '2021', endYear: '2023' })

    getReadableAmount.mockImplementation(amount => {
      if (typeof amount !== 'number') return '£0.00'
      return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    })

    const result = await schemePaymentsByYearModel(mockRawData)

    expect(result.summary).toHaveProperty('financial_years')
    expect(result.summary).toHaveProperty('startYear')
    expect(result.summary).toHaveProperty('endYear')
    expect(result.summary).toHaveProperty('totalPaymentsBySchemes')
    expect(result.summary).toHaveProperty('totalPaymentsByYear')
    expect(result.summary).toHaveProperty('schemePaymentsByYear')

    expect(result.summary.totalPaymentsBySchemes).toEqual([
      { name: 'A', total: 2500, readableTotal: '£2,500.00' },
      { name: 'B', total: 2000, readableTotal: '£2,000.00' },
      { name: 'C', total: 2500, readableTotal: '£2,500.00' }
    ])

    expect(result.summary.totalPaymentsByYear).toEqual({
      '2021 to 2022': { total: 3000, readableTotal: '£3,000.00' },
      '2022 to 2023': { total: 4000, readableTotal: '£4,000.00' }
    })

    expect(result.summary.schemePaymentsByYear).toEqual({
      '2021 to 2022': [
        { scheme: 'A', total_amount: '£1,000.00' },
        { scheme: 'B', total_amount: '£2,000.00' }
      ],
      '2022 to 2023': [
        { scheme: 'A', total_amount: '£1,500.00' },
        { scheme: 'C', total_amount: '£2,500.00' }
      ]
    })
  })
})
