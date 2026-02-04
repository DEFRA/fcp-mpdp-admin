import http2 from 'node:http2'
import Joi from 'joi'
import { fetchFinancialYears, deletePaymentsByYear } from '../../services/admin-service.js'

const { constants: httpConstants } = http2

export const deleteByYear = [
  {
    method: 'GET',
    path: '/admin/payments/delete-by-year',
    handler: async function (_request, h) {
      const years = await fetchFinancialYears()

      return h.view('admin/delete-by-year', {
        pageTitle: 'Delete Payments by Financial Year',
        years
      })
    }
  },
  {
    method: 'POST',
    path: '/admin/payments/delete-by-year',
    options: {
      validate: {
        payload: Joi.object({
          financial_year: Joi.string().max(8).required(),
          confirm: Joi.string().valid('yes').required()
        }),
        failAction: async function (request, h, error) {
          const years = await fetchFinancialYears()
          return h.view('admin/delete-by-year', {
            pageTitle: 'Delete Payments by Financial Year',
            years,
            errorList: error.details.map(detail => ({ text: detail.message })),
            ...request.payload
          }).code(httpConstants.HTTP_STATUS_BAD_REQUEST).takeover()
        }
      },
      handler: async function (request, h) {
        const { financial_year: financialYear } = request.payload

        try {
          request.logger.info(`Attempting to delete payments for year: ${financialYear}`)
          const result = await deletePaymentsByYear(financialYear)
          request.logger.info('Deletion successful:', result)
          return h.view('admin/delete-by-year-success', {
            pageTitle: 'Deletion Complete',
            financial_year: financialYear,
            result
          })
        } catch (err) {
          request.logger.error('Delete by year error:', err)
          const years = await fetchFinancialYears()
          return h.view('admin/delete-by-year', {
            pageTitle: 'Delete Payments by Financial Year',
            years,
            financial_year: financialYear,
            errorList: [{ text: 'Failed to delete payments. Please try again.' }]
          }).code(httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR)
        }
      }
    }
  }
]
