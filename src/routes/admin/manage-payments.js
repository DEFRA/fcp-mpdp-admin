import http2 from 'node:http2'
import Joi from 'joi'
import { fetchAdminPayments } from '../../services/admin-service.js'

const { constants: httpConstants } = http2

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

      try {
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
      } catch (err) {
        request.logger.error(err)
        return h.view('admin/manage-payments', {
          pageTitle: 'Manage Payments',
          count: 0,
          rows: [],
          page: 1,
          totalPages: 0,
          searchString: searchString || '',
          currentPage: page,
          prevPage: null,
          nextPage: null,
          successParam: '',
          errorList: [{ text: 'Failed to load payments. Please try again.' }]
        }).code(httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      }
    }
  }
}
