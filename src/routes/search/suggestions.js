import Joi from 'joi'
import http2 from 'node:http2'
import { fetchSearchSuggestions } from '../../services/fetch-search-suggestions.js'

const { constants: httpConstants } = http2

export const suggestions = {
  method: 'GET',
  path: '/suggestions',
  options: {
    validate: {
      query: Joi.object({
        searchString: Joi.string().trim().min(3).required()
      }),
      failAction: async function (_request, h, error) {
        return h.response(error.toString()).code(httpConstants.HTTP_STATUS_BAD_REQUEST).takeover()
      }
    },
    handler: async function (request, h) {
      return h.response(await fetchSearchSuggestions(request.query.searchString))
    }
  }
}
