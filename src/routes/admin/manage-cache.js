import { invalidateSearchCache } from '../../services/cache-service.js'
import { metricsCounter } from '../../common/helpers/metrics.js'

export const manageCacheRoutes = [
  {
    method: 'GET',
    path: '/admin/cache',
    options: {
      auth: { scope: ['MPDP.Admin'] },
      handler: async (request, h) => {
        const { success } = request.query
        return h.view('admin/manage-cache', {
          pageTitle: 'Manage Search Cache',
          success: success || ''
        })
      }
    }
  },
  {
    method: 'POST',
    path: '/admin/cache/invalidate',
    options: {
      auth: { scope: ['MPDP.Admin'] },
      handler: async (request, h) => {
        try {
          await invalidateSearchCache()

          request.logger.info({
            message: 'Cache invalidated',
            event: { action: 'cache-invalidate', category: 'admin', outcome: 'success' }
          })
          metricsCounter('AdminCacheInvalidate')

          return h.redirect('/admin/cache?success=invalidated')
        } catch (err) {
          request.logger.error(err, 'Failed to invalidate search cache')
          return h.view('admin/manage-cache', {
            pageTitle: 'Manage Search Cache',
            error: true
          })
        }
      }
    }
  }
]
