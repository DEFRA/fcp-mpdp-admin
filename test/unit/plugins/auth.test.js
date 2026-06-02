import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../src/auth/get-oidc-config.js', () => ({
  getOidcConfig: vi.fn()
}))

vi.mock('../../../src/config/config.js', () => ({
  config: {
    get: vi.fn()
  }
}))

const mockGetCachedFederatedToken = vi.fn().mockReturnValue('mock-federated-token')
const mockInitFederatedTokenCache = vi.fn().mockResolvedValue(undefined)
const mockGetClientCredentialParams = vi.fn().mockReturnValue({
  client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
  client_assertion: 'mock-federated-token'
})
vi.mock('../../../src/auth/federated-credentials.js', () => ({
  getCachedFederatedToken: mockGetCachedFederatedToken,
  initFederatedTokenCache: mockInitFederatedTokenCache,
  getClientCredentialParams: mockGetClientCredentialParams
}))

const { getOidcConfig } = await import('../../../src/auth/get-oidc-config.js')
const { config } = await import('../../../src/config/config.js')
const { auth } = await import('../../../src/plugins/auth.js')

function createMockServer () {
  return {
    auth: {
      strategy: vi.fn(),
      default: vi.fn()
    }
  }
}

function getBellOptions (mockServer) {
  return mockServer.auth.strategy.mock.calls.find(call => call[0] === 'entra')[2]
}

describe('auth', () => {
  const mockOidcConfig = {
    authorization_endpoint: 'https://login.microsoftonline.com/authorize',
    token_endpoint: 'https://login.microsoftonline.com/token',
    end_session_endpoint: 'https://login.microsoftonline.com/logout',
    jwks_uri: 'https://login.microsoftonline.com/jwks'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    getOidcConfig.mockResolvedValue(mockOidcConfig)
    config.get.mockImplementation((key) => {
      const configMap = {
        'federatedCredentials.enabled': false,
        'entra.clientId': 'test-client-id',
        'entra.clientSecret': 'test-client-secret',
        'cookie.password': 'password-must-be-at-least-32-characters-long',
        'cookie.secure': true,
        'cache.name': 'session',
        'cache.segment': 'test-cache'
      }
      return configMap[key]
    })
  })

  test('should export auth plugin object', () => {
    expect(auth).toBeDefined()
    expect(auth.plugin).toBeDefined()
    expect(auth.plugin.name).toBe('auth')
    expect(typeof auth.plugin.register).toBe('function')
  })

  test('should have correct plugin name', () => {
    expect(auth.plugin.name).toBe('auth')
  })

  test('should register function be defined', () => {
    expect(auth.plugin.register).toBeDefined()
    expect(typeof auth.plugin.register).toBe('function')
  })

  test('should call getOidcConfig during registration', async () => {
    const mockServer = createMockServer()
    await auth.plugin.register(mockServer)
    expect(getOidcConfig).toHaveBeenCalledTimes(1)
  })

  test('should register entra and session strategies', async () => {
    const mockServer = createMockServer()
    await auth.plugin.register(mockServer)
    expect(mockServer.auth.strategy).toHaveBeenCalledWith('entra', 'bell', expect.any(Object))
    expect(mockServer.auth.strategy).toHaveBeenCalledWith('session', 'cookie', expect.any(Object))
  })

  test('should set session as default strategy', async () => {
    const mockServer = createMockServer()
    await auth.plugin.register(mockServer)
    expect(mockServer.auth.default).toHaveBeenCalledWith('session')
  })

  test('should configure Bell with correct OAuth endpoints', async () => {
    const mockServer = createMockServer()
    await auth.plugin.register(mockServer)
    const bellOptions = getBellOptions(mockServer)
    expect(bellOptions.provider.auth).toBe(mockOidcConfig.authorization_endpoint)
    expect(bellOptions.provider.token).toBe(mockOidcConfig.token_endpoint)
  })

  test('should configure Bell with correct client credentials', async () => {
    const mockServer = createMockServer()
    await auth.plugin.register(mockServer)
    const bellOptions = getBellOptions(mockServer)
    expect(bellOptions.clientId).toBe('test-client-id')
    expect(bellOptions.clientSecret).toBe('test-client-secret')
    expect(config.get).toHaveBeenCalledWith('entra.clientId')
    expect(config.get).toHaveBeenCalledWith('entra.clientSecret')
  })
})

describe('auth - federated credentials enabled', () => {
  const mockOidcConfig = {
    authorization_endpoint: 'https://login.microsoftonline.com/authorize',
    token_endpoint: 'https://login.microsoftonline.com/token',
    end_session_endpoint: 'https://login.microsoftonline.com/logout',
    jwks_uri: 'https://login.microsoftonline.com/jwks'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    getOidcConfig.mockResolvedValue(mockOidcConfig)
    config.get.mockImplementation((key) => {
      const configMap = {
        'federatedCredentials.enabled': true,
        'entra.clientId': 'test-client-id',
        'cookie.password': 'password-must-be-at-least-32-characters-long',
        'cookie.secure': true,
        'cache.name': 'session',
        'cache.segment': 'test-cache'
      }
      return configMap[key]
    })
  })

  test('should initialise the federated token cache during registration', async () => {
    const mockServer = createMockServer()
    await auth.plugin.register(mockServer)
    expect(mockInitFederatedTokenCache).toHaveBeenCalledTimes(1)
  })

  test('should configure Bell with clientSecret as empty object', async () => {
    const mockServer = createMockServer()
    await auth.plugin.register(mockServer)
    const bellOptions = getBellOptions(mockServer)
    expect(bellOptions.clientSecret).toEqual({})
  })

  test('should configure Bell with a tokenParams function that returns client_assertion', async () => {
    const mockServer = createMockServer()
    await auth.plugin.register(mockServer)
    const bellOptions = getBellOptions(mockServer)
    expect(typeof bellOptions.tokenParams).toBe('function')
    const params = bellOptions.tokenParams({})
    expect(params.client_assertion_type).toBe('urn:ietf:params:oauth:client-assertion-type:jwt-bearer')
    expect(params.client_assertion).toBe('mock-federated-token')
  })

  test('should not include client_secret in Bell tokenParams', async () => {
    const mockServer = createMockServer()
    await auth.plugin.register(mockServer)
    const bellOptions = getBellOptions(mockServer)
    const params = bellOptions.tokenParams({})
    expect(params.client_secret).toBeUndefined()
  })
})
