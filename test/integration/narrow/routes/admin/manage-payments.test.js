import { describe, beforeAll, afterAll, beforeEach, test, expect, vi } from 'vitest'
import * as cheerio from 'cheerio'
import http2 from 'node:http2'
import '../../helpers/setup-server-mocks.js'
import { getOptions } from '../../../../utils/helpers.js'
import getCrumbs from '../../../../helpers/get-crumbs.js'

const { constants: httpConstants } = http2
const { createServer } = await import('../../../../../src/server.js')

const mockPayments = {
  count: 50,
  rows: [
    {
      id: 1,
      payeeName: 'Test Payee 1',
      partPostcode: 'SW1A',
      town: 'London',
      scheme: 'SFI',
      financialYear: '23/24',
      amount: '1000.00'
    },
    {
      id: 2,
      payeeName: 'Test Payee 2',
      partPostcode: 'NE1',
      town: 'Newcastle',
      scheme: 'CS',
      financialYear: '23/24',
      amount: '2000.00'
    }
  ],
  page: 1,
  totalPages: 3
}

vi.mock('../../../../../src/services/admin-service.js', () => {
  return {
    fetchAdminPayments: vi.fn(async () => mockPayments),
    fetchPaymentById: vi.fn(async (id) => {
      return mockPayments.rows.find(p => p.id === id) || null
    }),
    createPayment: vi.fn(async (data) => ({ id: 3, ...data })),
    updatePayment: vi.fn(async (id, data) => ({ id, ...data })),
    deletePaymentById: vi.fn(async () => ({ deleted: true })),
    fetchFinancialYears: vi.fn(async () => ['23/24', '22/23', '21/22']),
    deletePaymentsByYear: vi.fn(async () => ({
      deleted: true,
      paymentCount: 50,
      schemeCount: 5
    })),
    uploadPaymentsCsv: vi.fn(async () => ({
      success: true,
      imported: 10,
      errors: []
    })),
    bulkSetPublishedDate: vi.fn(async () => ({
      updated: true,
      paymentCount: 100
    }))
  }
})

