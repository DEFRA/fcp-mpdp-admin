import { get } from '../../api/get.js'

export const downloadSchemePaymentsByYear = {
  method: 'GET',
  path: '/scheme-payments-by-year/file',
  handler: async function (_request, h) {
    const content = await get('/summary/file')

    return h
      .response(content?.payload)
      .type('text/csv')
      .header(
        'Content-Disposition',
        'attachment; filename="ffc-payments-by-year.csv"'
      )
  }
}
