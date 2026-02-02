import { getRelatedContentLinks } from '../common/utils/related-content.js'

export const privacy = {
  method: 'GET',
  path: '/privacy',
  handler: function (request, h) {
    return h.view(
      'privacy',
      {
        referer: request.headers.referer,
        pageTitle: 'Privacy notice',
        relatedContentLinks: getRelatedContentLinks('privacy')
      }
    )
  }
}
