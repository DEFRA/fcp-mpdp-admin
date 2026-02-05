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
          financialYear: Joi.string().max(8).required(),
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
        const { financialYear } = request.payload
        const result = await deletePaymentsByYear(financialYear)
        return h.view('admin/delete-by-year-success', {
          pageTitle: 'Deletion Complete',
          financialYear,
          result
        })
      }
    }
  }
]
