import { describe, beforeEach, afterEach, test, expect, vi } from 'vitest'
import { invalidateSearchCache } from '../../../src/services/cache-service.js'
import { config } from '../../../src/config/config.js'

vi.mock('../../../src/api/get-backend-auth-headers.js', () => ({
  getBackendAuthHeaders: vi.fn().mockReturnValue({})
}))

const endpoint = 'https://__TEST_ENDPOINT__'
process.env.MPDP_BACKEND_ENDPOINT = endpoint
const path = process.env.MPDP_BACKEND_PATH

describe('cache-service', () => {
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

  describe('invalidateSearchCache', () => {
    test('should call the backend cache invalidation endpoint', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
      }))

      await invalidateSearchCache()

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/cache/invalidate'),
        expect.anything()
      )
    })

    test('should resolve successfully on 200 response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
      }))

      await expect(invalidateSearchCache()).resolves.not.toThrow()
    })

    test('should throw when backend call fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection refused')))

      await expect(invalidateSearchCache()).rejects.toThrow('Connection refused')
    })
  })
})
