import { describe, beforeAll, afterAll, beforeEach, test, expect, vi } from 'vitest'
import * as cheerio from 'cheerio'
import http2 from 'node:http2'
import '../../helpers/setup-server-mocks.js'
import { getOptions } from '../../../../utils/helpers.js'

const { constants: httpConstants } = http2
const { createServer } = await import('../../../../../src/server.js')

vi.mock('../../../../../src/services/admin-service.js', async () => {
  const actual = await vi.importActual('../../../../../src/services/admin-service.js')
  return {
    ...actual,
    uploadPaymentsCsv: vi.fn(async () => ({
      success: true,
      imported: 5,
      errors: []
    }))
  }
})

describe('Bulk upload routes', () => {
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

  describe('GET /admin/payments/bulk-upload', () => {
    test('should return status code 200', async () => {
      const options = getOptions('admin/payments/bulk-upload', 'GET')
      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
    })

    test('should display page title', async () => {
      const options = getOptions('admin/payments/bulk-upload', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('h1').text()).toContain('Bulk Upload Payments')
    })

    test('should display file upload input', async () => {
      const options = getOptions('admin/payments/bulk-upload', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      expect($('input[type="file"]').length).toBeGreaterThan(0)
    })

    test('should display download upload template link', async () => {
      const options = getOptions('admin/payments/bulk-upload', 'GET')
      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      const templateLink = $('a[href="/admin/payments/bulk-upload/template"]')
      expect(templateLink.length).toBe(1)
      expect(templateLink.text()).toBe('Download upload template')
    })
  })

  describe('GET /admin/payments/bulk-upload/template', () => {
    test('should return status code 200', async () => {
      const options = getOptions('admin/payments/bulk-upload/template', 'GET')
      const response = await server.inject(options)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
    })

    test('should return csv content type', async () => {
      const options = getOptions('admin/payments/bulk-upload/template', 'GET')
      const response = await server.inject(options)

      expect(response.headers['content-type']).toContain('text/csv')
    })

    test('should return content disposition header for file download', async () => {
      const options = getOptions('admin/payments/bulk-upload/template', 'GET')
      const response = await server.inject(options)

      expect(response.headers['content-disposition']).toContain('attachment')
      expect(response.headers['content-disposition']).toContain('.csv')
    })

    test('should return csv with correct headers', async () => {
      const options = getOptions('admin/payments/bulk-upload/template', 'GET')
      const response = await server.inject(options)

      const expectedHeaders = 'payee_name,part_postcode,town,parliamentary_constituency,county_council,scheme,amount,financial_year,payment_date,scheme_detail,activity_level'
      expect(response.payload.trim()).toBe(expectedHeaders)
    })

    test('should return only the header row with no data rows', async () => {
      const options = getOptions('admin/payments/bulk-upload/template', 'GET')
      const response = await server.inject(options)

      const lines = response.payload.trim().split('\n')
      expect(lines).toHaveLength(1)
    })
  })
})
