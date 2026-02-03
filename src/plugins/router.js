import Inert from '@hapi/inert'
import { health } from '../routes/health.js'
import { start } from '../routes/start.js'
import { downloadAllSchemePaymentData } from '../routes/download/all-scheme-payment-data.js'
import { schemePaymentsByYear } from '../routes/scheme-payments-by-year.js'
import { downloadSchemePaymentsByYear } from '../routes/download/scheme-payments-by-year.js'
import { search } from '../routes/search/search.js'
import { suggestions } from '../routes/search/suggestions.js'
import { results } from '../routes/search/results.js'
import { downloadResults } from '../routes/download/results.js'
import { details } from '../routes/details.js'
import { downloadDetails } from '../routes/download/details.js'
import { privacy } from '../routes/privacy.js'
import { cookies } from '../routes/cookies.js'
import { accessibility } from '../routes/accessibility.js'
import { serveStaticFiles } from '../common/helpers/serve-static-files.js'
import { managePayments } from '../routes/admin/manage-payments.js'
import { addPayment } from '../routes/admin/add-payment.js'
import { editPayment } from '../routes/admin/edit-payment.js'
import { deletePayment } from '../routes/admin/delete-payment.js'
import { bulkUpload } from '../routes/admin/bulk-upload.js'
import { deleteByYear } from '../routes/admin/delete-by-year.js'

export const router = {
  plugin: {
    name: 'router',
    async register (server) {
      await server.register([Inert])
      await server.route(health)
      await server.route(start)
      await server.route(downloadAllSchemePaymentData)
      await server.route(schemePaymentsByYear)
      await server.route(downloadSchemePaymentsByYear)
      await server.route(search)
      await server.route(suggestions)
      await server.route(results)
      await server.route(downloadResults)
      await server.route(details)
      await server.route(downloadDetails)
      await server.route(privacy)
      await server.route(cookies)
      await server.route(accessibility)
      await server.route(managePayments)
      await server.route(addPayment)
      await server.route(editPayment)
      await server.route(deletePayment)
      await server.route(bulkUpload)
      await server.route(deleteByYear)
      await server.register([serveStaticFiles])
    }
  }
}
