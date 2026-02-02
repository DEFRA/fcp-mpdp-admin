import { getRelatedContentLinks } from '../common/utils/related-content.js'

export const start = {
  method: 'GET',
  path: '/',
  handler: function (_request, h) {
    return h.view(
      'start',
      {
        relatedContentLinks: getRelatedContentLinks('start')
      }
    )
  }
}
