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
          payment_date: Joi.date().optional().allow(''),
          scheme_detail: Joi.string().max(128).optional().allow(''),
          activity_level: Joi.string().max(64).optional().allow('')
        }),
        failAction: async function (request, h, error) {
          return h.view('admin/add-payment', {
            pageTitle: 'Add Payment',
            errorList: error.details.map(detail => ({ text: detail.message })),
            ...request.payload
          }).code(httpConstants.HTTP_STATUS_BAD_REQUEST).takeover()
        }
      },
      handler: async function (request, h) {
        try {
          await createPayment(request.payload)
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
