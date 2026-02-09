import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../src/api/log-backend-error.js', () => ({
  logBackendError: vi.fn()
}))

const { logBackendError } = await import('../../../src/api/log-backend-error.js')
const { requestPromise } = await import('../../../src/api/request-promise.js')

describe('request-promise', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should return result when promise resolves successfully', async () => {
    const backendUrl = 'https://backend.example.com/api/v1/payments'
    const expectedData = { id: 1, name: 'Test Payment' }
    const promise = Promise.resolve(expectedData)

    const result = await requestPromise(backendUrl, promise)

    expect(result).toEqual(expectedData)
    expect(logBackendError).not.toHaveBeenCalled()
  })

  test('should log error and rethrow when promise rejects', async () => {
    const backendUrl = 'https://backend.example.com/api/v1/payments'
    const error = new Error('Network error')
    const promise = Promise.reject(error)

    await expect(requestPromise(backendUrl, promise)).rejects.toThrow('Network error')
    expect(logBackendError).toHaveBeenCalledWith(backendUrl, error)
    expect(logBackendError).toHaveBeenCalledTimes(1)
  })

  test('should handle different backend URLs', async () => {
    const backendUrl = 'https://different-backend.example.com/api/v2/summaries'
    const error = new Error('Timeout')
    const promise = Promise.reject(error)

    await expect(requestPromise(backendUrl, promise)).rejects.toThrow('Timeout')
    expect(logBackendError).toHaveBeenCalledWith(backendUrl, error)
  })

  test('should pass through different error types', async () => {
    const backendUrl = 'https://backend.example.com/api/v1/payments'
    const error = { statusCode: 404, message: 'Not found' }
    const promise = Promise.reject(error)

    await expect(requestPromise(backendUrl, promise)).rejects.toEqual(error)
    expect(logBackendError).toHaveBeenCalledWith(backendUrl, error)
  })

  test('should return null when promise resolves with null', async () => {
    const backendUrl = 'https://backend.example.com/api/v1/payments'
    const promise = Promise.resolve(null)

    const result = await requestPromise(backendUrl, promise)

    expect(result).toBeNull()
    expect(logBackendError).not.toHaveBeenCalled()
  })

  test('should return undefined when promise resolves with undefined', async () => {
    const backendUrl = 'https://backend.example.com/api/v1/payments'
    const promise = Promise.resolve(undefined)

    const result = await requestPromise(backendUrl, promise)

    expect(result).toBeUndefined()
    expect(logBackendError).not.toHaveBeenCalled()
  })
})
