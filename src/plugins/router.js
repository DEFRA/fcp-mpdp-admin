import Inert from '@hapi/inert'
import { health } from '../routes/health.js'
import { auth } from '../routes/auth.js'
import { start } from '../routes/start.js'
import { serveStaticFiles } from '../common/helpers/serve-static-files.js'
import { managePayments } from '../routes/admin/manage-payments.js'
import { addPayment } from '../routes/admin/add-payment.js'
import { editPayment } from '../routes/admin/edit-payment.js'
import { deletePayment } from '../routes/admin/delete-payment.js'
import { bulkUpload } from '../routes/admin/bulk-upload.js'
import { deleteByYear } from '../routes/admin/delete-by-year.js'
import { deleteByPublishedDate } from '../routes/admin/delete-by-published-date.js'
import { bulkSetPublishedDateRoutes } from '../routes/admin/bulk-set-published-date.js'
import { manageSummariesRoute } from '../routes/admin/manage-summaries.js'
import { addSummaryRoute } from '../routes/admin/add-summary.js'
import { editSummaryRoute } from '../routes/admin/edit-summary.js'
import { deleteSummaryRoute } from '../routes/admin/delete-summary.js'

export const router = {
  plugin: {
    name: 'router',
    async register (server) {
      await server.register([Inert])
      await server.route(health)
      await server.route(auth)
      await server.route(start)
      await server.route(managePayments)
      await server.route(addPayment)
      await server.route(editPayment)
      await server.route(deletePayment)
      await server.route(bulkUpload)
      await server.route(deleteByYear)
      await server.route(deleteByPublishedDate)
      await server.route(bulkSetPublishedDateRoutes)
      await server.route(manageSummariesRoute)
      await server.route(addSummaryRoute)
      await server.route(editSummaryRoute)
      await server.route(deleteSummaryRoute)
      await server.register([serveStaticFiles])
    }
  }
}
