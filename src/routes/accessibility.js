import { getRelatedContentLinks } from '../common/utils/related-content.js'

export const accessibility = {
  method: 'GET',
  path: '/accessibility',
  handler: function (request, h) {
    return h.view(
      'accessibility',
      {
        referer: request.headers.referer,
        pageTitle: 'Accessibility statement for Find farm and land payment data',
        relatedContentLinks: getRelatedContentLinks('accessibility')
      }
    )
  }
}
