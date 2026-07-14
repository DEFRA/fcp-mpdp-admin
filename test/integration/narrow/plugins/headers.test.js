import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import '../helpers/setup-server-mocks.js'

const { createServer } = await import('../../../../src/server.js')

let server

describe('headers', () => {
  beforeEach(async () => {
    vi.clearAllMocks()

    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    if (server) {
      await server.stop()
    }
  })

  test('should prevent MIME sniffing attacks ', async () => {
    const response = await server.inject({
      url: '/'
    })
    expect(response.headers['x-content-type-options']).toBe('nosniff')
  })

  test('should prevent clickjacking attacks', async () => {
    const response = await server.inject({
      url: '/'
    })
    expect(response.headers['x-frame-options']).toBe('DENY')
  })

  test('should prevent robots from indexing pages if not home page', async () => {
    const response = await server.inject({
      url: '/some-page'
    })
    expect(response.headers['x-robots-tag']).toBe('noindex, nofollow')
  })

  test('should not prevent robots from indexing the home page', async () => {
    const response = await server.inject({
      url: '/'
    })
    expect(response.headers['x-robots-tag']).toBeUndefined()
  })

  test('should prevent cross-site scripting attacks', async () => {
    const response = await server.inject({
      url: '/'
    })
    expect(response.headers['x-xss-protection']).toBe('1; mode=block')
  })

  test('should ensure pages can only interact with the same origin', async () => {
    const response = await server.inject({
      url: '/'
    })
    expect(response.headers['cross-origin-opener-policy']).toBe('same-origin')
  })

  test('should ensure pages can only be embedded by the same origin', async () => {
    const response = await server.inject({
      url: '/'
    })
    expect(response.headers['cross-origin-embedder-policy']).toBe('require-corp')
  })

  test('should ensure pages can only interact with the same site', async () => {
    const response = await server.inject({
      url: '/'
    })
    expect(response.headers['cross-origin-resource-policy']).toBe('same-site')
  })

  test('should ensure no referrer information is leaked', async () => {
    const response = await server.inject({
      url: '/'
    })
    expect(response.headers['referrer-policy']).toBe('same-origin')
  })

  test('should restrict permissions for sensitive features', async () => {
    const response = await server.inject({
      url: '/'
    })
    expect(response.headers['permissions-policy']).toBe('camera=(), geolocation=(), magnetometer=(), microphone=(), payment=(), usb=()')
  })

  describe('404 error responses', () => {
    test.each([
      ['x-content-type-options', 'nosniff', 'prevent MIME sniffing attacks'],
      ['x-frame-options', 'DENY', 'prevent clickjacking attacks'],
      ['x-robots-tag', 'noindex, nofollow', 'prevent robots from indexing'],
      ['x-xss-protection', '1; mode=block', 'prevent cross-site scripting attacks'],
      ['cross-origin-opener-policy', 'same-origin', 'only interact with the same origin'],
      ['cross-origin-embedder-policy', 'require-corp', 'only be embedded by the same origin'],
      ['cross-origin-resource-policy', 'same-site', 'only interact with the same site'],
      ['referrer-policy', 'same-origin', 'only send referrer information to the same origin'],
      ['permissions-policy', 'camera=(), geolocation=(), magnetometer=(), microphone=(), payment=(), usb=()', 'restrict permissions for sensitive features'],
      ['strict-transport-security', 'max-age=31536000; includeSubDomains; preload', 'enforce HTTPS with strict transport security'],
      ['x-download-options', 'noopen', 'prevent file downloads from opening']
    ])('should set %s header on 404 pages to %s', async (header, value) => {
      const response = await server.inject({
        url: '/non-existent-path'
      })
      expect(response.statusCode).toBe(404)
      expect(response.headers[header]).toBe(value)
    })
  })
})
