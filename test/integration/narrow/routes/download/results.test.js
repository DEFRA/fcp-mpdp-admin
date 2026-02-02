import { describe, beforeAll, afterAll, test, expect, vi } from 'vitest'
import http2 from 'node:http2'
import { createServer } from '../../../../../src/server.js'
import { getOptions } from '../../../../utils/helpers.js'
import { post } from '../../../../../src/api/post.js'

const { constants: httpConstants } = http2

vi.mock('../../../../../src/api/post.js', () => ({
  post: vi.fn().mockResolvedValue({ payload: 'Sample data in CSV' })
}))

describe('Download search results data CSV link', () => {
  let server
  let response
  let options

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()

    if (response) { return }

    options = getOptions(
      'results/file',
      'GET',
      {
        searchString: 'test',
        sortBy: 'score'
      }
    )
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
    vi.clearAllMocks()
  })

  test('GET /results/file returns status code 200', async () => {
    response = await server.inject(options)

    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  })

  test('GET /results/file returns attachment', async () => {
    response = await server.inject(options)

    expect(response.headers).toHaveProperty('content-type', 'text/csv; charset=utf-8')
    expect(response.headers).toHaveProperty('content-disposition', 'attachment; filename="ffc-payment-results.csv"')
  })

  test('GET /results/file returns expected content', async () => {
    response = await server.inject(options)

    expect(response.result).toBe('Sample data in CSV')
  })

  test('GET /results/file returns status code 500 on underlying error', async () => {
    post.mockRejectedValueOnce(new Error('Internal Server Error'))
    response = await server.inject(options)

    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR)
  })

  test('GET /results/file triggers failAction on invalid query', async () => {
    const invalidOptions = getOptions(
      'results/file',
      'GET'
    )

    response = await server.inject(invalidOptions)

    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_BAD_REQUEST)
    expect(response.result).toContain('Error')
  })
})
