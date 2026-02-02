import { describe, test, expect, vi, beforeEach } from 'vitest'
import { fetchSchemePaymentsByYear } from '../../../src/services/fetch-scheme-payments-by-year.js'
import { getUrlParams } from '../../../src/api/get-url-params.js'
import { get } from '../../../src/api/get.js'

vi.mock('../../../src/api/get-url-params.js', () => ({
  getUrlParams: vi.fn()
}))

vi.mock('../../../src/api/get.js', () => ({
  get: vi.fn()
}))

describe('fetchSchemePaymentsByYear', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should call getUrlParams with "summary" and return parsed payload', async () => {
    getUrlParams.mockReturnValue('/test/url')
    get.mockResolvedValue({ payload: '{ "year": 2023, "amount": 1000 }' })

    const result = await fetchSchemePaymentsByYear()

    expect(getUrlParams).toHaveBeenCalledWith('summary')
    expect(get).toHaveBeenCalledWith('/test/url')
    expect(result).toEqual({ year: 2023, amount: 1000 })
  })

  test('should return null if get returns a falsy value', async () => {
    getUrlParams.mockReturnValue('/test/url')
    get.mockResolvedValue(null)

    await expect(fetchSchemePaymentsByYear()).rejects.toThrow()
  })

  test('should throw if payload is not valid JSON', async () => {
    getUrlParams.mockReturnValue('/test/url')
    get.mockResolvedValue({ payload: 'invalid-json' })

    await expect(fetchSchemePaymentsByYear()).rejects.toThrow(SyntaxError)
  })
})
