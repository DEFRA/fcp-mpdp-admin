import { generateKeyPairSync } from 'crypto'
import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest'
import Jwt from '@hapi/jwt'

const mockOidcConfig = { jwks_uri: 'https://example.com/jwks_uri' }
const mockGetOidcConfig = vi.fn()
vi.mock('../../../src/auth/get-oidc-config.js', () => ({
  getOidcConfig: mockGetOidcConfig
}))

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',
    format: 'jwk'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
})

const mockPayload = { keys: [publicKey] }

const mockToken = Jwt.token.generate({ name: 'A Farmer' }, { key: privateKey, algorithm: 'RS256' })

describe('verifyToken', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockGetOidcConfig.mockReset().mockResolvedValue(mockOidcConfig)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockPayload)
    }))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  test('should get oidc config', async () => {
    const { verifyToken } = await import('../../../src/auth/verify-token.js')
    await verifyToken(mockToken)
    expect(mockGetOidcConfig).toHaveBeenCalledTimes(1)
  })

  test('should make api get request to jwks uri', async () => {
    const { verifyToken } = await import('../../../src/auth/verify-token.js')
    await verifyToken(mockToken)
    expect(fetch).toHaveBeenCalledWith(mockOidcConfig.jwks_uri)
  })

  test('should not throw error if the token was signed by the correct key', async () => {
    const { verifyToken } = await import('../../../src/auth/verify-token.js')
    await expect(verifyToken(mockToken)).resolves.not.toThrow()
  })

  test('should throw error if no matching JWK found for token kid, after retrying with a fresh fetch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ keys: [{ kid: 'non-matching-kid', x5t: 'non-matching-x5t' }] })
    }))
    const { verifyToken } = await import('../../../src/auth/verify-token.js')

    await expect(verifyToken(mockToken)).rejects.toThrow('No matching JWK for kid')
    // Once from the initial cache miss, once from the retry after not finding the kid
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  test('should throw error if the token was not signed by the correct key', async () => {
    const { privateKey: wrongPrivateKey } = generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'jwk'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    })

    const wrongToken = Jwt.token.generate({ name: 'A Farmer' }, { key: wrongPrivateKey, algorithm: 'RS256' })

    const { verifyToken } = await import('../../../src/auth/verify-token.js')
    await expect(verifyToken(wrongToken)).rejects.toThrow('Invalid token signature')
  })

  test('should cache the JWKS and not re-fetch on a second call', async () => {
    const { verifyToken } = await import('../../../src/auth/verify-token.js')
    await verifyToken(mockToken)
    await verifyToken(mockToken)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(mockGetOidcConfig).toHaveBeenCalledTimes(1)
  })

  test('should re-fetch the JWKS once the cache has expired', async () => {
    const { verifyToken } = await import('../../../src/auth/verify-token.js')
    await verifyToken(mockToken)

    vi.advanceTimersByTime(60 * 60 * 1000)

    await verifyToken(mockToken)
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
