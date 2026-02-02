import { describe, beforeAll, afterAll, test, expect, vi } from 'vitest'
import http2 from 'node:http2'
import { createServer } from '../../../../../src/server.js'
import { getOptions } from '../../../../utils/helpers.js'
import { get } from '../../../../../src/api/get.js'

const { constants: httpConstants } = http2

vi.mock('../../../../../src/api/get.js', () => ({
  get: vi.fn()
}))

describe('Download scheme payments by year CSV link', () => {
  let server
  let response
  let options

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()

    if (response) { return }

    options = getOptions('scheme-payments-by-year/file', 'GET')
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
    vi.clearAllMocks()
  })

  const content = {
    response: {},
    payload: 'Sample data in CSV'
  }

  test('GET /scheme-payments-by-year/file returns status code 200', async () => {
    get.mockResolvedValue(content)
    response = await server.inject(options)

    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  })

  test('GET /scheme-payments-by-year/file returns attachment', async () => {
    get.mockResolvedValue(content)
    response = await server.inject(options)

    expect(response.headers).toHaveProperty('content-type', 'text/csv; charset=utf-8')
    expect(response.headers).toHaveProperty('content-disposition', 'attachment; filename="ffc-payments-by-year.csv"')
  })

  test('GET /scheme-payments-by-year/file returns expected content', async () => {
    get.mockResolvedValue(content)
    response = await server.inject(options)

    expect(response.result).toBe(content.payload)
  })

  test('GET /scheme-payments-by-year/file returns status code 500 on underlying error', async () => {
    get.mockRejectedValue('Internal server error')
    response = await server.inject(options)

    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR)
  })
})
