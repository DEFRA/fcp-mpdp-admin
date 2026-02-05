import { describe, beforeEach, afterEach, test, expect, vi } from 'vitest'
import Wreck from '@hapi/wreck'
import {
  fetchAdminPayments,
  fetchPaymentById,
  createPayment,
  updatePayment,
  deletePaymentById,
  fetchFinancialYears,
  deletePaymentsByYear,
  uploadPaymentsCsv
} from '../../../src/services/admin-service.js'
import { config } from '../../../src/config/config.js'

const endpoint = 'https://__TEST_ENDPOINT__'
process.env.MPDP_BACKEND_ENDPOINT = endpoint
const path = process.env.MPDP_BACKEND_PATH

describe('admin-service', () => {
  beforeEach(() => {
    config.load({})
    config.validate({ allowed: 'strict' })

    vi.spyOn(config, 'get').mockImplementation(key => {
      if (key === 'backend.endpoint') return endpoint
      if (key === 'backend.path') return path
      return config[key]
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('fetchAdminPayments', () => {
    test('should return empty results if no response received', async () => {
      const mockGet = vi.fn().mockResolvedValue(null)
      vi.spyOn(Wreck, 'get').mockImplementation(mockGet)

      const result = await fetchAdminPayments(1, 20, '')

      expect(result).toMatchObject({
        count: 0,
        rows: [],
        page: 1,
        totalPages: 0
      })
    })

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

      const mockGet = vi.fn().mockResolvedValue({
        res: { statusCode: 200 },
        payload: JSON.stringify(mockData)
      })
      vi.spyOn(Wreck, 'get').mockImplementation(mockGet)

      const result = await fetchAdminPayments(1, 20, '')

      expect(result.count).toBe(100)
      expect(result.rows[0].payeeName).toBe('Test 1')
      expect(result.rows[1].payeeName).toBe('Test 2')
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('admin/payments')
      )
    })

    test('should include search string in request', async () => {
      const mockData = { count: 10, rows: [], page: 1, totalPages: 1 }

      const mockGet = vi.fn().mockResolvedValue({
        res: { statusCode: 200 },
        payload: JSON.stringify(mockData)
      })
      vi.spyOn(Wreck, 'get').mockImplementation(mockGet)

      await fetchAdminPayments(1, 20, 'test search')

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('searchString=test')
      )
    })
  })

  describe('fetchPaymentById', () => {
    test('should return null if no response received', async () => {
      const mockGet = vi.fn().mockResolvedValue(null)
      vi.spyOn(Wreck, 'get').mockImplementation(mockGet)

      const result = await fetchPaymentById(1)

      expect(result).toBeNull()
    })

    test('should return payment data', async () => {
      const mockPayment = {
        id: 1,
        payee_name: 'Test Payee',
        part_postcode: 'SW1A',
        amount: 1000
      }

      const mockGet = vi.fn().mockResolvedValue({
        res: { statusCode: 200 },
        payload: JSON.stringify(mockPayment)
      })
      vi.spyOn(Wreck, 'get').mockImplementation(mockGet)

      const result = await fetchPaymentById(1)

      expect(result.payeeName).toBe('Test Payee')
      expect(result.partPostcode).toBe('SW1A')
      expect(result.amount).toBe(1000)
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('admin/payments/1')
      )
    })
  })

  describe('createPayment', () => {
    test('should throw if no response received', async () => {
      const mockPost = vi.fn().mockResolvedValue(null)
      vi.spyOn(Wreck, 'post').mockImplementation(mockPost)

      await expect(createPayment({})).rejects.toThrow('Failed to create payment')
    })

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

      const mockPost = vi.fn().mockResolvedValue({
        res: { statusCode: 201 },
        payload: JSON.stringify(apiResponse)
      })
      vi.spyOn(Wreck, 'post').mockImplementation(mockPost)

      const result = await createPayment(paymentData)

      expect(result.payeeName).toBe('Test Payee')
      expect(result.partPostcode).toBe('SW1A')
      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('admin/payments'),
        expect.objectContaining({
          payload: expect.objectContaining({
            payee_name: 'Test Payee',
            part_postcode: 'SW1A'
          })
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
        amount: 2000
      }

      const mockPut = vi.fn().mockResolvedValue({
        res: { statusCode: 200 },
        payload: Buffer.from(JSON.stringify(apiResponse))
      })
      vi.spyOn(Wreck, 'put').mockImplementation(mockPut)

      const result = await updatePayment(1, paymentData)

      expect(result.payeeName).toBe('Updated Payee')
      expect(result.amount).toBe(2000)
      expect(mockPut).toHaveBeenCalledWith(
        expect.stringContaining('/admin/payments/1'),
        expect.objectContaining({
          payload: JSON.stringify(paymentData),
          headers: { 'Content-Type': 'application/json' }
        })
      )
    })

    test('should throw error if update fails', async () => {
      const mockPut = vi.fn().mockResolvedValue({
        res: { statusCode: 404 },
        payload: Buffer.from('{}')
      })
      vi.spyOn(Wreck, 'put').mockImplementation(mockPut)

      await expect(updatePayment(999, {})).rejects.toThrow('Failed to update payment')
    })
  })

  describe('deletePaymentById', () => {
    test('should delete a payment', async () => {
      const mockDelete = vi.fn().mockResolvedValue({
        res: { statusCode: 200 },
        payload: Buffer.from(JSON.stringify({ deleted: true }))
      })
      vi.spyOn(Wreck, 'delete').mockImplementation(mockDelete)

      const result = await deletePaymentById(1)

      expect(result).toEqual({ deleted: true })
      expect(mockDelete).toHaveBeenCalledWith(
        expect.stringContaining('/admin/payments/1')
      )
    })

    test('should throw error if deletion fails', async () => {
      const mockDelete = vi.fn().mockResolvedValue({
        res: { statusCode: 404 },
        payload: Buffer.from('{}')
      })
      vi.spyOn(Wreck, 'delete').mockImplementation(mockDelete)

      await expect(deletePaymentById(999)).rejects.toThrow('Failed to delete payment')
    })
  })

  describe('fetchFinancialYears', () => {
    test('should return empty array if no response received', async () => {
      const mockGet = vi.fn().mockResolvedValue(null)
      vi.spyOn(Wreck, 'get').mockImplementation(mockGet)

      const result = await fetchFinancialYears()

      expect(result).toEqual([])
    })

    test('should return list of financial years', async () => {
      const mockYears = ['23/24', '22/23', '21/22']

      const mockGet = vi.fn().mockResolvedValue({
        res: { statusCode: 200 },
        payload: JSON.stringify(mockYears)
      })
      vi.spyOn(Wreck, 'get').mockImplementation(mockGet)

      const result = await fetchFinancialYears()

      expect(result).toEqual(mockYears)
      expect(mockGet).toHaveBeenCalledWith(
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

      const mockDelete = vi.fn().mockResolvedValue({
        res: { statusCode: 200 },
        payload: Buffer.from(JSON.stringify(mockResult))
      })
      vi.spyOn(Wreck, 'delete').mockImplementation(mockDelete)

      const result = await deletePaymentsByYear('23/24')

      expect(result).toEqual(mockResult)
      expect(mockDelete).toHaveBeenCalledWith(
        expect.stringContaining('/admin/payments/year/23%2F24')
      )
    })

    test('should URL-encode financial year', async () => {
      const mockDelete = vi.fn().mockResolvedValue({
        res: { statusCode: 200 },
        payload: Buffer.from(JSON.stringify({ deleted: true }))
      })
      vi.spyOn(Wreck, 'delete').mockImplementation(mockDelete)

      await deletePaymentsByYear('22/23')

      expect(mockDelete).toHaveBeenCalledWith(
        expect.stringContaining('22%2F23')
      )
    })

    test('should throw error if deletion fails', async () => {
      const mockDelete = vi.fn().mockResolvedValue({
        res: { statusCode: 500 },
        payload: Buffer.from('{}')
      })
      vi.spyOn(Wreck, 'delete').mockImplementation(mockDelete)

      await expect(deletePaymentsByYear('23/24')).rejects.toThrow('Failed to delete payments')
    })
  })

  describe('uploadPaymentsCsv', () => {
    test('should upload CSV file', async () => {
      const mockResult = {
        success: true,
        imported: 10,
        errors: []
      }

      const mockPost = vi.fn().mockResolvedValue({
        res: { statusCode: 201 },
        payload: Buffer.from(JSON.stringify(mockResult))
      })
      vi.spyOn(Wreck, 'post').mockImplementation(mockPost)

      const mockStream = { pipe: vi.fn() }
      const result = await uploadPaymentsCsv(mockStream)

      expect(result).toEqual(mockResult)
      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('/admin/payments/bulk-upload'),
        expect.objectContaining({
          payload: mockStream,
          headers: { 'Content-Type': 'text/csv' }
        })
      )
    })

    test('should throw error if upload fails', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        res: { statusCode: 400 },
        payload: Buffer.from('{}')
      })
      vi.spyOn(Wreck, 'post').mockImplementation(mockPost)

      await expect(uploadPaymentsCsv({})).rejects.toThrow('Failed to upload CSV')
    })
  })
})
