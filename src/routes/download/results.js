import http2 from 'node:http2'
import { post } from '../../api/post.js'
import { resultsQuery as query } from '../../routes/queries/results.js'

const { constants: httpConstants } = http2

export const downloadResults = {
  method: 'GET',
  path: '/results/file',
  options: {
    validate: {
      query,
      failAction: async function (_request, h, error) {
        return h
          .response(error.toString())
          .code(httpConstants.HTTP_STATUS_BAD_REQUEST)
          .takeover()
      }
    },
    handler: async function (request, h) {
      const { searchString, schemes, counties, years } = request.query
      const sortBy = decodeURIComponent(request.query.sortBy)

      const filterBy = {
        schemes: typeof schemes === 'string' ? [schemes] : schemes,
        counties: typeof counties === 'string' ? [counties] : counties,
        years: typeof years === 'string' ? [years] : years
      }

      const { payload: content } = await post('/file', { searchString, filterBy, sortBy })

      return h
        .response(content)
        .type('text/csv')
        .header('Content-Disposition', 'attachment; filename="ffc-payment-results.csv"')
    }
  }
}
