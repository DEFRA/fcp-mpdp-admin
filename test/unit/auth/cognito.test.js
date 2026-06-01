import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest'

// vi.hoisted ensures mockSend is available inside the vi.mock factory,
// which is hoisted to the top of the file before variable declarations run.
const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('@aws-sdk/client-cognito-identity', () => ({
  // Use regular functions (not arrow functions) so they can be used as constructors with `new`.
  CognitoIdentityClient: vi.fn(function () {
    this.send = mockSend
  }),
  GetOpenIdTokenForDeveloperIdentityCommand: vi.fn(function (params) {
    Object.assign(this, params)
  })
}))

const mockConfigGet = vi.fn()
vi.mock('../../../src/config/config.js', () => ({
  config: {
    get: mockConfigGet
  }
}))

vi.mock('../../../src/common/helpers/logging/logger.js', () => ({
  createLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn()
  })
}))

const { getCognitoToken, initCognitoTokenCache, getCachedCognitoToken } = await import('../../../src/auth/cognito.js')
const { GetOpenIdTokenForDeveloperIdentityCommand } = await import('@aws-sdk/client-cognito-identity')

describe('getCognitoToken', () => {
  beforeEach(() => {
    mockConfigGet.mockImplementation((key) => {
      if (key === 'cognito.identityPoolId') return 'eu-west-1:mock-pool-id'
      return null
    })
    mockSend.mockResolvedValue({ Token: 'mock-cognito-token', TokenDuration: 3600 })
  })

  test('should call the Cognito API with the correct identity pool ID', async () => {
    await getCognitoToken()
    expect(GetOpenIdTokenForDeveloperIdentityCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        IdentityPoolId: 'eu-west-1:mock-pool-id'
      })
    )
  })

  test('should call the Cognito API with the correct Logins', async () => {
    await getCognitoToken()
    expect(GetOpenIdTokenForDeveloperIdentityCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Logins: { 'fcp-mpdp-admin-aad-access': 'fcp-mpdp-admin' }
      })
    )
  })

  test('should return the full result from the Cognito API', async () => {
    const result = await getCognitoToken()
    expect(result).toEqual({ Token: 'mock-cognito-token', TokenDuration: 3600 })
  })

  test('should throw if the Cognito API call fails', async () => {
    mockSend.mockRejectedValue(new Error('AWS error'))
    await expect(getCognitoToken()).rejects.toThrow('AWS error')
  })
})

describe('initCognitoTokenCache and getCachedCognitoToken', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockConfigGet.mockImplementation((key) => {
      if (key === 'cognito.identityPoolId') return 'eu-west-1:mock-pool-id'
      return null
    })
    mockSend.mockResolvedValue({ Token: 'mock-cached-token', TokenDuration: 3600 })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('should populate the cache after init', async () => {
    await initCognitoTokenCache()
    expect(getCachedCognitoToken()).toBe('mock-cached-token')
  })

  test('getCachedCognitoToken should return the cached token value', async () => {
    await initCognitoTokenCache()
    expect(getCachedCognitoToken()).toBe('mock-cached-token')
  })

  test('should schedule a token refresh', async () => {
    await initCognitoTokenCache()
    mockSend.mockResolvedValue({ Token: 'refreshed-token', TokenDuration: 3600 })

    // Advance time past the refresh threshold (50 min for a 3600s token)
    await vi.advanceTimersByTimeAsync(50 * 60 * 1000)

    expect(getCachedCognitoToken()).toBe('refreshed-token')
  })
})
