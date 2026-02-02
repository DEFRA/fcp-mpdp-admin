import { fetchSchemePaymentsByYear } from '../services/fetch-scheme-payments-by-year.js'
import { schemePaymentsByYearModel } from './models/scheme-payments-by-year.js'
import { getRelatedContentLinks } from '../common/utils/related-content.js'

export const schemePaymentsByYear = {
  method: 'GET',
  path: '/scheme-payments-by-year',
  handler: async function (_request, h) {
    const rawSchemePaymentsData = await fetchSchemePaymentsByYear()
    const formattedSchemePaymentsData = await schemePaymentsByYearModel(rawSchemePaymentsData)

    return h.view(
      'scheme-payments-by-year',
      {
        pageTitle: 'Scheme payments by year',
        ...formattedSchemePaymentsData,
        relatedContentLinks: getRelatedContentLinks('scheme-payments-by-year')
      }
    )
  }
}
