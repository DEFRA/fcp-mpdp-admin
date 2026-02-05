import Joi from 'joi'
import { fetchPaymentSummaryById, deletePaymentSummaryById } from '../../services/payment-summary-service.js'

const deleteSummaryRoute = [
  {
    method: 'GET',
    path: '/admin/summary/delete/{id}',
    handler: async (request, h) => {
      const { id } = request.params
      const summary = await fetchPaymentSummaryById(id)

      return h.view('admin/delete-summary', {
        pageTitle: 'Delete payment summary',
        summary
      })
    }
  },
  {
    method: 'POST',
    path: '/admin/summary/delete/{id}',
    options: {
      validate: {
        payload: Joi.object({}),
      }
    },
    handler: async (request, h) => {
      const { id } = request.params
      await deletePaymentSummaryById(id)

      return h.redirect('/admin/summary')
    }
  }
]

export { deleteSummaryRoute }
