import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest'

const mockPayload = { authorization_endpoint: 'https://example.com/auth' }
const mockWellKnownUrl = 'https://example.com/.well-known/openid-configuration'

const mockConfigGet = vi.fn()
vi.mock('../../../src/config/config.js', () => ({
  config: {
    get: mockConfigGet
  }
}))

describe('getOidcConfig', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockConfigGet.mockReturnValue(mockWellKnownUrl)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockPayload)
    }))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  test('should get well known url from config', async () => {
    const { getOidcConfig } = await import('../../../src/auth/get-oidc-config.js')
    await getOidcConfig()
    expect(mockConfigGet).toHaveBeenCalledWith('entra.wellKnownUrl')
  })

  test('should make api get request to well known url', async () => {
    const { getOidcConfig } = await import('../../../src/auth/get-oidc-config.js')
    await getOidcConfig()
    expect(fetch).toHaveBeenCalledWith(mockWellKnownUrl)
  })

  test('should return the payload from the API response', async () => {
    const { getOidcConfig } = await import('../../../src/auth/get-oidc-config.js')
    const result = await getOidcConfig()
    expect(result).toEqual(mockPayload)
  })

  test('should throw an error if the API request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Test error')))
    const { getOidcConfig } = await import('../../../src/auth/get-oidc-config.js')
    await expect(getOidcConfig()).rejects.toThrow('Test error')
  })

  test('should return the cached config on a second call without fetching again', async () => {
    const { getOidcConfig } = await import('../../../src/auth/get-oidc-config.js')
    await getOidcConfig()
    await getOidcConfig()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  test('should re-fetch the config once the cache has expired', async () => {
    const { getOidcConfig } = await import('../../../src/auth/get-oidc-config.js')
    await getOidcConfig()

    vi.advanceTimersByTime(60 * 60 * 1000)

    await getOidcConfig()
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
