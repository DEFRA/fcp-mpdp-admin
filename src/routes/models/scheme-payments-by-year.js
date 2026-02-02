import { getReadableAmount } from '../../common/utils/get-readable-amount.js'
import { getFinancialYearSummary } from '../../common/utils/get-financial-year-summary.js'

function getFormattedYear (year) {
  return year.split('/').map(x => `20${x}`).join(' to ')
}

function getSchemeSummary (schemePaymentsByYear) {
  let total = 0
  const totalPaymentsBySchemes = []
  const totalPaymentsByYear = {}

  Object.keys(schemePaymentsByYear).forEach(year => {
    const formattedYear = getFormattedYear(year)
    totalPaymentsByYear[formattedYear] = { total: 0 }

    /* eslint-disable camelcase */
    schemePaymentsByYear[year].forEach(({ scheme, total_amount }) => {
      const schemeData = totalPaymentsBySchemes.find(x => x?.name === scheme)
      const schemeAmount = Number(parseFloat(total_amount).toFixed(2))

      if (!schemeData) {
        totalPaymentsBySchemes.push({
          name: scheme,
          total: schemeAmount,
          readableTotal: getReadableAmount(schemeAmount)
        })
      } else {
        schemeData.total = Number((schemeData.total + schemeAmount).toFixed(2))
        schemeData.readableTotal = getReadableAmount(schemeData.total)
      }

      total = Number((total + schemeAmount).toFixed(2))
      totalPaymentsByYear[formattedYear].total += schemeAmount
    })
    /* eslint-enable camelcase */

    totalPaymentsByYear[formattedYear].readableTotal = getReadableAmount(totalPaymentsByYear[formattedYear].total)
  })

  return {
    totalPaymentsBySchemes,
    totalPaymentsByYear,
    readableTotalAmount: getReadableAmount(total)
  }
}

function transformSummary (schemePaymentsByYear) {
  const schemePaymentsSummary = {}

  Object.keys(schemePaymentsByYear).forEach(year => {
    const formattedYear = getFormattedYear(year)
    schemePaymentsSummary[formattedYear] = schemePaymentsByYear[year].map(scheme => ({
      ...scheme, total_amount: getReadableAmount(parseFloat(scheme.total_amount))
    }))
  })

  return schemePaymentsSummary
}

export async function schemePaymentsByYearModel (rawSchemePaymentsByYear) {
  return {
    summary: {
      ...getFinancialYearSummary(Object.keys(rawSchemePaymentsByYear)),
      ...getSchemeSummary(rawSchemePaymentsByYear),
      schemePaymentsByYear: transformSummary(rawSchemePaymentsByYear)
    }
  }
}
