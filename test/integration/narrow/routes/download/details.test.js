import { describe, beforeAll, afterAll, test, expect, vi } from 'vitest'
import http2 from 'node:http2'
import { createServer } from '../../../../../src/server.js'
import { getOptions } from '../../../../utils/helpers.js'
import { fetchPaymentDetailsForDownload } from '../../../../../src/services/fetch-payment-details-for-download.js'

const { constants: httpConstants } = http2

vi.mock('../../../../../src/services/fetch-payment-details-for-download.js', () => ({
  fetchPaymentDetailsForDownload: vi.fn().mockResolvedValue('Sample data in CSV')
}))

describe('Download details CSV link', () => {
  let server
  let response
  let options

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()

    if (response) { return }

    options = getOptions(
      'details/file?payeeName=Mathew Johnston&partPostcode=WA14',
      'GET'
    )
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
    vi.clearAllMocks()
  })

  test('GET /details/file returns status code 200', async () => {
    response = await server.inject(options)

    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  })

  test('GET /details/file returns attachment', async () => {
    response = await server.inject(options)

    expect(response.headers).toHaveProperty('content-type', 'text/csv; charset=utf-8')
    expect(response.headers).toHaveProperty('content-disposition', 'attachment; filename="ffc-payment-details.csv"')
  })

  test('GET /details/file returns expected content', async () => {
    response = await server.inject(options)

    expect(response.result).toBe('Sample data in CSV')
  })

  test('GET /details/file throws returns status code 500 on underlying error', async () => {
    fetchPaymentDetailsForDownload.mockRejectedValueOnce('Internal server error')
    response = await server.inject(options)

    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR)
  })

  test('GET /details/file triggers failAction on invalid query', async () => {
    const invalidOptions = getOptions(
      'details/file',
      'GET'
    )

    response = await server.inject(invalidOptions)

    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_BAD_REQUEST)
    expect(response.result).toContain('Error')
  })
})
