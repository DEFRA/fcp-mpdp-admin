import { describe, test, expect, vi, beforeEach } from 'vitest'

const mockLogger = {
  error: vi.fn()
}

vi.mock('../../../src/common/helpers/logging/logger.js', () => ({
  createLogger: vi.fn(() => mockLogger)
}))

const { logBackendError } = await import('../../../src/api/log-backend-error.js')

describe('log-backend-error', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should log error with backend URL and error object', () => {
    const backendUrl = 'https://backend.example.com/api/v1/payments'
    const error = new Error('Network timeout')

    logBackendError(backendUrl, error)

    expect(mockLogger.error).toHaveBeenCalledWith(
      `Encountered error while calling the backend with URL: ${backendUrl}`,
      error
    )
  })

  test('should log error with different URL', () => {
    const backendUrl = 'https://backend.example.com/api/v1/summaries'
    const error = new Error('Connection refused')

    logBackendError(backendUrl, error)

    expect(mockLogger.error).toHaveBeenCalledWith(
      `Encountered error while calling the backend with URL: ${backendUrl}`,
      error
    )
  })

  test('should log error with null error object', () => {
    const backendUrl = 'https://backend.example.com/api/v1/payments'

    logBackendError(backendUrl, null)

    expect(mockLogger.error).toHaveBeenCalledWith(
      `Encountered error while calling the backend with URL: ${backendUrl}`,
      null
    )
  })

  test('should log error with custom error object', () => {
    const backendUrl = 'https://backend.example.com/api/v1/admin'
    const error = { statusCode: 500, message: 'Internal server error', details: 'Database connection failed' }

    logBackendError(backendUrl, error)

    expect(mockLogger.error).toHaveBeenCalledWith(
      `Encountered error while calling the backend with URL: ${backendUrl}`,
      error
    )
  })

  test('should log error only once per call', () => {
    const backendUrl = 'https://backend.example.com/api/v1/payments'
    const error = new Error('Test error')

    logBackendError(backendUrl, error)

    expect(mockLogger.error).toHaveBeenCalledTimes(1)
  })

  test('should include full URL in log message', () => {
    const backendUrl = 'https://backend.example.com/api/v1/payments?page=1&limit=20'
    const error = new Error('Test error')

    logBackendError(backendUrl, error)

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Encountered error while calling the backend with URL: https://backend.example.com/api/v1/payments?page=1&limit=20',
      error
    )
  })
})
