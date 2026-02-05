import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  fetchPaymentSummaries,
  fetchPaymentSummaryById,
  createPaymentSummary,
  updatePaymentSummary,
  deletePaymentSummaryById
} from '../../../src/services/payment-summary-service.js'
import * as get from '../../../src/api/get.js'
import * as post from '../../../src/api/post.js'
import * as buildBackendUrl from '../../../src/api/build-backend-url.js'
import Wreck from '@hapi/wreck'

vi.mock('../../../src/api/get.js')
vi.mock('../../../src/api/post.js')
vi.mock('../../../src/api/build-backend-url.js')
vi.mock('@hapi/wreck')

describe('Payment Summary Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    buildBackendUrl.buildBackendUrl.mockImplementation((path) => `http://backend${path}`)
  })

  describe('fetchPaymentSummaries', () => {
    test('should fetch all payment summaries and convert to camelCase', async () => {
      const mockResponse = {
        payload: JSON.stringify([
          { id: 1, financial_year: '2023', scheme: 'SFI', total_amount: 10000 },
          { id: 2, financial_year: '2022', scheme: 'BPS', total_amount: 15000 }
        ])
      }

      get.get.mockResolvedValue(mockResponse)

      const result = await fetchPaymentSummaries()

      expect(get.get).toHaveBeenCalledWith('/admin/summary')
      expect(result).toEqual([
        { id: 1, financialYear: '2023', scheme: 'SFI', totalAmount: 10000 },
        { id: 2, financialYear: '2022', scheme: 'BPS', totalAmount: 15000 }
      ])
    })

    test('should return empty array when no summaries exist', async () => {
      get.get.mockResolvedValue({ payload: JSON.stringify([]) })

      const result = await fetchPaymentSummaries()

      expect(result).toEqual([])
    })
  })

  describe('fetchPaymentSummaryById', () => {
    test('should fetch payment summary by ID and convert to camelCase', async () => {
      const mockResponse = {
        payload: JSON.stringify({ id: 1, financial_year: '2023', scheme: 'SFI', total_amount: 10000 })
      }

      get.get.mockResolvedValue(mockResponse)

      const result = await fetchPaymentSummaryById(1)

      expect(get.get).toHaveBeenCalledWith('/admin/summary/1')
      expect(result).toEqual({
        id: 1,
        financialYear: '2023',
        scheme: 'SFI',
        totalAmount: 10000
      })
    })
  })

  describe('createPaymentSummary', () => {
    test('should create payment summary converting from camelCase to snake_case', async () => {
      const camelCaseData = {
        financialYear: '2024',
        scheme: 'SFI',
        totalAmount: 25000
      }

      const mockResponse = {
        payload: JSON.stringify({ id: 1, financial_year: '2024', scheme: 'SFI', total_amount: 25000 })
      }

      post.post.mockResolvedValue(mockResponse)

      const result = await createPaymentSummary(camelCaseData)

      expect(post.post).toHaveBeenCalledWith(
        '/admin/summary',
        { financial_year: '2024', scheme: 'SFI', total_amount: 25000 }
      )
      expect(result).toEqual({
        id: 1,
        financialYear: '2024',
        scheme: 'SFI',
        totalAmount: 25000
      })
    })
  })

  describe('updatePaymentSummary', () => {
    test('should update payment summary converting from camelCase to snake_case', async () => {
      const camelCaseData = {
        totalAmount: 12000
      }

      const mockResponse = {
        res: { statusCode: 200 },
        payload: JSON.stringify({ id: 1, financial_year: '2023', scheme: 'SFI', total_amount: 12000 })
      }

      buildBackendUrl.buildBackendUrl.mockReturnValue('http://backend/admin/summary/1')
      Wreck.put.mockResolvedValue(mockResponse)

      const result = await updatePaymentSummary(1, camelCaseData)

      expect(buildBackendUrl.buildBackendUrl).toHaveBeenCalledWith('/admin/summary/1')
      expect(Wreck.put).toHaveBeenCalledWith(
        'http://backend/admin/summary/1',
        {
          payload: JSON.stringify({ total_amount: 12000 }),
          headers: { 'Content-Type': 'application/json' }
        }
      )
      expect(result).toEqual({
        id: 1,
        financialYear: '2023',
        scheme: 'SFI',
        totalAmount: 12000
      })
    })
  })

  describe('deletePaymentSummaryById', () => {
    test('should delete payment summary by ID', async () => {
      const mockResponse = { res: { statusCode: 204 } }

      buildBackendUrl.buildBackendUrl.mockReturnValue('http://backend/admin/summary/1')
      Wreck.delete.mockResolvedValue(mockResponse)

      const result = await deletePaymentSummaryById(1)

      expect(buildBackendUrl.buildBackendUrl).toHaveBeenCalledWith('/admin/summary/1')
      expect(Wreck.delete).toHaveBeenCalledWith('http://backend/admin/summary/1')
      expect(result).toBe(true)
    })
  })
})
