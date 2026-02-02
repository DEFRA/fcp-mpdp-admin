import { describe, afterEach, test, expect, vi } from 'vitest'
import { fetchPaymentDetailsForDownload } from '../../../src/services/fetch-payment-details-for-download.js'
import { getUrlParams } from '../../../src/api/get-url-params.js'
import { getBufferFromUrl } from '../../../src/api/get-buffer-from-url.js'

vi.mock('../../../src/api/get-buffer-from-url.js')

describe('fetchPaymentDetailsForDownload', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  const payeeName = '__PAYEE_NAME__'
  const partPostcode = '__PART_POSTCODE__'
  const route = getUrlParams(`${payeeName}/${partPostcode}/file`)

  test('returns buffer when getBufferFromUrl resolves successfully', async () => {
    const content = '__MOCK_CSV_CONTENT__'
    const bufferedData = Buffer.from(content)

    getBufferFromUrl.mockResolvedValueOnce(bufferedData)

    const response = await fetchPaymentDetailsForDownload(payeeName, partPostcode)

    expect(getBufferFromUrl).toHaveBeenCalledWith(route)
    expect(response).toBeInstanceOf(Buffer)
    expect(response).toEqual(bufferedData)
  })

  test('throws error when getBufferFromUrl rejects', async () => {
    const mockError = new Error('Mock error')
    getBufferFromUrl.mockRejectedValueOnce(mockError)

    await expect(fetchPaymentDetailsForDownload(payeeName, partPostcode)).rejects.toThrowError(Error)
    expect(getBufferFromUrl).toHaveBeenCalled()
  })
})
