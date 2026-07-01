import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest'

const mockPayload = { authorization_endpoint: 'https://example.com/auth' }
const mockWellKnownUrl = 'https://example.com/.well-known/openid-configuration'

const mockConfigGet = vi.fn()
vi.mock('../../../src/config/config.js', () => ({
  config: {
    get: mockConfigGet
  }
}))

const { getOidcConfig } = await import('../../../src/auth/get-oidc-config.js')

describe('getOidcConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfigGet.mockReturnValue(mockWellKnownUrl)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockPayload)
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('should get well known url from config', async () => {
    await getOidcConfig()
    expect(mockConfigGet).toHaveBeenCalledWith('entra.wellKnownUrl')
  })

  test('should make api get request to well known url', async () => {
    await getOidcConfig()
    expect(fetch).toHaveBeenCalledWith(mockWellKnownUrl)
  })

  test('should return the payload from the API response', async () => {
    const result = await getOidcConfig()
    expect(result).toEqual(mockPayload)
  })

  test('should throw an error if the API request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Test error')))
    await expect(getOidcConfig()).rejects.toThrow('Test error')
  })
})
