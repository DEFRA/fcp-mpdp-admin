import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest'
import { config } from '../../../src/config/config.js'
import { post } from '../../../src/api/post.js'

vi.mock('../../../src/api/get-backend-auth-headers.js', () => ({
  getBackendAuthHeaders: vi.fn().mockReturnValue({})
}))

const endpoint = 'https://__TEST_ENDPOINT__'
process.env.MPDP_BACKEND_ENDPOINT = endpoint
const path = process.env.MPDP_BACKEND_PATH

vi.mock('../../../src/common/helpers/logging/logging.js', () => ({
  createLogger: vi.fn().mockReturnValue({
    error: vi.fn()
  })
}))

const { createLogger } = await import('../../../src/common/helpers/logging/logger.js')
const mockLogger = createLogger()

describe('post', () => {
  const route = '/__TEST_ROUTE__'

  beforeEach(() => {
    config.load({})
    config.validate({ allowed: 'strict' })

    vi.spyOn(config, 'get').mockImplementation(key => {
      if (key === 'backend.endpoint') { return endpoint }
      if (key === 'backend.path') { return path }
      return config[key]
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  test('service uses the env variable to connect to backend service', async () => {
    const mockData = { foo: 'bar' }
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await post(route, {})

    expect(mockFetch).toHaveBeenCalledWith(
      `${endpoint}${path}${route}`,
      { method: 'POST', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } }
    )
    expect(result).toEqual(mockData)
  })

  test('throws with status when backend returns non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422 }))

    const err = await post(route, {}).catch(e => e)

    expect(err.message).toMatch('422')
    expect(err.status).toBe(422)
  })

  test('post function handles error', async () => {
    const mockLoggerError = vi.fn()
    mockLogger.error = mockLoggerError

    const mockFetch = vi.fn().mockRejectedValue(new Error('Test error'))
    vi.stubGlobal('fetch', mockFetch)

    await expect(post(route, {})).rejects.toThrow('Test error')

    expect(mockFetch).toHaveBeenCalledWith(
      `${endpoint}${path}${route}`,
      expect.objectContaining({ method: 'POST' })
    )
    expect(mockLoggerError).toHaveBeenCalled()
  })
})
