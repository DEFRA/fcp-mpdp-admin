import { describe, beforeEach, afterEach, test, expect, vi } from 'vitest'
import Wreck from '@hapi/wreck'
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
  })

  describe('invalidateSearchCache', () => {
    test('should call the backend cache invalidation endpoint', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        res: { statusCode: 200 },
        payload: JSON.stringify({ message: 'Search cache invalidated' })
      })
      vi.spyOn(Wreck, 'post').mockImplementation(mockPost)

      await invalidateSearchCache()

      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('/admin/cache/invalidate'),
        expect.anything()
      )
    })

    test('should resolve successfully on 200 response', async () => {
      vi.spyOn(Wreck, 'post').mockResolvedValue({
        res: { statusCode: 200 },
        payload: JSON.stringify({ message: 'Search cache invalidated' })
      })

      await expect(invalidateSearchCache()).resolves.not.toThrow()
    })

    test('should throw when backend call fails', async () => {
      vi.spyOn(Wreck, 'post').mockRejectedValue(new Error('Connection refused'))

      await expect(invalidateSearchCache()).rejects.toThrow('Connection refused')
    })
  })
})
