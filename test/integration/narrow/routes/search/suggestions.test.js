import { vi, describe, afterAll, beforeAll, test, expect } from 'vitest'
import http2 from 'node:http2'
import { createServer } from '../../../../../src/server.js'
import { getOptions } from '../../../../utils/helpers.js'
import mockSuggestions from '../../../../data/mock-suggestions.js'

const { constants: httpConstants } = http2

vi.mock('../../../../../src/services/fetch-search-suggestions.js', () => ({
  fetchSearchSuggestions: () => mockSuggestions
}))

describe('Suggestions route', () => {
  let server
  let response

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()

    if (response) { return }

    const options = getOptions('/suggestions', 'GET')

    response = await server.inject(options)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
    vi.resetAllMocks()
  })

  test('GET /suggestions returns status 200', async () => {
    response = await server.inject(getOptions('suggestions', 'GET', { searchString: 'Test String' }))
    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  })

  test('GET /suggestions returns 400 error when searchString is not in the query params', async () => {
    response = await server.inject(getOptions('suggestions'))
    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_BAD_REQUEST)
  })

  test('GET /suggestions returns 200 ok when searchString contains % special characters', async () => {
    response = await server.inject(getOptions('suggestions', 'GET', { searchString: ('%Test String') }))
    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  })

  test('GET /suggestions returns 200 ok when searchString contains special character like \', -, !, @, £, $, ^, &, *, (, )', async () => {
    response = await server.inject(getOptions('suggestions', 'GET', { searchString: ("special character like ' , -, !, @, £, $, ^, &, *, (, )") }))
    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  })

  test('GET /suggestions returns status 200 when searchString contains a single quote or hyphen', async () => {
    response = await server.inject(getOptions('suggestions', 'GET', { searchString: "Test String ' -" }))
    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  })

  test('GET /suggestions returns mocked data', async () => {
    response = await server.inject(getOptions('suggestions', 'GET', { searchString: 'Test String' }))
    expect(response.payload).toEqual(JSON.stringify(mockSuggestions))
  })
})
