import { describe, test, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import '../../helpers/setup-server-mocks.js'
import getCrumbs from '../../../../helpers/get-crumbs.js'

// Set environment variables before any imports that need config
process.env.MPDP_BACKEND_ENDPOINT = 'http://localhost:3001'

vi.mock('../../../../../src/api/build-backend-url.js', () => ({
  buildBackendUrl: vi.fn((path) => `http://localhost:3001${path}`)
}))

vi.mock('../../../../../src/services/payment-summary-service.js', () => {
  return {
    fetchPaymentSummaries: vi.fn(async () => []),
    fetchPaymentSummaryById: vi.fn(async () => null),
    createPaymentSummary: vi.fn(async (data) => ({ id: 1, ...data })),
    updatePaymentSummary: vi.fn(async (id, data) => ({ id, ...data })),
    deletePaymentSummaryById: vi.fn(async () => ({ deleted: true }))
  }
})

const { createServer } = await import('../../../../../src/server.js')
const paymentSummaryService = await import('../../../../../src/services/payment-summary-service.js')

describe('Payment Summary Admin Routes', () => {
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

  describe('GET /admin/summary', () => {
    test('should display payment summaries page with data', async () => {
      const mockSummaries = [
        { id: 1, financialYear: '2023', scheme: 'SFI', totalAmount: 10000 },
        { id: 2, financialYear: '2022', scheme: 'BPS', totalAmount: 15000 }
      ]

      paymentSummaryService.fetchPaymentSummaries.mockResolvedValue(mockSummaries)

      const options = {
        method: 'GET',
        url: '/admin/summary',
        auth: {
          strategy: 'session',
          credentials: {
            scope: ['MPDP.Admin'],
            sessionId: 'test-session-id'
          }
        }
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Manage payment summaries')
      expect(response.payload).toContain('2023')
      expect(response.payload).toContain('SFI')
      expect(paymentSummaryService.fetchPaymentSummaries).toHaveBeenCalledTimes(1)
    })

    test('should display empty message when no summaries exist', async () => {
      paymentSummaryService.fetchPaymentSummaries.mockResolvedValue([])

      const options = {
        method: 'GET',
        url: '/admin/summary',
        auth: {
          strategy: 'session',
          credentials: {
            scope: ['MPDP.Admin'],
            sessionId: 'test-session-id'
          }
        }
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('No payment summaries found')
    })
  })

  describe('GET /admin/summary/add', () => {
    test('should display add payment summary form', async () => {
      const options = {
        method: 'GET',
        url: '/admin/summary/add',
        auth: {
          strategy: 'session',
          credentials: {
            scope: ['MPDP.Admin'],
            sessionId: 'test-session-id'
          }
        }
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Add payment summary')
      expect(response.payload).toContain('financialYear')
      expect(response.payload).toContain('scheme')
      expect(response.payload).toContain('totalAmount')
    })
  })

  describe('POST /admin/summary/add', () => {
    test('should create payment summary with valid data', async () => {
      const mockCreated = {
        id: 1,
        financialYear: '2024',
        scheme: 'SFI',
        totalAmount: 25000
      }

      paymentSummaryService.createPaymentSummary.mockResolvedValue(mockCreated)

      const { cookieCrumb, viewCrumb } = await getCrumbs(
        () => {},
        server,
        '/admin/summary/add',
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
        url: '/admin/summary/add',
        payload: {
          financialYear: '2024',
          scheme: 'SFI',
          totalAmount: 25000,
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

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/admin/summary')
      expect(paymentSummaryService.createPaymentSummary).toHaveBeenCalledWith({
        financialYear: '2024',
        scheme: 'SFI',
        totalAmount: 25000
      })
    })

    test('should return 400 for missing required fields', async () => {
      const { cookieCrumb, viewCrumb } = await getCrumbs(
        () => {},
        server,
        '/admin/summary/add',
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
        url: '/admin/summary/add',
        payload: {
          financialYear: '2024',
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

      expect(response.statusCode).toBe(400)
      expect(response.payload).toContain('There is a problem')
    })
  })

  describe('GET /admin/summary/edit/{id}', () => {
    test('should display edit payment summary form', async () => {
      const mockSummary = {
        id: 1,
        financialYear: '2023',
        scheme: 'SFI',
        totalAmount: 10000
      }

      paymentSummaryService.fetchPaymentSummaryById.mockResolvedValue(mockSummary)

      const options = {
        method: 'GET',
        url: '/admin/summary/edit/1',
        auth: {
          strategy: 'session',
          credentials: {
            scope: ['MPDP.Admin'],
            sessionId: 'test-session-id'
          }
        }
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Edit payment summary')
      expect(response.payload).toContain('2023')
      expect(response.payload).toContain('SFI')
      expect(response.payload).toContain('10000')
      expect(paymentSummaryService.fetchPaymentSummaryById).toHaveBeenCalledWith('1')
    })
  })

  describe('POST /admin/summary/edit/{id}', () => {
    test('should update payment summary with valid data', async () => {
      const mockSummary = {
        id: 1,
        financialYear: '2023',
        scheme: 'SFI',
        totalAmount: 10000
      }

      const mockUpdated = {
        ...mockSummary,
        totalAmount: 12000
      }

      paymentSummaryService.fetchPaymentSummaryById.mockResolvedValue(mockSummary)
      paymentSummaryService.updatePaymentSummary.mockResolvedValue(mockUpdated)

      const { cookieCrumb, viewCrumb } = await getCrumbs(
        () => paymentSummaryService.fetchPaymentSummaryById.mockResolvedValue(mockSummary),
        server,
        '/admin/summary/edit/1',
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
        url: '/admin/summary/edit/1',
        payload: {
          financialYear: '2023',
          scheme: 'SFI',
          totalAmount: 12000,
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

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/admin/summary')
      expect(paymentSummaryService.updatePaymentSummary).toHaveBeenCalledWith('1', {
        financialYear: '2023',
        scheme: 'SFI',
        totalAmount: 12000
      })
    })
  })

  describe('GET /admin/summary/delete/{id}', () => {
    test('should display delete confirmation page', async () => {
      const mockSummary = {
        id: 1,
        financialYear: '2023',
        scheme: 'SFI',
        totalAmount: 10000
      }

      paymentSummaryService.fetchPaymentSummaryById.mockResolvedValue(mockSummary)

      const options = {
        method: 'GET',
        url: '/admin/summary/delete/1',
        auth: {
          strategy: 'session',
          credentials: {
            scope: ['MPDP.Admin'],
            sessionId: 'test-session-id'
          }
        }
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Delete payment summary')
      expect(response.payload).toContain('2023')
      expect(response.payload).toContain('SFI')
      expect(response.payload).toContain('cannot be undone')
      expect(paymentSummaryService.fetchPaymentSummaryById).toHaveBeenCalledWith('1')
    })
  })

  describe('POST /admin/summary/delete/{id}', () => {
    test('should delete payment summary', async () => {
      const mockSummary = {
        id: 1,
        financialYear: '2023',
        scheme: 'SFI',
        totalAmount: 10000
      }

      paymentSummaryService.fetchPaymentSummaryById.mockResolvedValue(mockSummary)
      paymentSummaryService.deletePaymentSummaryById.mockResolvedValue({ success: true })

      const { cookieCrumb, viewCrumb } = await getCrumbs(
        () => paymentSummaryService.fetchPaymentSummaryById.mockResolvedValue(mockSummary),
        server,
        '/admin/summary/delete/1',
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
        url: '/admin/summary/delete/1',
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

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/admin/summary')
      expect(paymentSummaryService.deletePaymentSummaryById).toHaveBeenCalledWith('1')
    })
  })
})
