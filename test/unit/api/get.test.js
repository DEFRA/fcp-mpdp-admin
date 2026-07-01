import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest'
import { config } from '../../../src/config/config.js'
import { get } from '../../../src/api/get.js'

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

describe('get', () => {
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

  test('should use env variable to connect to backend service', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
    })
    vi.stubGlobal('fetch', mockFetch)

    await get(route)

    expect(mockFetch).toHaveBeenCalledWith(`${endpoint}${path}${route}`, { headers: {} })
  })

  test('should handle error when request fails', async () => {
    const mockLoggerError = vi.fn()
    mockLogger.error = mockLoggerError

    const mockFetch = vi.fn().mockRejectedValue(null)
    vi.stubGlobal('fetch', mockFetch)

    await expect(get(route)).rejects.toThrow()

    expect(mockFetch).toHaveBeenCalledWith(`${endpoint}${path}${route}`, { headers: {} })
    expect(mockLoggerError).toHaveBeenCalled()
  })
})
