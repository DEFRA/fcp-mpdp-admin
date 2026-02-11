import { getUrlParams } from '../api/get-url-params.js'
import { get } from '../api/get.js'
import { post } from '../api/post.js'
import Wreck from '@hapi/wreck'
import { buildBackendUrl } from '../api/build-backend-url.js'
import { toViewModel, toApiModel, paymentsToViewModel } from './mappers/payment-mapper.js'

export async function fetchAdminPayments (page = 1, limit = 20, searchString = '') {
  const url = getUrlParams('admin/payments', {
    page,
    limit,
    ...(searchString && { searchString })
  })
  const response = await get(url)
  if (!response) {
    return { count: 0, rows: [], page: 1, totalPages: 0 }
  }
  return paymentsToViewModel(JSON.parse(response.payload))
}

export async function fetchPaymentById (id) {
  const url = getUrlParams(`admin/payments/${id}`)
  const response = await get(url)
  if (!response) {
    return null
  }
  return toViewModel(JSON.parse(response.payload))
}

export async function createPayment (paymentData) {
  const url = getUrlParams('admin/payments')
  const apiModel = toApiModel(paymentData)
  const response = await post(url, apiModel)
  if (!response) {
    throw new Error('Failed to create payment')
  }
  return toViewModel(JSON.parse(response.payload))
}

export async function updatePayment (id, paymentData) {
  const backendUrl = buildBackendUrl(`/admin/payments/${id}`)
  const apiModel = toApiModel(paymentData)
  const { res, payload } = await Wreck.put(backendUrl, {
    payload: JSON.stringify(apiModel),
    headers: { 'Content-Type': 'application/json' }
  })

  if (res.statusCode !== 200) {
    throw new Error('Failed to update payment')
  }

  return toViewModel(JSON.parse(payload))
}

export async function deletePaymentById (id) {
  const backendUrl = buildBackendUrl(`/admin/payments/${id}`)
  const { res, payload } = await Wreck.delete(backendUrl)

  if (res.statusCode !== 200) {
    throw new Error('Failed to delete payment')
  }

  return JSON.parse(payload)
}

export async function fetchFinancialYears () {
  const url = getUrlParams('admin/financial-years')
  const response = await get(url)
  if (!response) {
    return []
  }
  return JSON.parse(response.payload)
}

export async function deletePaymentsByYear (financialYear) {
  const encodedYear = encodeURIComponent(financialYear)
  const backendUrl = buildBackendUrl(`/admin/payments/year/${encodedYear}`)
  const { res, payload } = await Wreck.delete(backendUrl)

  if (res.statusCode !== 200) {
    throw new Error('Failed to delete payments')
  }

  return JSON.parse(payload)
}

export async function deletePaymentsByPublishedDate (publishedDate) {
  const backendUrl = buildBackendUrl(`/admin/payments/published-date/${publishedDate}`)
  const { res, payload } = await Wreck.delete(backendUrl)

  if (res.statusCode !== 200) {
    throw new Error('Failed to delete payments by published date')
  }

  return JSON.parse(payload)
}

export async function uploadPaymentsCsv (fileStream) {
  const backendUrl = buildBackendUrl('/admin/payments/bulk-upload')

  const { res, payload } = await Wreck.post(backendUrl, {
    payload: fileStream,
    headers: { 'Content-Type': 'text/csv' }
  })

  if (res.statusCode !== 201) {
    throw new Error('Failed to upload CSV')
  }

  return JSON.parse(payload)
}

export async function bulkSetPublishedDate (financialYear, publishedDate) {
  const encodedYear = encodeURIComponent(financialYear)
  const backendUrl = buildBackendUrl(`/admin/payments/year/${encodedYear}/published-date`)

  const { res, payload } = await Wreck.put(backendUrl, {
    payload: JSON.stringify({ published_date: publishedDate }),
    headers: { 'Content-Type': 'application/json' }
  })

  if (res.statusCode !== 200) {
    throw new Error('Failed to set published date')
  }

  return JSON.parse(payload)
}
