import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { config } from '../../../src/config/config.js'

const endpoint = 'https://test-backend.example.com'
const path = '/api/v1'

vi.mock('../../../src/config/config.js', () => ({
  config: {
    get: vi.fn()
  }
}))

const { buildBackendUrl } = await import('../../../src/api/build-backend-url.js')

describe('build-backend-url', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    config.get.mockImplementation((key) => {
      if (key === 'backend.endpoint') return endpoint
      if (key === 'backend.path') return path
      return undefined
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('should build backend URL with endpoint, path, and route', () => {
    const url = '/payments'
    const result = buildBackendUrl(url)

    expect(result).toBe('https://test-backend.example.com/api/v1/payments')
    expect(config.get).toHaveBeenCalledWith('backend.endpoint')
    expect(config.get).toHaveBeenCalledWith('backend.path')
  })

  test('should handle URL with leading slash', () => {
    const url = '/admin/summary'
    const result = buildBackendUrl(url)

    expect(result).toBe('https://test-backend.example.com/api/v1/admin/summary')
  })

  test('should handle URL without leading slash', () => {
    const url = 'payments/search'
    const result = buildBackendUrl(url)

    expect(result).toBe('https://test-backend.example.com/api/v1payments/search')
  })

  test('should handle empty URL', () => {
    const url = ''
    const result = buildBackendUrl(url)

    expect(result).toBe('https://test-backend.example.com/api/v1')
  })

  test('should handle URL with query parameters', () => {
    const url = '/payments?page=1&limit=20'
    const result = buildBackendUrl(url)

    expect(result).toBe('https://test-backend.example.com/api/v1/payments?page=1&limit=20')
  })

  test('should handle different endpoint and path from config', () => {
    config.get.mockImplementation((key) => {
      if (key === 'backend.endpoint') return 'http://localhost:3001'
      if (key === 'backend.path') return '/v2'
      return undefined
    })

    const url = '/test'
    const result = buildBackendUrl(url)

    expect(result).toBe('http://localhost:3001/v2/test')
  })
})
