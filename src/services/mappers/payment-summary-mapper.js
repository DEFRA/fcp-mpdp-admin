function toViewModel (summary) {
  return {
    id: summary.id,
    financialYear: summary.financial_year,
    scheme: summary.scheme,
    totalAmount: summary.total_amount
  }
}

function toApiModel (summary) {
  return {
    financial_year: summary.financialYear,
    scheme: summary.scheme,
    total_amount: summary.totalAmount
  }
}

function summariesToViewModel (summaries) {
  return summaries.map(toViewModel)
}

export {
  toViewModel,
  toApiModel,
  summariesToViewModel
}
