import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest'

const mockOidcConfig = { token_endpoint: 'https://example.com/token' }
const mockGetOidcConfig = vi.fn()
vi.mock('../../../src/auth/get-oidc-config.js', () => ({
  getOidcConfig: mockGetOidcConfig
}))

let mockFetch
const mockTokenPayload = { access_token: 'DEFRA_ID_JWT', refresh_token: 'DEFRA_ID_REFRESH_TOKEN_NEW' }

const mockConfigGet = vi.fn()
vi.mock('../../../src/config/config.js', () => ({
  config: {
    get: mockConfigGet
  }
}))

const mockGetCachedFederatedToken = vi.fn().mockReturnValue('mock-federated-assertion-token')
const mockGetClientCredentialParams = vi.fn()
vi.mock('../../../src/auth/federated-credentials.js', () => ({
  getCachedFederatedToken: mockGetCachedFederatedToken,
  getClientCredentialParams: mockGetClientCredentialParams
}))

const { refreshTokens } = await import('../../../src/auth/refresh-tokens.js')

const refreshToken = 'DEFRA_ID_REFRESH_TOKEN'

function setupConfigMock (overrides = {}) {
  const defaults = {
    'federatedCredentials.enabled': false,
    'entra.clientId': 'mockClientId',
    'entra.clientSecret': 'mockClientSecret',
    'entra.redirectUrl': 'https://mock-redirect-url.com'
  }
  mockConfigGet.mockImplementation((key) => ({ ...defaults, ...overrides })[key] ?? 'defaultConfigValue')
}

describe('refreshTokens', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetOidcConfig.mockResolvedValue(mockOidcConfig)
    mockFetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve(mockTokenPayload) })
    vi.stubGlobal('fetch', mockFetch)
    setupConfigMock()
    mockGetClientCredentialParams.mockReturnValue({ client_secret: 'mockClientSecret' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('should get oidc config', async () => {
    await refreshTokens(refreshToken)
    expect(mockGetOidcConfig).toHaveBeenCalled()
  })

  test('should get client id from config', async () => {
    await refreshTokens(refreshToken)
    expect(mockConfigGet).toHaveBeenCalledWith('entra.clientId')
  })

  test('should get client credential params', async () => {
    await refreshTokens(refreshToken)
    expect(mockGetClientCredentialParams).toHaveBeenCalled()
  })

  test('should get redirect url from config', async () => {
    await refreshTokens(refreshToken)
    expect(mockConfigGet).toHaveBeenCalledWith('entra.redirectUrl')
  })

  test('should make api post request to token endpoint host', async () => {
    await refreshTokens(refreshToken)
    const url = new URL(mockFetch.mock.calls[0][0])
    expect(url.origin).toBe('https://example.com')
  })

  test('should make api post request to token endpoint path', async () => {
    await refreshTokens(refreshToken)
    const url = new URL(mockFetch.mock.calls[0][0])
    expect(url.pathname).toBe('/token')
  })

  test('should make api post request to token endpoint with query string', async () => {
    await refreshTokens(refreshToken)
    const url = new URL(mockFetch.mock.calls[0][0])
    expect(url.searchParams.get('client_id')).toBe('mockClientId')
    expect(url.searchParams.get('client_secret')).toBe('mockClientSecret')
    expect(url.searchParams.get('grant_type')).toBe('refresh_token')
    expect(url.searchParams.get('scope')).toBe('mockClientId/.default offline_access')
    expect(url.searchParams.get('refresh_token')).toBe(refreshToken)
    expect(url.searchParams.get('redirect_uri')).toBe('https://mock-redirect-url.com')
  })

  test('should make api post request to token endpoint with content type header', async () => {
    await refreshTokens(refreshToken)
    expect(mockFetch.mock.calls[0][1].headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' })
  })

  test('should return the payload from the API response', async () => {
    const result = await refreshTokens(refreshToken)
    expect(result).toEqual(mockTokenPayload)
  })

  test('should throw error if get oidc config fails', async () => {
    mockGetOidcConfig.mockRejectedValue(new Error('Unable to get OIDC config'))
    await expect(refreshTokens(refreshToken)).rejects.toThrow()
  })

  test('should throw an error if the api request fails', async () => {
    mockFetch.mockRejectedValue(new Error('Unable to get token'))
    await expect(refreshTokens(refreshToken)).rejects.toThrow()
  })
})

describe('refreshTokens - federated credentials enabled', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetOidcConfig.mockResolvedValue(mockOidcConfig)
    mockFetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve(mockTokenPayload) })
    vi.stubGlobal('fetch', mockFetch)
    setupConfigMock({ 'federatedCredentials.enabled': true })
    mockGetClientCredentialParams.mockReturnValue({
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: 'mock-federated-assertion-token'
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('should include client_assertion_type in query string', async () => {
    await refreshTokens(refreshToken)
    const url = new URL(mockFetch.mock.calls[0][0])
    expect(url.searchParams.get('client_assertion_type'))
      .toBe('urn:ietf:params:oauth:client-assertion-type:jwt-bearer')
  })

  test('should include client_assertion from cached federated token in query string', async () => {
    await refreshTokens(refreshToken)
    const url = new URL(mockFetch.mock.calls[0][0])
    expect(url.searchParams.get('client_assertion')).toBe('mock-federated-assertion-token')
  })

  test('should not include client_secret in query string', async () => {
    await refreshTokens(refreshToken)
    const url = new URL(mockFetch.mock.calls[0][0])
    expect(url.searchParams.get('client_secret')).toBeNull()
  })

  test('should still include client_id and grant_type in query string', async () => {
    await refreshTokens(refreshToken)
    const url = new URL(mockFetch.mock.calls[0][0])
    expect(url.searchParams.get('client_id')).toBe('mockClientId')
    expect(url.searchParams.get('grant_type')).toBe('refresh_token')
  })
})
