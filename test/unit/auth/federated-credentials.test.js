import { vi, describe, beforeEach, test, expect } from 'vitest'

// vi.hoisted ensures these spies are available inside vi.mock factories,
// which are hoisted above variable declarations.
const { mockSend, mockRedisGet, mockRedisSet, mockConfigGet } = vi.hoisted(() => ({
  mockSend: vi.fn(),
  mockRedisGet: vi.fn(),
  mockRedisSet: vi.fn(),
  mockConfigGet: vi.fn().mockImplementation((key) => {
    switch (key) {
      case 'federatedCredentials.audience': return 'https://example.com'
      case 'federatedCredentials.tokenDurationSeconds': return 850
      default: return null
    }
  })
}))

// Use regular functions (not arrow functions) so they can be used with `new`.
vi.mock('@aws-sdk/client-sts', () => ({
  STSClient: vi.fn(function () {
    this.send = mockSend
  }),
  GetWebIdentityTokenCommand: vi.fn(function (params) {
    Object.assign(this, params)
  })
}))

vi.mock('../../../src/common/helpers/redis-client.js', () => ({
  buildRedisClient: vi.fn().mockReturnValue({
    get: mockRedisGet,
    set: mockRedisSet
  })
}))

vi.mock('../../../src/config/config.js', () => ({
  config: { get: mockConfigGet }
}))

vi.mock('../../../src/common/helpers/logging/logger.js', () => ({
  createLogger: vi.fn().mockReturnValue({ info: vi.fn(), error: vi.fn() })
}))

const { getFederatedToken, getCachedFederatedToken, getClientCredentialParams } =
  await import('../../../src/auth/federated-credentials.js')
const { GetWebIdentityTokenCommand } = await import('@aws-sdk/client-sts')

const mockTokenResult = {
  WebIdentityToken: 'mock-sts-identity-token',
  Expiration: new Date(Date.now() + 850000)
}

function setupConfigMock (overrides = {}) {
  const defaults = {
    'federatedCredentials.audience': 'https://example.com',
    'federatedCredentials.tokenDurationSeconds': 850,
    redis: {
      host: 'localhost',
      username: '',
      keyPrefix: 'test:',
      useSingleInstanceCache: true,
      useTLS: false
    }
  }
  mockConfigGet.mockImplementation((key) => ({ ...defaults, ...overrides })[key] ?? null)
}

describe('getFederatedToken', () => {
  beforeEach(() => {
    setupConfigMock()
    mockSend.mockResolvedValue(mockTokenResult)
  })

  test('should call STS with the configured audience', async () => {
    await getFederatedToken()
    expect(GetWebIdentityTokenCommand).toHaveBeenCalledWith(
      expect.objectContaining({ Audience: ['https://example.com'] })
    )
  })

  test('should call STS with the configured token duration', async () => {
    await getFederatedToken()
    expect(GetWebIdentityTokenCommand).toHaveBeenCalledWith(
      expect.objectContaining({ DurationSeconds: 850 })
    )
  })

  test('should call STS with RS256 signing algorithm', async () => {
    await getFederatedToken()
    expect(GetWebIdentityTokenCommand).toHaveBeenCalledWith(
      expect.objectContaining({ SigningAlgorithm: 'RS256' })
    )
  })

  test('should return the full STS result', async () => {
    const result = await getFederatedToken()
    expect(result).toEqual(mockTokenResult)
  })

  test('should throw if the STS call fails', async () => {
    mockSend.mockRejectedValue(new Error('STS error'))
    await expect(getFederatedToken()).rejects.toThrow('STS error')
  })
})

describe('getCachedFederatedToken', () => {
  beforeEach(() => {
    setupConfigMock()
    mockSend.mockResolvedValue(mockTokenResult)
    mockRedisSet.mockResolvedValue('OK')
  })

  test('should return the cached token from Redis without calling STS', async () => {
    mockRedisGet.mockResolvedValue('cached-redis-token')

    const token = await getCachedFederatedToken()

    expect(token).toBe('cached-redis-token')
    expect(mockSend).not.toHaveBeenCalled()
  })

  test('should fetch from STS when Redis returns null', async () => {
    mockRedisGet.mockResolvedValue(null)

    const token = await getCachedFederatedToken()

    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(token).toBe('mock-sts-identity-token')
  })

  test('should write the new token to Redis with the TTL shortened by the refresh buffer', async () => {
    mockRedisGet.mockResolvedValue(null)

    await getCachedFederatedToken()

    expect(mockRedisSet).toHaveBeenCalledWith(
      'federated-credentials-token',
      'mock-sts-identity-token',
      'EX',
      730
    )
  })

  test('should propagate Redis get errors', async () => {
    mockRedisGet.mockRejectedValue(new Error('Redis unavailable'))
    await expect(getCachedFederatedToken()).rejects.toThrow('Redis unavailable')
  })

  test('should propagate STS errors', async () => {
    mockRedisGet.mockResolvedValue(null)
    mockSend.mockRejectedValue(new Error('STS unavailable'))
    await expect(getCachedFederatedToken()).rejects.toThrow('STS unavailable')
  })
})

describe('getClientCredentialParams', () => {
  beforeEach(() => {
    mockSend.mockResolvedValue(mockTokenResult)
    mockRedisSet.mockResolvedValue('OK')
  })

  test('should return client_assertion params when federated credentials enabled', async () => {
    setupConfigMock({ 'federatedCredentials.enabled': true })
    mockRedisGet.mockResolvedValue(null)

    const params = await getClientCredentialParams()

    expect(params.client_assertion_type).toBe('urn:ietf:params:oauth:client-assertion-type:jwt-bearer')
    expect(params.client_assertion).toBe('mock-sts-identity-token')
    expect(params.client_secret).toBeUndefined()
  })

  test('should return client_secret param when federated credentials disabled', async () => {
    setupConfigMock({ 'federatedCredentials.enabled': false, 'entra.clientSecret': 'my-secret' })

    const params = await getClientCredentialParams()

    expect(params.client_secret).toBe('my-secret')
    expect(params.client_assertion).toBeUndefined()
  })
})
