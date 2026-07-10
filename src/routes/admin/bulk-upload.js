import http2 from 'node:http2'
import { uploadPaymentsCsv } from '../../services/admin-service.js'

const { constants: httpConstants } = http2

const CSV_TEMPLATE_HEADERS = 'payee_name,part_postcode,town,parliamentary_constituency,county_council,scheme,amount,financial_year,payment_date,scheme_detail,activity_level\n'

export const bulkUpload = [
  {
    method: 'GET',
    path: '/admin/payments/bulk-upload/template',
    options: {
      auth: { scope: ['MPDP.Admin'] }
    },
    handler: function (_request, h) {
      return h.response(CSV_TEMPLATE_HEADERS)
        .type('text/csv')
        .header('Content-Disposition', 'attachment; filename="fcp-mpdp-upload-template.csv"')
    }
  },
  {
    method: 'GET',
    path: '/admin/payments/bulk-upload',
    options: {
      auth: { scope: ['MPDP.Admin'] }
    },
    handler: async function (_request, h) {
      return h.view('admin/bulk-upload', {
        pageTitle: 'Bulk Upload Payments'
      })
    }
  },
  {
    method: 'POST',
    path: '/admin/payments/bulk-upload',
    options: {
      auth: { scope: ['MPDP.Admin'] },
      payload: {
        parse: true,
        output: 'stream',
        allow: 'multipart/form-data',
        maxBytes: 104857600, // 100MB
        multipart: true
      },
      handler: async function (request, h) {
        try {
          const { file } = request.payload

          if (!file) {
            return h.view('admin/bulk-upload', {
              pageTitle: 'Bulk Upload Payments',
              errorList: [{ text: 'Please select a CSV file to upload' }]
            }).code(httpConstants.HTTP_STATUS_BAD_REQUEST)
          }

          const result = await uploadPaymentsCsv(file)

          request.logger.info({
            message: 'Bulk upload completed',
            event: { action: 'bulk-upload', category: 'admin', outcome: 'success' },
            recordCount: result.imported
          })
          request.metrics.counter('AdminBulkUpload')

          return h.view('admin/bulk-upload', {
            pageTitle: 'Bulk Upload Payments',
            successMessage: `Successfully uploaded ${result.imported} payments`,
            uploadResult: result
          })
        } catch (err) {
          request.logger.info({
            message: 'Bulk upload failed',
            event: { action: 'bulk-upload', category: 'admin', outcome: 'failure' },
            error: { message: err.message }
          })
          return h.view('admin/bulk-upload', {
            pageTitle: 'Bulk Upload Payments',
            errorList: [{ text: `Upload failed: ${err.message}` }]
          }).code(httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR)
        }
      }
    }
  }
]
