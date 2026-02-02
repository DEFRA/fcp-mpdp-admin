import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest'
import Wreck from '@hapi/wreck'
import { config } from '../../../src/config/config.js'
import { getStream } from '../../../src/api/get-stream.js'

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

describe('Backend API: getStream', () => {
  const route = '/__TEST_ROUTE__'

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

  test('service uses the env variable to connect to backend service (stream)', async () => {
    const mockRequest = vi.fn()
    vi.spyOn(Wreck, 'request').mockImplementation(mockRequest)

    await getStream(route)

    expect(mockRequest).toHaveBeenCalledWith(
      'get',
      `${endpoint}${path}${route}`
    )
  })

  test('getStream function handles error', async () => {
    const mockLoggerError = vi.fn()
    mockLogger.error = mockLoggerError

    const mockRequest = vi.fn().mockRejectedValue(new Error('Stream error'))
    vi.spyOn(Wreck, 'request').mockImplementation(mockRequest)

    await expect(getStream(route)).rejects.toThrow('Stream error')

    expect(mockRequest).toHaveBeenCalledWith(
      'get',
      `${endpoint}${path}${route}`
    )
    expect(mockLoggerError).toHaveBeenCalled()
  })
})
