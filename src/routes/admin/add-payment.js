import http2 from 'node:http2'
import Joi from 'joi'
import { createPayment } from '../../services/admin-service.js'

const { constants: httpConstants } = http2

function parseDateFromComponents (day, month, year) {
  if (!day || !month || !year) {
    return null
  }

  const paddedDay = String(day).padStart(2, '0')
  const paddedMonth = String(month).padStart(2, '0')
  return `${year}-${paddedMonth}-${paddedDay}`
}

export const addPayment = [
  {
    method: 'GET',
    path: '/admin/payments/add',
    options: {
      auth: { scope: ['MPDP.Admin'] }
    },
    handler: async function (_request, h) {
      return h.view('admin/add-payment', {
        pageTitle: 'Add Payment'
      })
    }
  },
  {
    method: 'POST',
    path: '/admin/payments/add',
    options: {
      auth: { scope: ['MPDP.Admin'] },
      validate: {
        payload: Joi.object({
          payeeName: Joi.string().max(128).required(),
          partPostcode: Joi.string().max(8).required(),
          town: Joi.string().max(128).optional().allow(''),
          parliamentaryConstituency: Joi.string().max(64).optional().allow(''),
          countyCouncil: Joi.string().max(128).optional().allow(''),
          scheme: Joi.string().max(64).optional().allow(''),
          amount: Joi.number().required(),
          financialYear: Joi.string().max(8).required(),
          paymentDateDay: Joi.number().integer().min(1).max(31).optional().allow(''),
          paymentDateMonth: Joi.number().integer().min(1).max(12).optional().allow(''),
          paymentDateYear: Joi.number().integer().min(1900).max(2100).optional().allow(''),
          schemeDetail: Joi.string().max(128).optional().allow(''),
          activityLevel: Joi.string().max(64).optional().allow('')
        }),
        failAction: async function (request, h, error) {
          const errors = {}
          error.details.forEach(detail => {
            errors[detail.path[0]] = detail.message
          })

          return h.view('admin/add-payment', {
            pageTitle: 'Add Payment',
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
        const { paymentDateDay, paymentDateMonth, paymentDateYear, ...rest } = request.payload

        const paymentData = {
          ...rest,
          paymentDate: parseDateFromComponents(paymentDateDay, paymentDateMonth, paymentDateYear)
        }

        await createPayment(paymentData)
        return h.redirect('/admin/payments?success=added')
      }
    }
  }
]
