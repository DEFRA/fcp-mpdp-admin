import http2 from 'node:http2'
import { uploadPaymentsCsv } from '../../services/admin-service.js'

const { constants: httpConstants } = http2

export const bulkUpload = [
  {
    method: 'GET',
    path: '/admin/payments/bulk-upload',
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

          return h.view('admin/bulk-upload', {
            pageTitle: 'Bulk Upload Payments',
            successMessage: `Successfully uploaded ${result.imported} payments`,
            uploadResult: result
          })
        } catch (err) {
          return h.view('admin/bulk-upload', {
            pageTitle: 'Bulk Upload Payments',
            errorList: [{ text: `Upload failed: ${err.message}` }]
          }).code(httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR)
        }
      }
    }
  }
]
