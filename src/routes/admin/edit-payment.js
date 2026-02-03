import http2 from 'node:http2'
import Joi from 'joi'
import { fetchPaymentById, updatePayment } from '../../services/admin-service.js'

const { constants: httpConstants } = http2

export const editPayment = [
  {
    method: 'GET',
    path: '/admin/payments/{id}/edit',
    options: {
      validate: {
        params: Joi.object({
          id: Joi.number().integer().positive().required()
        })
      },
      handler: async function (request, h) {
        const { id } = request.params
        const payment = await fetchPaymentById(id)

        if (!payment) {
          return h.view('errors/404').code(httpConstants.HTTP_STATUS_NOT_FOUND)
        }

        return h.view('admin/edit-payment', {
          pageTitle: 'Edit Payment',
          payment
        })
      }
    }
  },
  {
    method: 'POST',
    path: '/admin/payments/{id}/edit',
    options: {
      validate: {
        params: Joi.object({
          id: Joi.number().integer().positive().required()
        }),
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
          const { id } = request.params
          return h.view('admin/edit-payment', {
            pageTitle: 'Edit Payment',
            payment: { id, ...request.payload },
            errorList: error.details.map(detail => ({ text: detail.message }))
          }).code(httpConstants.HTTP_STATUS_BAD_REQUEST).takeover()
        }
      },
      handler: async function (request, h) {
        const { id } = request.params

        try {
          await updatePayment(id, request.payload)
          return h.redirect('/admin/payments?success=updated')
        } catch (err) {
          return h.view('admin/edit-payment', {
            pageTitle: 'Edit Payment',
            payment: { id, ...request.payload },
            errorList: [{ text: 'Failed to update payment. Please try again.' }]
          }).code(httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR)
        }
      }
    }
  }
]
