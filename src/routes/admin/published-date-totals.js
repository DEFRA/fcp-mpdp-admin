import { fetchPublishedDateTotals } from '../../services/admin-service.js'

export const publishedDateTotals = {
  method: 'GET',
  path: '/admin/payments/published-date-totals',
  options: {
    auth: { scope: ['MPDP.Admin'] }
  },
  handler: async (_request, h) => {
    const records = await fetchPublishedDateTotals()

    return h.view('admin/published-date-totals', {
      pageTitle: 'Payment totals by published date',
      records
    })
  }
}
