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
    deletePaymentsByPublishedDate: vi.fn(async () => ({
      deleted: true,
      paymentCount: 75
    }))
  }
})

const { deletePaymentsByPublishedDate } = await import('../../../../../src/services/admin-service.js')

describe('Delete by published date routes', () => {
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

  describe('GET /admin/payments/delete-by-published-date', () => {
    test('should return status code 200', async () => {
      const options = getOptions('admin/payments/delete-by-published-date', 'GET')
      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
    })

    test('should display page title', async () => {
      const options = getOptions('admin/payments/delete-by-published-date', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('title').text()).toContain('Delete Payments by Published Date')
      expect($('h1').text()).toContain('Delete Payments by Published Date')
    })

    test('should display date input fields', async () => {
      const options = getOptions('admin/payments/delete-by-published-date', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('input[name="publishedDateDay"]').length).toBeGreaterThan(0)
      expect($('input[name="publishedDateMonth"]').length).toBeGreaterThan(0)
      expect($('input[name="publishedDateYear"]').length).toBeGreaterThan(0)
    })

    test('should display warning text', async () => {
      const options = getOptions('admin/payments/delete-by-published-date', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('.govuk-warning-text__text').text()).toContain('cannot be undone')
    })

    test('should display confirmation checkbox', async () => {
      const options = getOptions('admin/payments/delete-by-published-date', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('input[name="confirm"]').length).toBeGreaterThan(0)
    })

    test('should display submit button', async () => {
      const options = getOptions('admin/payments/delete-by-published-date', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('button[type="submit"]').text()).toContain('Delete payments')
    })

    test('should display cancel link', async () => {
      const options = getOptions('admin/payments/delete-by-published-date', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('a[href="/admin/payments"]').length).toBeGreaterThan(0)
    })
  })

  describe('POST /admin/payments/delete-by-published-date', () => {
    test('should successfully delete payments and show success page', async () => {
      const { cookieCrumb, viewCrumb } = await getCrumbs(
        () => {},
        server,
        '/admin/payments/delete-by-published-date',
        {
          strategy: 'jwt',
          credentials: {
            scope: ['MPDP.Admin']
          }
        }
      )
      const options = {
        method: 'POST',
        url: '/admin/payments/delete-by-published-date',
        payload: {
          crumb: viewCrumb,
          publishedDateDay: 15,
          publishedDateMonth: 1,
          publishedDateYear: 2024,
          confirm: 'yes'
        },
        headers: {
          cookie: `crumb=${cookieCrumb}`
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
      expect(deletePaymentsByPublishedDate).toHaveBeenCalledWith('2024-01-15')
      const $ = cheerio.load(response.payload)
      expect($('.govuk-panel__title').text()).toContain('Deletion complete')
    })

    test('should display success message with correct details', async () => {
      const { cookieCrumb, viewCrumb } = await getCrumbs(
        () => {},
        server,
        '/admin/payments/delete-by-published-date',
        {
          strategy: 'jwt',
          credentials: {
            scope: ['MPDP.Admin']
          }
        }
      )
      const options = {
        method: 'POST',
        url: '/admin/payments/delete-by-published-date',
        payload: {
          crumb: viewCrumb,
          publishedDateDay: 31,
          publishedDateMonth: 12,
          publishedDateYear: 2023,
          confirm: 'yes'
        },
        headers: {
          cookie: `crumb=${cookieCrumb}`
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

      expect($('.govuk-panel__body').text()).toContain('75 payment records')
      expect($('.govuk-panel__body').text()).toContain('2023-12-31')
    })

    test('should return 400 for missing date', async () => {
      const { cookieCrumb, viewCrumb } = await getCrumbs(
        () => {},
        server,
        '/admin/payments/delete-by-published-date',
        {
          strategy: 'jwt',
          credentials: {
            scope: ['MPDP.Admin']
          }
        }
      )
      const options = {
        method: 'POST',
        url: '/admin/payments/delete-by-published-date',
        payload: {
          crumb: viewCrumb,
          confirm: 'yes'
        },
        headers: {
          cookie: `crumb=${cookieCrumb}`
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
    })

    test('should return 400 for missing confirmation', async () => {
      const { cookieCrumb, viewCrumb } = await getCrumbs(
        () => {},
        server,
        '/admin/payments/delete-by-published-date',
        {
          strategy: 'jwt',
          credentials: {
            scope: ['MPDP.Admin']
          }
        }
      )
      const options = {
        method: 'POST',
        url: '/admin/payments/delete-by-published-date',
        payload: {
          crumb: viewCrumb,
          publishedDateDay: 15,
          publishedDateMonth: 1,
          publishedDateYear: 2024
        },
        headers: {
          cookie: `crumb=${cookieCrumb}`
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
    })

    test('should return 400 for invalid date', async () => {
      const { cookieCrumb, viewCrumb } = await getCrumbs(
        () => {},
        server,
        '/admin/payments/delete-by-published-date',
        {
          strategy: 'jwt',
          credentials: {
            scope: ['MPDP.Admin']
          }
        }
      )
      const options = {
        method: 'POST',
        url: '/admin/payments/delete-by-published-date',
        payload: {
          crumb: viewCrumb,
          publishedDateDay: 32,
          publishedDateMonth: 13,
          publishedDateYear: 2024,
          confirm: 'yes'
        },
        headers: {
          cookie: `crumb=${cookieCrumb}`
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
    })

    test('should display error summary on validation error', async () => {
      const { cookieCrumb, viewCrumb } = await getCrumbs(
        () => {},
        server,
        '/admin/payments/delete-by-published-date',
        {
          strategy: 'jwt',
          credentials: {
            scope: ['MPDP.Admin']
          }
        }
      )
      const options = {
        method: 'POST',
        url: '/admin/payments/delete-by-published-date',
        payload: {
          crumb: viewCrumb,
          publishedDateDay: 15,
          publishedDateMonth: 1,
          publishedDateYear: 2024
        },
        headers: {
          cookie: `crumb=${cookieCrumb}`
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
    })
  })
})
