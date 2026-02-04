import http2 from 'node:http2'
import Joi from 'joi'
import { createPayment } from '../../services/admin-service.js'

const { constants: httpConstants } = http2

export const addPayment = [
  {
    method: 'GET',
    path: '/admin/payments/add',
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
      validate: {
        payload: Joi.object({
          payee_name: Joi.string().max(128).required(),
          part_postcode: Joi.string().max(8).required(),
          town: Joi.string().max(128).optional().allow(''),
          parliamentary_constituency: Joi.string().max(64).optional().allow(''),
          county_council: Joi.string().max(128).optional().allow(''),
          scheme: Joi.string().max(64).optional().allow(''),
          amount: Joi.number().required(),
          financial_year: Joi.string().max(8).required(),
          payment_date_day: Joi.number().integer().min(1).max(31).optional().allow(''),
          payment_date_month: Joi.number().integer().min(1).max(12).optional().allow(''),
          payment_date_year: Joi.number().integer().min(1900).max(2100).optional().allow(''),
          scheme_detail: Joi.string().max(128).optional().allow(''),
          activity_level: Joi.string().max(64).optional().allow('')
        }),
        failAction: async function (request, h, error) {
          const errors = {}
          error.details.forEach(detail => {
            const field = detail.path[0]
            errors[field] = detail.message
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
        try {
          const payload = { ...request.payload }

          // Parse date components into a date string
          if (payload.payment_date_day && payload.payment_date_month && payload.payment_date_year) {
            const day = String(payload.payment_date_day).padStart(2, '0')
            const month = String(payload.payment_date_month).padStart(2, '0')
            const year = payload.payment_date_year
            payload.payment_date = `${year}-${month}-${day}`
          } else {
            payload.payment_date = null
          }

          // Remove the component fields
          delete payload.payment_date_day
          delete payload.payment_date_month
          delete payload.payment_date_year

          await createPayment(payload)
          return h.redirect('/admin/payments?success=added')
        } catch (err) {
          return h.view('admin/add-payment', {
            pageTitle: 'Add Payment',
            errorList: [{ text: 'Failed to add payment. Please try again.' }],
            ...request.payload
          }).code(httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR)
        }
      }
    }
  }
]