describe('Admin manage payments route', () => {
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

  describe('GET /admin/payments', () => {
    test('should return status code 200', async () => {
      const options = getOptions('admin/payments', 'GET')
      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
    })

    test('should display page title', async () => {
      const options = getOptions('admin/payments', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('title').text()).toContain('Manage Payments')
    })

    test('should display payments table', async () => {
      const options = getOptions('admin/payments', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('table').length).toBeGreaterThan(0)
      expect($('table').text()).toContain('Test Payee 1')
      expect($('table').text()).toContain('Test Payee 2')
    })

    test('should display action buttons', async () => {
      const options = getOptions('admin/payments', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('a[href="/admin/payments/add"]').length).toBeGreaterThan(0)
      expect($('a[href="/admin/payments/bulk-upload"]').length).toBeGreaterThan(0)
      expect($('a[href="/admin/payments/bulk-set-published-date"]').length).toBeGreaterThan(0)
      expect($('a[href="/admin/payments/delete-by-year"]').length).toBeGreaterThan(0)
    })

    test('should display search form', async () => {
      const options = getOptions('admin/payments', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('form[action="/admin/payments"]').length).toBeGreaterThan(0)
      expect($('input[name="searchString"]').length).toBeGreaterThan(0)
      expect($('button[type="submit"]').text()).toContain('Search')
    })

    test('should display success message when payment added', async () => {
      const options = getOptions('admin/payments', 'GET', { success: 'added' })
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('.govuk-notification-banner--success').text()).toContain('successfully added')
    })

    test('should display success message when payment updated', async () => {
      const options = getOptions('admin/payments', 'GET', { success: 'updated' })
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('.govuk-notification-banner--success').text()).toContain('successfully updated')
    })

    test('should display success message when payment deleted', async () => {
      const options = getOptions('admin/payments', 'GET', { success: 'deleted' })
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('.govuk-notification-banner--success').text()).toContain('successfully deleted')
    })
  })

  describe('GET /admin/payments/add', () => {
    test('should return status code 200', async () => {
      const options = getOptions('admin/payments/add', 'GET')
      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
    })

    test('should display add payment form', async () => {
      const options = getOptions('admin/payments/add', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('form[action="/admin/payments/add"]').length).toBeGreaterThan(0)
      expect($('input[name="payeeName"]').length).toBeGreaterThan(0)
      expect($('input[name="partPostcode"]').length).toBeGreaterThan(0)
      expect($('input[name="amount"]').length).toBeGreaterThan(0)
      expect($('input[name="financialYear"]').length).toBeGreaterThan(0)
    })

    test('should display date input with day, month, year fields', async () => {
      const options = getOptions('admin/payments/add', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('input[name="paymentDateDay"]').length).toBeGreaterThan(0)
      expect($('input[name="paymentDateMonth"]').length).toBeGreaterThan(0)
      expect($('input[name="paymentDateYear"]').length).toBeGreaterThan(0)
    })
  })

  describe('POST /admin/payments/add', () => {
    test('should redirect on successful creation', async () => {
      const mockForCrumbs = () => {}
      const { cookieCrumb, viewCrumb } = await getCrumbs(
        mockForCrumbs,
        server,
        '/admin/payments/add',
        {
          strategy: 'session',
          credentials: {
            scope: ['MPDP.Admin'],
            sessionId: 'test-session-id'
          }
        }
      )

      const options = {
        method: 'POST',
        url: '/admin/payments/add',
        payload: {
          payeeName: 'New Payee',
          partPostcode: 'SW1A',
          town: 'London',
          amount: 1000,
          financialYear: '23/24',
          crumb: viewCrumb
        },
        headers: {
          cookie: `crumb=${cookieCrumb}`
        },
        auth: {
          strategy: 'session',
          credentials: {
            scope: ['MPDP.Admin'],
            sessionId: 'test-session-id'
          }
        }
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_FOUND)
      expect(response.headers.location).toContain('/admin/payments')
      expect(response.headers.location).toContain('success=added')
    })

    test('should return 400 with validation errors for missing required fields', async () => {
      const mockForCrumbs = () => {}
      const { cookieCrumb, viewCrumb } = await getCrumbs(
        mockForCrumbs,
        server,
        '/admin/payments/add',
        {
          strategy: 'session',
          credentials: {
            scope: ['MPDP.Admin'],
            sessionId: 'test-session-id'
          }
        }
      )

      const options = {
        method: 'POST',
        url: '/admin/payments/add',
        payload: {
          payee_name: 'Test',
          crumb: viewCrumb
        },
        headers: {
          cookie: `crumb=${cookieCrumb}`
        },
        auth: {
          strategy: 'session',
          credentials: {
            scope: ['MPDP.Admin'],
            sessionId: 'test-session-id'
          }
        }
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_BAD_REQUEST)
    })
  })

  describe('GET /admin/payments/{id}/edit', () => {
    test('should return status code 200 for existing payment', async () => {
      const options = getOptions('admin/payments/1/edit', 'GET')
      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
    })

    test('should display edit form with pre-populated data', async () => {
      const options = getOptions('admin/payments/1/edit', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('form[action="/admin/payments/1/edit"]').length).toBeGreaterThan(0)
      expect($('input[name="payeeName"]').val()).toBe('Test Payee 1')
      expect($('input[name="partPostcode"]').val()).toBe('SW1A')
    })

    test('should return 404 for non-existent payment', async () => {
      const options = getOptions('admin/payments/999/edit', 'GET')
      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_NOT_FOUND)
    })
  })

  describe('POST /admin/payments/{id}/edit', () => {
    test('should redirect on successful update', async () => {
      const mockForCrumbs = () => {}
      const { cookieCrumb, viewCrumb } = await getCrumbs(
        mockForCrumbs,
        server,
        '/admin/payments/1/edit',
        {
          strategy: 'session',
          credentials: {
            scope: ['MPDP.Admin'],
            sessionId: 'test-session-id'
          }
        }
      )

      const options = {
        method: 'POST',
        url: '/admin/payments/1/edit',
        payload: {
          payeeName: 'Updated Payee',
          partPostcode: 'SW1A',
          town: 'London',
          amount: 2000,
          financialYear: '23/24',
          crumb: viewCrumb
        },
        headers: {
          cookie: `crumb=${cookieCrumb}`
        },
        auth: {
          strategy: 'session',
          credentials: {
            scope: ['MPDP.Admin'],
            sessionId: 'test-session-id'
          }
        }
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_FOUND)
      expect(response.headers.location).toContain('/admin/payments')
      expect(response.headers.location).toContain('success=updated')
    })
  })

  describe('GET /admin/payments/{id}/delete', () => {
    test('should return status code 200', async () => {
      const options = getOptions('admin/payments/1/delete', 'GET')
      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
    })

    test('should display payment details for confirmation', async () => {
      const options = getOptions('admin/payments/1/delete', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('.govuk-summary-list').text()).toContain('Test Payee 1')
      expect($('.govuk-warning-text').text().toLowerCase()).toContain('cannot be undone')
    })

    test('should return 404 for non-existent payment', async () => {
      const options = getOptions('admin/payments/999/delete', 'GET')
      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_NOT_FOUND)
    })
  })

  describe('POST /admin/payments/{id}/delete', () => {
    test('should redirect on successful deletion', async () => {
      const mockForCrumbs = () => {}
      const { cookieCrumb, viewCrumb } = await getCrumbs(
        mockForCrumbs,
        server,
        '/admin/payments/1/delete',
        {
          strategy: 'session',
          credentials: {
            scope: ['MPDP.Admin'],
            sessionId: 'test-session-id'
          }
        }
      )

      const options = {
        method: 'POST',
        url: '/admin/payments/1/delete',
        payload: {
          crumb: viewCrumb
        },
        headers: {
          cookie: `crumb=${cookieCrumb}`
        },
        auth: {
          strategy: 'session',
          credentials: {
            scope: ['MPDP.Admin'],
            sessionId: 'test-session-id'
          }
        }
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_FOUND)
      expect(response.headers.location).toContain('/admin/payments')
      expect(response.headers.location).toContain('success=deleted')
    })
  })

  describe('GET /admin/payments/bulk-upload', () => {
    test('should return status code 200', async () => {
      const options = getOptions('admin/payments/bulk-upload', 'GET')
      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
    })

    test('should display file upload form', async () => {
      const options = getOptions('admin/payments/bulk-upload', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('form[action="/admin/payments/bulk-upload"]').length).toBeGreaterThan(0)
      expect($('input[type="file"][name="file"]').length).toBeGreaterThan(0)
      expect($('form').attr('enctype')).toBe('multipart/form-data')
    })

    test('should display CSV format guidance', async () => {
      const options = getOptions('admin/payments/bulk-upload', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('.govuk-details__text').text()).toContain('CSV')
      expect($('.govuk-details__text').text()).toContain('payee_name')
    })
  })

  describe('GET /admin/payments/delete-by-year', () => {
    test('should return status code 200', async () => {
      const options = getOptions('admin/payments/delete-by-year', 'GET')
      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
    })

    test('should display financial year selection', async () => {
      const options = getOptions('admin/payments/delete-by-year', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('input[name="financialYear"]').length).toBeGreaterThan(0)
      expect($('.govuk-radios').text()).toContain('23/24')
      expect($('.govuk-radios').text()).toContain('22/23')
    })

    test('should display confirmation checkbox', async () => {
      const options = getOptions('admin/payments/delete-by-year', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('input[name="confirm"]').length).toBeGreaterThan(0)
      expect($('.govuk-checkboxes').text().toLowerCase()).toContain('cannot be undone')
    })

    test('should display warning text', async () => {
      const options = getOptions('admin/payments/delete-by-year', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('.govuk-warning-text').text()).toContain('permanent')
      expect($('.govuk-warning-text').text()).toContain('cannot be undone')
    })
  })

  describe('POST /admin/payments/delete-by-year', () => {
    test('should display success page on successful deletion', async () => {
      const mockForCrumbs = () => {}
      const { cookieCrumb, viewCrumb } = await getCrumbs(
        mockForCrumbs,
        server,
        '/admin/payments/delete-by-year',
        {
          strategy: 'session',
          credentials: {
            scope: ['MPDP.Admin'],
            sessionId: 'test-session-id'
          }
        }
      )

      const options = {
        method: 'POST',
        url: '/admin/payments/delete-by-year',
        payload: {
          financialYear: '23/24',
          confirm: 'yes',
          crumb: viewCrumb
        },
        headers: {
          cookie: `crumb=${cookieCrumb}`
        },
        auth: {
          strategy: 'session',
          credentials: {
            scope: ['MPDP.Admin'],
            sessionId: 'test-session-id'
          }
        }
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
      expect(response.payload).toContain('Deletion Complete')
      expect(response.payload).toContain('50')
      expect(response.payload).toContain('5')
    })

    test('should return 400 without confirmation', async () => {
      const mockForCrumbs = () => {}
      const { cookieCrumb, viewCrumb } = await getCrumbs(
        mockForCrumbs,
        server,
        '/admin/payments/delete-by-year',
        {
          strategy: 'session',
          credentials: {
            scope: ['MPDP.Admin'],
            sessionId: 'test-session-id'
          }
        }
      )

      const options = {
        method: 'POST',
        url: '/admin/payments/delete-by-year',
        payload: {
          financial_year: '23/24',
          crumb: viewCrumb
        },
        headers: {
          cookie: `crumb=${cookieCrumb}`
        },
        auth: {
          strategy: 'session',
          credentials: {
            scope: ['MPDP.Admin'],
            sessionId: 'test-session-id'
          }
        }
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_BAD_REQUEST)
    })
  })
})
