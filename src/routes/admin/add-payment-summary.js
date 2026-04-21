import Joi from 'joi'
import { createPaymentSummary } from '../../services/payment-summary-service.js'

const addPaymentSummaryRoute = [
  {
    method: 'GET',
    path: '/admin/payment-summary/add',
    options: {
      auth: { scope: ['MPDP.Admin'] }
    },
    handler: async (_request, h) => {
      return h.view('admin/add-payment-summary', {
        pageTitle: 'Add payment summary'
      })
    }
  },
  {
    method: 'POST',
    path: '/admin/payment-summary/add',
    options: {
      auth: { scope: ['MPDP.Admin'] },
      validate: {
        payload: Joi.object({
          financialYear: Joi.string().max(8).required(),
          scheme: Joi.string().max(64).required(),
          totalAmount: Joi.number().required()
        }),
        failAction: async (_request, h, error) => {
          return h.view('admin/add-payment-summary', {
            pageTitle: 'Add payment summary',
            errorMessage: error.message
          }).code(400).takeover()
        }
      }
    },
    handler: async (request, h) => {
      await createPaymentSummary(request.payload)

      return h.redirect('/admin/payment-summary')
    }
  }
]

export { addPaymentSummaryRoute }
