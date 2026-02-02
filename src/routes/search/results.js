import http2 from 'node:http2'
import { resultsModel } from '../models/search/results.js'
import { resultsQuery as query } from '../queries/results.js'

const { constants: httpConstants } = http2

export const results = {
  method: 'GET',
  path: '/results',
  options: {
    validate: {
      query,
      failAction: async function (request, h, error) {
        const { searchString, pageId } = request.query

        if (!(searchString?.trim())) {
          return h.view(
            `search/${pageId || 'index'}`,
            {
              pageTitle: 'Search for an agreement holder',
              ...await resultsModel(request, error)
            }
          ).code(httpConstants.HTTP_STATUS_BAD_REQUEST).takeover()
        }

        return h.view(
          'search/index',
          {
            ...request.query,
            errorList: [{ text: error.details[0].message }]
          }).code(httpConstants.HTTP_STATUS_BAD_REQUEST).takeover()
      }
    },
    handler: async function (request, h) {
      const { searchString } = request.query
      request.query.searchString = encodeURIComponent(searchString)
      return h.view('search/results', await resultsModel(request))
    }
  }
}
