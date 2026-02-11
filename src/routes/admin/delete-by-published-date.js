import http2 from 'node:http2'
import Joi from 'joi'
import { deletePaymentsByPublishedDate } from '../../services/admin-service.js'

const { constants: httpConstants } = http2

function parseDateFromComponents (day, month, year) {
  if (!day || !month || !year) {
    return null
  }

  const paddedDay = String(day).padStart(2, '0')
  const paddedMonth = String(month).padStart(2, '0')
  return `${year}-${paddedMonth}-${paddedDay}`
}

export const deleteByPublishedDate = [
  {
    method: 'GET',
    path: '/admin/payments/delete-by-published-date',
    options: {
      auth: { scope: ['MPDP.Admin'] }
    },
    handler: async function (_request, h) {
      return h.view('admin/delete-by-published-date', {
        pageTitle: 'Delete Payments by Published Date'
      })
    }
  },
  {
    method: 'POST',
    path: '/admin/payments/delete-by-published-date',
    options: {
      auth: { scope: ['MPDP.Admin'] },
      validate: {
        payload: Joi.object({
          publishedDateDay: Joi.number().integer().min(1).max(31).required(),
          publishedDateMonth: Joi.number().integer().min(1).max(12).required(),
          publishedDateYear: Joi.number().integer().min(2000).max(2100).required(),
          confirm: Joi.string().valid('yes').required()
        }),
        failAction: async function (request, h, error) {
          return h.view('admin/delete-by-published-date', {
            pageTitle: 'Delete Payments by Published Date',
            errorList: error.details.map(detail => ({ text: detail.message })),
            ...request.payload
          }).code(httpConstants.HTTP_STATUS_BAD_REQUEST).takeover()
        }
      },
      handler: async function (request, h) {
        const { publishedDateDay, publishedDateMonth, publishedDateYear } = request.payload
        const publishedDate = parseDateFromComponents(publishedDateDay, publishedDateMonth, publishedDateYear)

        if (!publishedDate) {
          return h.view('admin/delete-by-published-date', {
            pageTitle: 'Delete Payments by Published Date',
            errorList: [{ text: 'Please enter a valid date' }],
            ...request.payload
          }).code(httpConstants.HTTP_STATUS_BAD_REQUEST).takeover()
        }

        const result = await deletePaymentsByPublishedDate(publishedDate)
        return h.view('admin/delete-by-published-date-success', {
          pageTitle: 'Deletion Complete',
          publishedDate,
          result
        })
      }
    }
  }
]
