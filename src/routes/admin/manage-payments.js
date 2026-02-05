import Joi from 'joi'
import { fetchAdminPayments } from '../../services/admin-service.js'

export const managePayments = {
  method: 'GET',
  path: '/admin/payments',
  options: {
    validate: {
      query: Joi.object({
        page: Joi.number().integer().positive().default(1),
        searchString: Joi.string().trim().allow('').optional(),
        success: Joi.string().optional()
      })
    },
    handler: async function (request, h) {
      const { page, searchString, success } = request.query
      const limit = 20

      const payments = await fetchAdminPayments(page, limit, searchString)

      return h.view('admin/manage-payments', {
        pageTitle: 'Manage Payments',
        ...payments,
        searchString: searchString || '',
        currentPage: page,
        prevPage: page > 1 ? page - 1 : null,
        nextPage: page < payments.totalPages ? page + 1 : null,
        successParam: success || ''
      })
    }
  }
}
