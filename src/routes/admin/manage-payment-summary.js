import { fetchPaymentSummaries } from '../../services/payment-summary-service.js'

const managePaymentSummaryRoute = {
  method: 'GET',
  path: '/admin/payment-summary',
  options: {
    auth: { scope: ['MPDP.Admin'] }
  },
  handler: async (_request, h) => {
    const records = await fetchPaymentSummaries()

    return h.view('admin/manage-payment-summary', {
      pageTitle: 'Payment summary',
      records
    })
  }
}

export { managePaymentSummaryRoute }
