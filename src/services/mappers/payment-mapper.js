export function toViewModel (payment) {
  if (!payment) {
    return null
  }

  return {
    id: payment.id,
    payeeName: payment.payee_name,
    partPostcode: payment.part_postcode,
    town: payment.town || '',
    parliamentaryConstituency: payment.parliamentary_constituency || '',
    countyCouncil: payment.county_council || '',
    scheme: payment.scheme || '',
    amount: payment.amount,
    financialYear: payment.financial_year,
    paymentDate: payment.payment_date,
    schemeDetail: payment.scheme_detail || '',
    activityLevel: payment.activity_level || ''
  }
}

export function toApiModel (viewModel) {
  return {
    payee_name: viewModel.payeeName,
    part_postcode: viewModel.partPostcode,
    town: viewModel.town || '',
    parliamentary_constituency: viewModel.parliamentaryConstituency || '',
    county_council: viewModel.countyCouncil || '',
    scheme: viewModel.scheme || '',
    amount: viewModel.amount,
    financial_year: viewModel.financialYear,
    payment_date: viewModel.paymentDate || null,
    scheme_detail: viewModel.schemeDetail || '',
    activity_level: viewModel.activityLevel || ''
  }
}

export function paymentsToViewModel (paymentsResponse) {
  return {
    count: paymentsResponse.count,
    rows: paymentsResponse.rows.map(toViewModel),
    page: paymentsResponse.page,
    totalPages: paymentsResponse.totalPages
  }
}
