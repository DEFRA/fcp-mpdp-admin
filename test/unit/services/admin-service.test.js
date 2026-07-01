import { describe, beforeEach, afterEach, test, expect, vi } from 'vitest'
import {
  fetchAdminPayments,
  fetchPaymentById,
  createPayment,
  updatePayment,
  deletePaymentById,
  fetchFinancialYears,
  deletePaymentsByYear,
  deletePaymentsByPublishedDate,
  uploadPaymentsCsv
} from '../../../src/services/admin-service.js'
import * as apiGet from '../../../src/api/get.js'
import * as apiPost from '../../../src/api/post.js'
import { config } from '../../../src/config/config.js'

vi.mock('../../../src/api/get.js')
vi.mock('../../../src/api/post.js')
vi.mock('../../../src/api/get-backend-auth-headers.js', () => ({
  getBackendAuthHeaders: vi.fn().mockReturnValue({})
}))

const endpoint = 'https://__TEST_ENDPOINT__'
process.env.MPDP_BACKEND_ENDPOINT = endpoint
const path = process.env.MPDP_BACKEND_PATH

describe('admin-service', () => {
  beforeEach(() => {
    config.load({})
    config.validate({ allowed: 'strict' })

    vi.spyOn(config, 'get').mockImplementation(key => {
      if (key === 'backend.endpoint') { return endpoint }
      if (key === 'backend.path') { return path }
      return config[key]
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  describe('fetchAdminPayments', () => {
    test('should return paginated payments', async () => {
      const mockData = {
        count: 100,
        rows: [
          { id: 1, payee_name: 'Test 1', amount: 1000 },
          { id: 2, payee_name: 'Test 2', amount: 2000 }
        ],
        page: 1,
        totalPages: 5
      }

      apiGet.get.mockResolvedValue(mockData)

      const result = await fetchAdminPayments(1, 20, '')

      expect(result.count).toBe(100)
      expect(result.rows[0].payeeName).toBe('Test 1')
      expect(result.rows[1].payeeName).toBe('Test 2')
      expect(apiGet.get).toHaveBeenCalledWith(
        expect.stringContaining('admin/payments')
      )
    })

    test('should include search string in request', async () => {
      const mockData = { count: 10, rows: [], page: 1, totalPages: 1 }

      apiGet.get.mockResolvedValue(mockData)

      await fetchAdminPayments(1, 20, 'test search')

      expect(apiGet.get).toHaveBeenCalledWith(
        expect.stringContaining('searchString=test')
      )
    })
  })

  describe('fetchPaymentById', () => {
    test('should return payment data', async () => {
      const mockPayment = {
        id: 1,
        payee_name: 'Test Payee',
        part_postcode: 'SW1A',
        amount: 1000
      }

      apiGet.get.mockResolvedValue(mockPayment)

      const result = await fetchPaymentById(1)

      expect(result.payeeName).toBe('Test Payee')
      expect(result.partPostcode).toBe('SW1A')
      expect(result.amount).toBe(1000)
      expect(apiGet.get).toHaveBeenCalledWith(
        expect.stringContaining('admin/payments/1')
      )
    })
  })

  describe('createPayment', () => {
    test('should create a new payment with camelCase input and return mapped response', async () => {
      const paymentData = {
        payeeName: 'Test Payee',
        partPostcode: 'SW1A',
        amount: 1000,
        financialYear: '23/24'
      }
      const apiResponse = {
        id: 1,
        payee_name: 'Test Payee',
        part_postcode: 'SW1A',
        amount: 1000,
        financial_year: '23/24'
      }

      apiPost.post.mockResolvedValue(apiResponse)

      const result = await createPayment(paymentData)

      expect(result.payeeName).toBe('Test Payee')
      expect(result.partPostcode).toBe('SW1A')
      expect(apiPost.post).toHaveBeenCalledWith(
        expect.stringContaining('admin/payments'),
        expect.objectContaining({
          payee_name: 'Test Payee',
          part_postcode: 'SW1A'
        })
      )
    })
  })

  describe('updatePayment', () => {
    test('should update a payment with camelCase input', async () => {
      const paymentData = {
        payeeName: 'Updated Payee',
        amount: 2000
      }
      const apiResponse = {
        id: 1,
        payee_name: 'Updated Payee',
        part_postcode: '',
        town: '',
        parliamentary_constituency: '',
        county_council: '',
        scheme: '',
        amount: 2000,
        financial_year: undefined,
        payment_date: null,
        scheme_detail: '',
        activity_level: ''
      }

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 200,
        json: () => Promise.resolve(apiResponse)
      }))

      const result = await updatePayment(1, paymentData)

      expect(result.payeeName).toBe('Updated Payee')
      expect(result.amount).toBe(2000)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/payments/1'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' })
        })
      )
      const payloadSent = JSON.parse(fetch.mock.calls[0][1].body)
      expect(payloadSent.payee_name).toBe('Updated Payee')
      expect(payloadSent.amount).toBe(2000)
    })

    test('should throw error if update fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 404,
        json: () => Promise.resolve({})
      }))

      await expect(updatePayment(999, {})).rejects.toThrow('Failed to update payment')
    })
  })

  describe('deletePaymentById', () => {
    test('should delete a payment', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ deleted: true })
      }))

      const result = await deletePaymentById(1)

      expect(result).toEqual({ deleted: true })
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/payments/1'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    test('should throw error if deletion fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 404,
        json: () => Promise.resolve({})
      }))

      await expect(deletePaymentById(999)).rejects.toThrow('Failed to delete payment')
    })
  })

  describe('fetchFinancialYears', () => {
    test('should return list of financial years', async () => {
      const mockYears = ['23/24', '22/23', '21/22']

      apiGet.get.mockResolvedValue(mockYears)

      const result = await fetchFinancialYears()

      expect(result).toEqual(mockYears)
      expect(apiGet.get).toHaveBeenCalledWith(
        expect.stringContaining('admin/financial-years')
      )
    })
  })

  describe('deletePaymentsByYear', () => {
    test('should delete payments by financial year', async () => {
      const mockResult = {
        deleted: true,
        paymentCount: 50,
        schemeCount: 5
      }

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 200,
        json: () => Promise.resolve(mockResult)
      }))

      const result = await deletePaymentsByYear('23/24')

      expect(result).toEqual(mockResult)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/payments/year/23%2F24'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    test('should URL-encode financial year', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ deleted: true })
      }))

      await deletePaymentsByYear('22/23')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('22%2F23'),
        expect.anything()
      )
    })

    test('should throw error if deletion fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 500,
        json: () => Promise.resolve({})
      }))

      await expect(deletePaymentsByYear('23/24')).rejects.toThrow('Failed to delete payments')
    })
  })

  describe('deletePaymentsByPublishedDate', () => {
    test('should delete payments by published date', async () => {
      const mockResult = {
        deleted: true,
        paymentCount: 100
      }

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 200,
        json: () => Promise.resolve(mockResult)
      }))

      const result = await deletePaymentsByPublishedDate('2024-01-15')

      expect(result).toEqual(mockResult)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/payments/published-date/2024-01-15'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    test('should handle different date formats', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ deleted: true, paymentCount: 50 })
      }))

      await deletePaymentsByPublishedDate('2023-12-31')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('2023-12-31'),
        expect.anything()
      )
    })

    test('should throw error if deletion fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 500,
        json: () => Promise.resolve({})
      }))

      await expect(deletePaymentsByPublishedDate('2024-01-15')).rejects.toThrow('Failed to delete payments by published date')
    })
  })

  describe('uploadPaymentsCsv', () => {
    test('should upload CSV file', async () => {
      const mockResult = {
        success: true,
        imported: 10,
        errors: []
      }

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 201,
        json: () => Promise.resolve(mockResult)
      }))

      async function * mockData () { yield Buffer.from('csv-content') }
      const result = await uploadPaymentsCsv(mockData())

      expect(result).toEqual(mockResult)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/payments/bulk-upload'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'text/csv' })
        })
      )
    })

    test('should throw error if upload fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({})
      }))

      async function * emptyData () {}
      await expect(uploadPaymentsCsv(emptyData())).rejects.toThrow('Failed to upload CSV')
    })
  })
})
