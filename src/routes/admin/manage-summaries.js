import { fetchPaymentSummaries } from '../../services/payment-summary-service.js'

const manageSummariesRoute = {
  method: 'GET',
  path: '/admin/summary',
  handler: async (_request, h) => {
    const summaries = await fetchPaymentSummaries()

    return h.view('admin/manage-summaries', {
      pageTitle: 'Manage payment summaries',
      summaries
    })
  }
}

export { manageSummariesRoute }
