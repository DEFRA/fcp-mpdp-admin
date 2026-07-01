import { describe, test, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import * as cheerio from 'cheerio'
import http2 from 'node:http2'
import '../../helpers/setup-server-mocks.js'

const { constants: httpConstants } = http2

process.env.MPDP_BACKEND_ENDPOINT = 'http://localhost:3001'

vi.mock('../../../../../src/services/admin-service.js', () => ({
  fetchAdminPayments: vi.fn(async () => ({ count: 0, rows: [], page: 1, totalPages: 0 })),
  fetchPublishedDateTotals: vi.fn(async () => [])
}))

const { createServer } = await import('../../../../../src/server.js')
const adminService = await import('../../../../../src/services/admin-service.js')

describe('Published date totals route', () => {
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

  const authedGet = {
    method: 'GET',
    url: '/admin/payments/published-date-totals',
    auth: {
      strategy: 'session',
      credentials: { scope: ['MPDP.Admin'], sessionId: 'test-session-id' }
    }
  }

  describe('GET /admin/payments/published-date-totals', () => {
    test('should return 200', async () => {
      const response = await server.inject(authedGet)
      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
    })

    test('should display page title', async () => {
      const response = await server.inject(authedGet)
      const $ = cheerio.load(response.payload)
      expect($('h1').text()).toContain('Payment totals by published date')
    })

    test('should display table with dated records', async () => {
      adminService.fetchPublishedDateTotals.mockResolvedValue([
        { publishedDate: '2024-01-15', financialYear: '2023/24', count: '50' },
        { publishedDate: '2024-02-20', financialYear: '2022/23', count: '30' }
      ])

      const response = await server.inject(authedGet)
      const $ = cheerio.load(response.payload)

      expect($('table').length).toBeGreaterThan(0)
      expect($('table').text()).toContain('2024-01-15')
      expect($('table').text()).toContain('2023/24')
      expect($('table').text()).toContain('50')
      expect($('table').text()).toContain('2024-02-20')
    })

    test('should show "No date" for null published_date records', async () => {
      adminService.fetchPublishedDateTotals.mockResolvedValue([
        { publishedDate: '2024-01-15', financialYear: '2023/24', count: '50' },
        { publishedDate: null, financialYear: '2022/23', count: '10' }
      ])

      const response = await server.inject(authedGet)
      const $ = cheerio.load(response.payload)

      expect($('table').text()).toContain('No date')
    })

    test('should show delete link for dated rows but not for "No date" rows', async () => {
      adminService.fetchPublishedDateTotals.mockResolvedValue([
        { publishedDate: '2024-01-15', financialYear: '2023/24', count: '50' },
        { publishedDate: null, financialYear: '2022/23', count: '10' }
      ])

      const response = await server.inject(authedGet)
      const $ = cheerio.load(response.payload)

      const rows = $('table tbody tr')
      expect(rows.eq(0).text()).toContain('Delete')
      expect(rows.eq(0).find('a').attr('href')).toContain('/admin/payments/delete-by-published-date')
      expect(rows.eq(1).text()).not.toContain('Delete')
    })

    test('should show no records message when list is empty', async () => {
      adminService.fetchPublishedDateTotals.mockResolvedValue([])

      const response = await server.inject(authedGet)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
      expect(response.payload).toContain('No payment records found.')
    })

    test('should include a back link to manage payments', async () => {
      const response = await server.inject(authedGet)
      const $ = cheerio.load(response.payload)

      const backLink = $('a.govuk-back-link')
      expect(backLink.attr('href')).toBe('/admin/payments')
    })

    test('should redirect to login without authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/admin/payments/published-date-totals'
      })

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_FOUND)
    })

    test('should call fetchPublishedDateTotals service function', async () => {
      adminService.fetchPublishedDateTotals.mockResolvedValue([
        { publishedDate: '2024-01-15', financialYear: '2023/24', count: '50' }
      ])

      await server.inject(authedGet)

      expect(adminService.fetchPublishedDateTotals).toHaveBeenCalledTimes(1)
    })
  })
})
