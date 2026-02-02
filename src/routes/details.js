import Joi from 'joi'
import http2 from 'node:http2'
import { detailsModel } from './models/details.js'
import { getRelatedContentLinks } from '../common/utils/related-content.js'

const { constants: httpConstants } = http2

export const details = {
  method: 'GET',
  path: '/details',
  options: {
    validate: {
      query: Joi.object({
        payeeName: Joi.string().trim().min(1).required(),
        partPostcode: Joi.string().trim().min(1).required(),
        searchString: Joi.string().trim().min(1).required(),
        page: Joi.number().default(1)
      }),
      failAction: async function (request, h, _error) {
        return h.view(
          'search/index',
          {
            ...request.query,
            errorList: [
              {
                text: 'Enter a name or location',
                href: '#search-input'
              }
            ],
            pageTitle: 'Search for an agreement holder',
            relatedContentLinks: getRelatedContentLinks('details')
          }
        ).code(httpConstants.HTTP_STATUS_BAD_REQUEST).takeover()
      }
    },
    handler: async function (request, h) {
      request.query.searchString = encodeURIComponent(request.query.searchString)
      return h.view('details', await detailsModel(request.query))
    }
  }
}
