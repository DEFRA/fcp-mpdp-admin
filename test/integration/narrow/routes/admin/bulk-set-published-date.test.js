import { describe, beforeAll, afterAll, beforeEach, test, expect, vi } from 'vitest'
import * as cheerio from 'cheerio'
import http2 from 'node:http2'
import '../../helpers/setup-server-mocks.js'
import { getOptions } from '../../../../utils/helpers.js'
import getCrumbs from '../../../../helpers/get-crumbs.js'

const { constants: httpConstants } = http2
const { createServer } = await import('../../../../../src/server.js')

vi.mock('../../../../../src/services/admin-service.js', async () => {
  const actual = await vi.importActual('../../../../../src/services/admin-service.js')
  return {
    ...actual,
    fetchFinancialYears: vi.fn(async () => ['23/24', '22/23', '21/22']),
    bulkSetPublishedDate: vi.fn(async () => ({
      updated: true,
      paymentCount: 100
    }))
  }
})

const { fetchFinancialYears, bulkSetPublishedDate } = await import('../../../../../src/services/admin-service.js')

describe('Bulk set published date routes', () => {
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

  describe('GET /admin/payments/bulk-set-published-date', () => {
    test('should return status code 200', async () => {
      const options = getOptions('admin/payments/bulk-set-published-date', 'GET')
      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
    })

    test('should display page title', async () => {
      const options = getOptions('admin/payments/bulk-set-published-date', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('title').text()).toContain('Bulk Set Published Date')
      expect($('h1').text()).toContain('Bulk Set Published Date')
    })

    test('should display financial year options', async () => {
      const options = getOptions('admin/payments/bulk-set-published-date', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('input[name="financialYear"]').length).toBeGreaterThan(0)
      expect(fetchFinancialYears).toHaveBeenCalled()
    })

    test('should display date input fields', async () => {
      const options = getOptions('admin/payments/bulk-set-published-date', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('input[name="publishedDate-day"]').length).toBeGreaterThan(0)
      expect($('input[name="publishedDate-month"]').length).toBeGreaterThan(0)
      expect($('input[name="publishedDate-year"]').length).toBeGreaterThan(0)
    })

    test('should display submit button', async () => {
      const options = getOptions('admin/payments/bulk-set-published-date', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('button[type="submit"]').text()).toContain('Set published date')
    })

    test('should display cancel link', async () => {
      const options = getOptions('admin/payments/bulk-set-published-date', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('a[href="/admin/payments"]').length).toBeGreaterThan(0)
    })
  })

  describe('POST /admin/payments/bulk-set-published-date', () => {
    test('should successfully set published date and redirect to success page', async () => {
      const crumbs = await getCrumbs(server)
      const options = {
        method: 'POST',
        url: '/admin/payments/bulk-set-published-date',
        payload: {
          crumb: crumbs,
          financialYear: '23/24',
          'publishedDate-day': 15,
          'publishedDate-month': 1,
          'publishedDate-year': 2024
        },
        headers: {
          cookie: `crumb=${crumbs}`
        },
        auth: {
          strategy: 'jwt',
          credentials: {
            scope: ['MPDP.Admin']
          }
        }
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
      expect(bulkSetPublishedDate).toHaveBeenCalledWith('23/24', '2024-01-15')
      const $ = cheerio.load(response.payload)
      expect($('.govuk-panel__title').text()).toContain('Published date updated')
    })

    test('should display success message with correct details', async () => {
      const crumbs = await getCrumbs(server)
      const options = {
        method: 'POST',
        url: '/admin/payments/bulk-set-published-date',
        payload: {
          crumb: crumbs,
          financialYear: '23/24',
          'publishedDate-day': 15,
          'publishedDate-month': 1,
          'publishedDate-year': 2024
        },
        headers: {
          cookie: `crumb=${crumbs}`
        },
        auth: {
          strategy: 'jwt',
          credentials: {
            scope: ['MPDP.Admin']
          }
        }
      }

      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('.govuk-panel__body').text()).toContain('100 payment records')
      expect($('.govuk-panel__body').text()).toContain('23/24')
    })

    test('should return 400 for missing financial year', async () => {
      const crumbs = await getCrumbs(server)
      const options = {
        method: 'POST',
        url: '/admin/payments/bulk-set-published-date',
        payload: {
          crumb: crumbs,
          'publishedDate-day': 15,
          'publishedDate-month': 1,
          'publishedDate-year': 2024
        },
        headers: {
          cookie: `crumb=${crumbs}`
        },
        auth: {
          strategy: 'jwt',
          credentials: {
            scope: ['MPDP.Admin']
          }
        }
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_BAD_REQUEST)
      const $ = cheerio.load(response.payload)
      expect($('.govuk-error-summary').length).toBeGreaterThan(0)
    })

    test('should return 400 for missing published date', async () => {
      const crumbs = await getCrumbs(server)
      const options = {
        method: 'POST',
        url: '/admin/payments/bulk-set-published-date',
        payload: {
          crumb: crumbs,
          financialYear: '23/24'
        },
        headers: {
          cookie: `crumb=${crumbs}`
        },
        auth: {
          strategy: 'jwt',
          credentials: {
            scope: ['MPDP.Admin']
          }
        }
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_BAD_REQUEST)
      const $ = cheerio.load(response.payload)
      expect($('.govuk-error-summary').length).toBeGreaterThan(0)
    })

    test('should return 400 for invalid date', async () => {
      const crumbs = await getCrumbs(server)
      const options = {
        method: 'POST',
        url: '/admin/payments/bulk-set-published-date',
        payload: {
          crumb: crumbs,
          financialYear: '23/24',
          'publishedDate-day': 32,
          'publishedDate-month': 1,
          'publishedDate-year': 2024
        },
        headers: {
          cookie: `crumb=${crumbs}`
        },
        auth: {
          strategy: 'jwt',
          credentials: {
            scope: ['MPDP.Admin']
          }
        }
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_BAD_REQUEST)
      const $ = cheerio.load(response.payload)
      expect($('.govuk-error-summary').length).toBeGreaterThan(0)
    })

    test('should display error summary on validation failure', async () => {
      const crumbs = await getCrumbs(server)
      const options = {
        method: 'POST',
        url: '/admin/payments/bulk-set-published-date',
        payload: {
          crumb: crumbs
        },
        headers: {
          cookie: `crumb=${crumbs}`
        },
        auth: {
          strategy: 'jwt',
          credentials: {
            scope: ['MPDP.Admin']
          }
        }
      }

      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_BAD_REQUEST)
      expect($('.govuk-error-summary').length).toBeGreaterThan(0)
      expect($('.govuk-error-summary__title').text()).toContain('There is a problem')
    })
  })
})
