import Joi from 'joi'
import { fetchPaymentSummaryById, updatePaymentSummary } from '../../services/payment-summary-service.js'

const editSummaryRoute = [
  {
    method: 'GET',
    path: '/admin/summary/edit/{id}',
    handler: async (request, h) => {
      const { id } = request.params
      const summary = await fetchPaymentSummaryById(id)

      return h.view('admin/edit-summary', {
        pageTitle: 'Edit payment summary',
        summary
      })
    }
  },
  {
    method: 'POST',
    path: '/admin/summary/edit/{id}',
    options: {
      validate: {
        payload: Joi.object({
          financialYear: Joi.string().max(8).required(),
          scheme: Joi.string().max(64).required(),
          totalAmount: Joi.number().required()
        }),
        failAction: async (request, h, error) => {
          const { id } = request.params
          const summary = await fetchPaymentSummaryById(id)

          return h.view('admin/edit-summary', {
            pageTitle: 'Edit payment summary',
            summary,
            errorMessage: error.message
          }).code(400).takeover()
        }
      }
    },
    handler: async (request, h) => {
      const { id } = request.params
      const { financialYear, scheme, totalAmount } = request.payload

      await updatePaymentSummary(id, {
        financialYear,
        scheme,
        totalAmount: parseFloat(totalAmount)
      })

      return h.redirect('/admin/summary')
    }
  }
]

export { editSummaryRoute }
