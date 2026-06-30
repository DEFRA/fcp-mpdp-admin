import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest'

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
      case 'redis': return {
        host: 'localhost',
        username: '',
        keyPrefix: 'test:',
        useSingleInstanceCache: true,
        useTLS: false
      }
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

const { getFederatedToken, initFederatedTokenCache, getCachedFederatedToken, getClientCredentialParams } =
  await import('../../../src/auth/federated-credentials.js')
const { GetWebIdentityTokenCommand } = await import('@aws-sdk/client-sts')

const mockTokenResult = {
  WebIdentityToken: 'mock-sts-identity-token',
  Expiration: new Date(Date.now() + 850000)
}

function setupConfigMock () {
  mockConfigGet.mockImplementation((key) => {
    switch (key) {
      case 'federatedCredentials.audience': return 'https://example.com'
      case 'federatedCredentials.tokenDurationSeconds': return 850
      case 'redis': return {
        host: 'localhost',
        username: '',
        keyPrefix: 'test:',
        useSingleInstanceCache: true,
        useTLS: false
      }
      default: return null
    }
  })
}

describe('getFederatedToken', () => {
  beforeEach(() => {
    setupConfigMock()
    mockSend.mockResolvedValue(mockTokenResult)
    mockRedisGet.mockResolvedValue(null)
    mockRedisSet.mockResolvedValue('OK')
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

describe('initFederatedTokenCache — Redis hit (fresh token)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setupConfigMock()
    mockSend.mockResolvedValue(mockTokenResult)
    mockRedisSet.mockResolvedValue('OK')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('should load token from Redis when present and not near expiry', async () => {
    const expiresAt = Date.now() + 800000
    mockRedisGet.mockResolvedValue(JSON.stringify({ token: 'cached-redis-token', expiresAt }))

    await initFederatedTokenCache()

    expect(getCachedFederatedToken()).toBe('cached-redis-token')
    // Should NOT have called STS
    expect(mockSend).not.toHaveBeenCalled()
  })

  test('should schedule a refresh for the remaining TTL minus the buffer', async () => {
    const expiresAt = Date.now() + 800000 // 800s remaining
    mockRedisGet.mockResolvedValue(JSON.stringify({ token: 'cached-redis-token', expiresAt }))

    await initFederatedTokenCache()

    mockSend.mockResolvedValue({ WebIdentityToken: 'refreshed-token', Expiration: new Date(Date.now() + 850000) })

    // Remaining - 2min buffer = 800000 - 120000 = 680000ms
    await vi.advanceTimersByTimeAsync(680000)

    expect(getCachedFederatedToken()).toBe('refreshed-token')
  })
})

describe('initFederatedTokenCache — Redis miss or stale token', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setupConfigMock()
    mockSend.mockResolvedValue(mockTokenResult)
    mockRedisSet.mockResolvedValue('OK')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('should fetch from STS when Redis returns null', async () => {
    mockRedisGet.mockResolvedValue(null)

    await initFederatedTokenCache()

    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(getCachedFederatedToken()).toBe('mock-sts-identity-token')
  })

  test('should fetch from STS when Redis token is within the refresh buffer', async () => {
    // expiresAt is only 60s away — within the 2min buffer
    const expiresAt = Date.now() + 60000
    mockRedisGet.mockResolvedValue(JSON.stringify({ token: 'stale-token', expiresAt }))

    await initFederatedTokenCache()

    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(getCachedFederatedToken()).toBe('mock-sts-identity-token')
  })

  test('should write the new token to Redis after a fresh STS fetch', async () => {
    mockRedisGet.mockResolvedValue(null)

    await initFederatedTokenCache()

    expect(mockRedisSet).toHaveBeenCalledWith(
      'federated-credentials-token',
      expect.stringContaining('mock-sts-identity-token'),
      'EX',
      850
    )
  })

  test('should propagate Redis errors (no fallback at startup)', async () => {
    mockRedisGet.mockRejectedValue(new Error('Redis unavailable'))

    await expect(initFederatedTokenCache()).rejects.toThrow('Redis unavailable')
  })

  test('should propagate STS errors at startup (server should not start)', async () => {
    mockRedisGet.mockResolvedValue(null)
    mockSend.mockRejectedValue(new Error('STS unavailable'))

    await expect(initFederatedTokenCache()).rejects.toThrow('STS unavailable')
  })
})

describe('initFederatedTokenCache — scheduled refresh', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setupConfigMock()
    mockSend.mockResolvedValue(mockTokenResult)
    mockRedisGet.mockResolvedValue(null)
    mockRedisSet.mockResolvedValue('OK')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('should refresh the in-memory token when the timer fires', async () => {
    await initFederatedTokenCache()

    mockSend.mockResolvedValue({ WebIdentityToken: 'refreshed-token', Expiration: new Date() })

    // 850s - 120s buffer = 730s = 730000ms
    await vi.advanceTimersByTimeAsync(730000)

    expect(getCachedFederatedToken()).toBe('refreshed-token')
  })

  test('should not propagate STS errors during a scheduled refresh', async () => {
    await initFederatedTokenCache()

    mockSend.mockRejectedValue(new Error('STS transient error'))

    // Should not throw — error is caught and a retry timer is set instead
    await expect(vi.advanceTimersByTimeAsync(730000)).resolves.not.toThrow()
  })
})

describe('getCachedFederatedToken', () => {
  beforeEach(() => {
    setupConfigMock()
    mockSend.mockResolvedValue(mockTokenResult)
    mockRedisGet.mockResolvedValue(null)
    mockRedisSet.mockResolvedValue('OK')
  })

  test('should return the cached token after init', async () => {
    await initFederatedTokenCache()
    expect(getCachedFederatedToken()).toBe('mock-sts-identity-token')
  })
})

describe('getClientCredentialParams', () => {
  beforeEach(() => {
    setupConfigMock()
    mockSend.mockResolvedValue(mockTokenResult)
    mockRedisGet.mockResolvedValue(null)
    mockRedisSet.mockResolvedValue('OK')
  })

  test('should return client_assertion params when federated credentials enabled', async () => {
    mockConfigGet.mockImplementation((key) => {
      if (key === 'federatedCredentials.enabled') { return true }
      return setupConfigMock() || null
    })
    // Re-implement to call the real config mock properly
    mockConfigGet.mockImplementation((key) => {
      switch (key) {
        case 'federatedCredentials.enabled': return true
        case 'federatedCredentials.audience': return 'https://example.com'
        case 'federatedCredentials.tokenDurationSeconds': return 850
        default: return null
      }
    })

    await initFederatedTokenCache()
    const params = getClientCredentialParams()

    expect(params.client_assertion_type).toBe('urn:ietf:params:oauth:client-assertion-type:jwt-bearer')
    expect(params.client_assertion).toBe('mock-sts-identity-token')
    expect(params.client_secret).toBeUndefined()
  })

  test('should return client_secret param when federated credentials disabled', () => {
    mockConfigGet.mockImplementation((key) => {
      switch (key) {
        case 'federatedCredentials.enabled': return false
        case 'entra.clientSecret': return 'my-secret'
        default: return null
      }
    })

    const params = getClientCredentialParams()

    expect(params.client_secret).toBe('my-secret')
    expect(params.client_assertion).toBeUndefined()
  })
})
