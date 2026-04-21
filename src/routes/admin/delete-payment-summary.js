import Joi from 'joi'
import { fetchPaymentSummaryById, deletePaymentSummaryById } from '../../services/payment-summary-service.js'

const deletePaymentSummaryRoute = [
  {
    method: 'GET',
    path: '/admin/payment-summary/delete/{id}',
    options: {
      auth: { scope: ['MPDP.Admin'] }
    },
    handler: async (request, h) => {
      const { id } = request.params
      const summary = await fetchPaymentSummaryById(id)

      return h.view('admin/delete-payment-summary', {
        pageTitle: 'Delete payment summary',
        summary
      })
    }
  },
  {
    method: 'POST',
    path: '/admin/payment-summary/delete/{id}',
    options: {
      auth: { scope: ['MPDP.Admin'] },
      validate: {
        payload: Joi.object({})
      }
    },
    handler: async (request, h) => {
      const { id } = request.params
      await deletePaymentSummaryById(id)

      return h.redirect('/admin/payment-summary')
    }
  }
]

export { deletePaymentSummaryRoute }
