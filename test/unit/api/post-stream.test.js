import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest'
import Wreck from '@hapi/wreck'
import { config } from '../../../src/config/config.js'
import { postStream } from '../../../src/api/post-stream.js'
import { logBackendError } from '../../../src/api/log-backend-error.js'

const endpoint = 'https://__TEST_ENDPOINT__'
process.env.MPDP_BACKEND_ENDPOINT = endpoint
const path = process.env.MPDP_BACKEND_PATH

vi.mock('../../../src/api/log-backend-error.js', () => ({
  logBackendError: vi.fn()
}))

describe('Backend API: postStream', () => {
  const route = '/__TEST_ROUTE__'
  const url = `${endpoint}${path}${route}`

  beforeEach(() => {
    config.load({})
    config.validate({ allowed: 'strict' })

    vi.spyOn(config, 'get').mockImplementation(key => {
      if (key === 'backend.endpoint') return endpoint
      if (key === 'backend.path') return path
      return config[key]
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('calls Wreck.request with correct parameters and returns stream', async () => {
    const mockStream = { on: vi.fn() }
    const mockRequest = vi.fn().mockResolvedValue(mockStream)
    vi.spyOn(Wreck, 'request').mockImplementation(mockRequest)
    const result = await postStream(route, { content: 'mock data' })

    expect(mockRequest).toHaveBeenCalledWith(
      'post',
      url,
      {
        payload: {
          content: 'mock data'
        }
      }
    )

    expect(result).toBe(mockStream)
  })

  test('logs error and rethrows when Wreck.request rejects', async () => {
    const mockError = new Error('Test stream error')
    const mockRequest = vi.fn().mockRejectedValue(mockError)
    vi.spyOn(Wreck, 'request').mockImplementation(mockRequest)

    await expect(postStream(route, {})).rejects.toThrow('Test stream error')

    expect(mockRequest).toHaveBeenCalledWith(
      'post',
      url,
      { payload: {} }
    )

    expect(logBackendError).toHaveBeenCalledWith(url, mockError)
  })
})
