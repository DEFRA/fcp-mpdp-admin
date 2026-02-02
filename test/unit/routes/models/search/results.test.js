import { describe, test, expect, vi, beforeEach } from 'vitest'
import { resultsModel } from '../../../../../src/routes/models/search/results.js'
import { config } from '../../../../../src/config/config.js'
import { fetchPaymentData } from '../../../../../src/services/fetch-payment-data.js'
import { getAllSchemeNames } from '../../../../../src/common/utils/get-all-scheme-names.js'
import { getRelatedContentLinks } from '../../../../../src/common/utils/related-content.js'
import { sortByItems } from '../../../../../src/data/sort-by-items.js'

vi.mock('../../../../../src/config/config.js', () => ({
  config: { get: vi.fn() }
}))

vi.mock('../../../../../src/services/fetch-payment-data.js', () => ({
  fetchPaymentData: vi.fn()
}))

vi.mock('../../../../../src/common/utils/get-all-scheme-names.js', () => ({
  getAllSchemeNames: vi.fn()
}))

vi.mock('../../../../../src/common/utils/related-content.js', () => ({
  getRelatedContentLinks: vi.fn()
}))

describe('resultsModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    config.get.mockReturnValue(10)
    getAllSchemeNames.mockReturnValue(['Mock scheme A', 'Mock scheme B'])
  })

  test('should return error model when error is true', async () => {
    getRelatedContentLinks.mockReturnValue(['Mock related content link'])

    const request = {
      query: {
        searchString: 'test',
        sortBy: 'score',
        schemes: [],
        years: [],
        counties: []
      },
      headers: { referer: '/previous-page' }
    }

    const result = await resultsModel(request, true)

    expect(result.errorList).toEqual([
      { text: 'Enter a name or location', href: '#search-input' }
    ])

    expect(result.headingTitle).toBe('Results for ‘test’')
    expect(result.relatedContentLinks).toEqual(['Mock related content link'])
    expect(result.total).toBe(0)
    expect(result.filters.schemes.name).toBe('Scheme')
    expect(result.sortBy.items).toBe(sortByItems)
  })

  test('should return results with pagination, filters, and download link when search succeeds', async () => {
    fetchPaymentData.mockResolvedValue({
      results: [
        { id: 1, total_amount: 100, payee_name: 'John Doe' },
        { id: 2, total_amount: 200, payee_name: 'Jane Doe' }
      ],
      total: 2,
      filterOptions: {
        schemes: ['Mock scheme A'],
        years: ['21/22'],
        counties: ['Bedfordshire']
      }
    })

    const request = {
      query: {
        searchString: 'farms',
        sortBy: 'score',
        page: 1,
        schemes: 'Mock scheme A',
        years: '21/22',
        counties: 'Bedfordshire'
      },
      headers: { referer: '/previous-page' }
    }

    const result = await resultsModel(request, false)

    expect(result.results).toEqual([
      { id: 1, payee_name: 'John Doe' },
      { id: 2, payee_name: 'Jane Doe' }
    ])

    expect(result.previous).toBeNull()
    expect(result.next).toBeNull()

    expect(result.filters.schemes.items[0]).toMatchObject({
      text: 'Mock scheme A',
      value: 'Mock scheme A',
      checked: true
    })
    expect(result.filters.years.items[0].text).toBe('2021 to 2022')
    expect(result.filters.counties.items[0].value).toBe('Bedfordshire')

    expect(result.tags.Scheme[0]).toEqual({ text: 'Mock scheme A', value: 'Mock scheme A' })

    expect(result.downloadResultsLink).toContain('/results/file?searchString=farms')
    expect(result.downloadResultsLink).toContain('&schemes=Mock%20scheme%20A')
    expect(result.downloadResultsLink).toContain('&years=21%2F22')
    expect(result.downloadResultsLink).toContain('&counties=Bedfordshire')

    expect(result.headingTitle).toBe('Results for ‘farms’')
  })

  test('should generate correct pagination when multiple pages exist', async () => {
    fetchPaymentData.mockResolvedValue({
      results: Array(15).fill({ id: 1, total_amount: 50 }),
      total: 25,
      filterOptions: { schemes: [], years: [], counties: [] }
    })

    const request = {
      query: {
        searchString: 'farms',
        sortBy: 'score',
        page: 2,
        schemes: [],
        years: [],
        counties: []
      },
      headers: { referer: '/previous-page' }
    }

    const result = await resultsModel(request, false)

    expect(result.previous).not.toBeNull()
    expect(result.next).not.toBeNull()
    expect(result.previous.href).toContain('page=1')
    expect(result.next.href).toContain('page=3')
  })
})
