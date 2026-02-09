import { describe, test, expect } from 'vitest'
import { toViewModel, toApiModel, paymentsToViewModel } from '../../../../src/services/mappers/payment-mapper.js'

describe('payment-mapper', () => {
  describe('toViewModel', () => {
    test('should return null when payment is null', () => {
      const result = toViewModel(null)
      expect(result).toBeNull()
    })

    test('should return null when payment is undefined', () => {
      const result = toViewModel(undefined)
      expect(result).toBeNull()
    })

    test('should map payment to view model with all fields', () => {
      const payment = {
        id: 1,
        payee_name: 'John Doe',
        part_postcode: 'SW1A',
        town: 'London',
        parliamentary_constituency: 'Westminster',
        county_council: 'Greater London',
        scheme: 'SFI',
        amount: 1000.50,
        financial_year: '23/24',
        payment_date: '2024-03-15',
        scheme_detail: 'Sustainable Farming',
        activity_level: 'High'
      }

      const result = toViewModel(payment)

      expect(result).toEqual({
        id: 1,
        payeeName: 'John Doe',
        partPostcode: 'SW1A',
        town: 'London',
        parliamentaryConstituency: 'Westminster',
        countyCouncil: 'Greater London',
        scheme: 'SFI',
        amount: 1000.50,
        financialYear: '23/24',
        paymentDate: '2024-03-15',
        schemeDetail: 'Sustainable Farming',
        activityLevel: 'High'
      })
    })

    test('should handle missing optional fields with empty strings', () => {
      const payment = {
        id: 1,
        payee_name: 'John Doe',
        part_postcode: 'SW1A',
        amount: 1000,
        financial_year: '23/24',
        payment_date: '2024-03-15'
      }

      const result = toViewModel(payment)

      expect(result.town).toBe('')
      expect(result.parliamentaryConstituency).toBe('')
      expect(result.countyCouncil).toBe('')
      expect(result.scheme).toBe('')
      expect(result.schemeDetail).toBe('')
      expect(result.activityLevel).toBe('')
    })
  })

  describe('toApiModel', () => {
    test('should map view model to API model with all fields', () => {
      const viewModel = {
        payeeName: 'John Doe',
        partPostcode: 'SW1A',
        town: 'London',
        parliamentaryConstituency: 'Westminster',
        countyCouncil: 'Greater London',
        scheme: 'SFI',
        amount: 1000.50,
        financialYear: '23/24',
        paymentDate: '2024-03-15',
        schemeDetail: 'Sustainable Farming',
        activityLevel: 'High'
      }

      const result = toApiModel(viewModel)

      expect(result).toEqual({
        payee_name: 'John Doe',
        part_postcode: 'SW1A',
        town: 'London',
        parliamentary_constituency: 'Westminster',
        county_council: 'Greater London',
        scheme: 'SFI',
        amount: 1000.50,
        financial_year: '23/24',
        payment_date: '2024-03-15',
        scheme_detail: 'Sustainable Farming',
        activity_level: 'High'
      })
    })

    test('should handle missing optional fields with empty strings', () => {
      const viewModel = {
        payeeName: 'John Doe',
        partPostcode: 'SW1A',
        amount: 1000,
        financialYear: '23/24'
      }

      const result = toApiModel(viewModel)

      expect(result.town).toBe('')
      expect(result.parliamentary_constituency).toBe('')
      expect(result.county_council).toBe('')
      expect(result.scheme).toBe('')
      expect(result.scheme_detail).toBe('')
      expect(result.activity_level).toBe('')
    })

    test('should convert null paymentDate to null', () => {
      const viewModel = {
        payeeName: 'John Doe',
        partPostcode: 'SW1A',
        amount: 1000,
        financialYear: '23/24',
        paymentDate: null
      }

      const result = toApiModel(viewModel)

      expect(result.payment_date).toBeNull()
    })

    test('should convert undefined paymentDate to null', () => {
      const viewModel = {
        payeeName: 'John Doe',
        partPostcode: 'SW1A',
        amount: 1000,
        financialYear: '23/24'
      }

      const result = toApiModel(viewModel)

      expect(result.payment_date).toBeNull()
    })
  })

  describe('paymentsToViewModel', () => {
    test('should map paginated payments response to view model', () => {
      const paymentsResponse = {
        count: 100,
        rows: [
          {
            id: 1,
            payee_name: 'John Doe',
            part_postcode: 'SW1A',
            town: 'London',
            scheme: 'SFI',
            amount: 1000,
            financial_year: '23/24',
            payment_date: '2024-03-15'
          },
          {
            id: 2,
            payee_name: 'Jane Smith',
            part_postcode: 'NE1',
            town: 'Newcastle',
            scheme: 'CS',
            amount: 2000,
            financial_year: '23/24',
            payment_date: '2024-03-16'
          }
        ],
        page: 1,
        totalPages: 5
      }

      const result = paymentsToViewModel(paymentsResponse)

      expect(result.count).toBe(100)
      expect(result.page).toBe(1)
      expect(result.totalPages).toBe(5)
      expect(result.rows).toHaveLength(2)
      expect(result.rows[0].payeeName).toBe('John Doe')
      expect(result.rows[1].payeeName).toBe('Jane Smith')
    })

    test('should handle empty payments response', () => {
      const paymentsResponse = {
        count: 0,
        rows: [],
        page: 1,
        totalPages: 0
      }

      const result = paymentsToViewModel(paymentsResponse)

      expect(result.count).toBe(0)
      expect(result.page).toBe(1)
      expect(result.totalPages).toBe(0)
      expect(result.rows).toHaveLength(0)
    })
  })
})
