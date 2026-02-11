import http2 from 'node:http2'
import Joi from 'joi'
import { fetchFinancialYears, bulkSetPublishedDate } from '../../services/admin-service.js'

const { constants: httpConstants } = http2

function parseDateFromComponents (day, month, year) {
  if (!day || !month || !year) {
    return null
  }

  const paddedDay = String(day).padStart(2, '0')
  const paddedMonth = String(month).padStart(2, '0')
  return `${year}-${paddedMonth}-${paddedDay}`
}

export const bulkSetPublishedDateRoutes = [
  {
    method: 'GET',
    path: '/admin/payments/bulk-set-published-date',
    options: {
      auth: { scope: ['MPDP.Admin'] }
    },
    handler: async function (_request, h) {
      const years = await fetchFinancialYears()

      return h.view('admin/bulk-set-published-date', {
        pageTitle: 'Bulk Set Published Date',
        years
      })
    }
  },
  {
    method: 'POST',
    path: '/admin/payments/bulk-set-published-date',
    options: {
      auth: { scope: ['MPDP.Admin'] },
      validate: {
        payload: Joi.object({
          financialYear: Joi.string().max(8).required(),
          'publishedDate-day': Joi.number().integer().min(1).max(31).required(),
          'publishedDate-month': Joi.number().integer().min(1).max(12).required(),
          'publishedDate-year': Joi.number().integer().min(1900).max(2100).required()
        }),
        failAction: async function (request, h, error) {
          const years = await fetchFinancialYears()
          const errors = {}
          error.details.forEach(detail => {
            errors[detail.path[0]] = detail.message
          })

          return h.view('admin/bulk-set-published-date', {
            pageTitle: 'Bulk Set Published Date',
            years,
            errorList: error.details.map(detail => ({
              text: detail.message,
              href: `#${detail.path[0]}`
            })),
            errors,
            ...request.payload
          }).code(httpConstants.HTTP_STATUS_BAD_REQUEST).takeover()
        }
      },
      handler: async function (request, h) {
        const { financialYear, 'publishedDate-day': publishedDateDay, 'publishedDate-month': publishedDateMonth, 'publishedDate-year': publishedDateYear } = request.payload
        const publishedDate = parseDateFromComponents(publishedDateDay, publishedDateMonth, publishedDateYear)

        const result = await bulkSetPublishedDate(financialYear, publishedDate)
        return h.view('admin/bulk-set-published-date-success', {
          pageTitle: 'Published Date Updated',
          financialYear,
          publishedDate,
          result
        })
      }
    }
  }
]
