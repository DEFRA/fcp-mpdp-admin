import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest'

vi.mock('../../../src/config/config.js', () => ({
  config: { get: vi.fn() }
}))

vi.mock('../../../src/common/helpers/service-token.js', () => ({
  getServiceToken: vi.fn()
}))

const { config } = await import('../../../src/config/config.js')
const { getServiceToken } = await import('../../../src/common/helpers/service-token.js')

describe('getBackendAuthHeaders', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('when service-to-service auth is disabled', () => {
    beforeEach(() => {
      config.get.mockReturnValue(false)
    })

    test('returns empty headers object', async () => {
      const { getBackendAuthHeaders } = await import('../../../src/api/get-backend-auth-headers.js')
      const headers = await getBackendAuthHeaders()
      expect(headers).toEqual({})
    })

    test('does not call getServiceToken', async () => {
      const { getBackendAuthHeaders } = await import('../../../src/api/get-backend-auth-headers.js')
      await getBackendAuthHeaders()
      expect(getServiceToken).not.toHaveBeenCalled()
    })
  })

  describe('when service-to-service auth is enabled', () => {
    beforeEach(() => {
      config.get.mockReturnValue(true)
    })

    test('returns empty headers when no token is cached', async () => {
      getServiceToken.mockResolvedValue(null)
      const { getBackendAuthHeaders } = await import('../../../src/api/get-backend-auth-headers.js')
      const headers = await getBackendAuthHeaders()
      expect(headers).toEqual({})
    })

    test('returns bearer authorization header when token is available', async () => {
      getServiceToken.mockResolvedValue('my-test-token')
      const { getBackendAuthHeaders } = await import('../../../src/api/get-backend-auth-headers.js')
      const headers = await getBackendAuthHeaders()
      expect(headers).toEqual({ authorization: 'Bearer my-test-token' })
    })
  })
})
