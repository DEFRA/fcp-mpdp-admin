import { getStream } from '../../api/get-stream.js'

export const downloadAllSchemePaymentData = {
  method: 'GET',
  path: '/all-scheme-payment-data/file',
  handler: async function (_request, h) {
    const stream = await getStream('/file')

    return h
      .response(stream)
      .type('text/csv')
      .header(
        'Content-Disposition',
        'attachment; filename="ffc-payment-data.csv"'
      )
  }
}
