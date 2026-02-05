import http2 from 'node:http2'
import Joi from 'joi'
import { fetchPaymentById, deletePaymentById } from '../../services/admin-service.js'

const { constants: httpConstants } = http2

export const deletePayment = [
  {
    method: 'GET',
    path: '/admin/payments/{id}/delete',
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

        return h.view('admin/delete-payment', {
          pageTitle: 'Delete Payment',
          payment
        })
      }
    }
  },
  {
    method: 'POST',
    path: '/admin/payments/{id}/delete',
    options: {
      validate: {
        params: Joi.object({
          id: Joi.number().integer().positive().required()
        })
      },
      handler: async function (request, h) {
        const { id } = request.params
        await deletePaymentById(id)
        return h.redirect('/admin/payments?success=deleted')
      }
    }
  }
]
