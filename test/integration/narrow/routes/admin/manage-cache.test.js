import { describe, beforeAll, afterAll, beforeEach, test, expect, vi } from 'vitest'
import * as cheerio from 'cheerio'
import http2 from 'node:http2'
import '../../helpers/setup-server-mocks.js'
import { getOptions } from '../../../../utils/helpers.js'
import getCrumbs from '../../../../helpers/get-crumbs.js'

const { constants: httpConstants } = http2
const { createServer } = await import('../../../../../src/server.js')

vi.mock('../../../../../src/services/cache-service.js', () => ({
  invalidateSearchCache: vi.fn(async () => undefined)
}))

const { invalidateSearchCache } = await import('../../../../../src/services/cache-service.js')

describe('Admin manage cache routes', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /admin/cache', () => {
    test('should return status code 200', async () => {
      const options = getOptions('admin/cache', 'GET')
      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
    })

    test('should display page title', async () => {
      const options = getOptions('admin/cache', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('h1').text()).toContain('Manage Search Cache')
    })

    test('should display invalidate button', async () => {
      const options = getOptions('admin/cache', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('button.govuk-button--warning').length).toBeGreaterThan(0)
      expect($('button.govuk-button--warning').text()).toContain('Invalidate search cache')
    })

    test('should display success banner when success=invalidated', async () => {
      const options = getOptions('admin/cache', 'GET', { success: 'invalidated' })
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('.govuk-notification-banner--success').length).toBeGreaterThan(0)
      expect($('.govuk-notification-banner--success').text()).toContain('Search cache successfully invalidated')
    })

    test('should not display success banner without success param', async () => {
      const options = getOptions('admin/cache', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('.govuk-notification-banner--success').length).toBe(0)
    })
  })

  describe('POST /admin/cache/invalidate', () => {
    test('should redirect to /admin/cache?success=invalidated on success', async () => {
      const { cookieCrumb, viewCrumb } = await getCrumbs(
        () => {},
        server,
        '/admin/cache',
        {
          strategy: 'jwt',
          credentials: {
            scope: ['MPDP.Admin']
          }
        }
      )

      const response = await server.inject({
        method: 'POST',
        url: '/admin/cache/invalidate',
        payload: { crumb: viewCrumb },
        headers: { cookie: `crumb=${cookieCrumb}` },
        auth: {
          strategy: 'session',
          credentials: {
            scope: ['MPDP.Admin'],
            sessionId: 'test-session-id'
          }
        }
      })

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_FOUND)
      expect(response.headers.location).toBe('/admin/cache?success=invalidated')
    })

    test('should call invalidateSearchCache service', async () => {
      const { cookieCrumb, viewCrumb } = await getCrumbs(
        () => {},
        server,
        '/admin/cache',
        {
          strategy: 'jwt',
          credentials: {
            scope: ['MPDP.Admin']
          }
        }
      )

      await server.inject({
        method: 'POST',
        url: '/admin/cache/invalidate',
        payload: { crumb: viewCrumb },
        headers: { cookie: `crumb=${cookieCrumb}` },
        auth: {
          strategy: 'session',
          credentials: {
            scope: ['MPDP.Admin'],
            sessionId: 'test-session-id'
          }
        }
      })

      expect(invalidateSearchCache).toHaveBeenCalledTimes(1)
    })

    test('should return 200 and show error banner when service throws', async () => {
      invalidateSearchCache.mockRejectedValueOnce(new Error('Backend unavailable'))

      const { cookieCrumb, viewCrumb } = await getCrumbs(
        () => {},
        server,
        '/admin/cache',
        {
          strategy: 'jwt',
          credentials: {
            scope: ['MPDP.Admin']
          }
        }
      )

      const response = await server.inject({
        method: 'POST',
        url: '/admin/cache/invalidate',
        payload: { crumb: viewCrumb },
        headers: { cookie: `crumb=${cookieCrumb}` },
        auth: {
          strategy: 'session',
          credentials: {
            scope: ['MPDP.Admin'],
            sessionId: 'test-session-id'
          }
        }
      })

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
      const $ = cheerio.load(response.payload)
      expect($('.govuk-notification-banner').length).toBeGreaterThan(0)
      expect($('.govuk-notification-banner').text()).toContain('Failed to invalidate search cache')
    })
  })
})
