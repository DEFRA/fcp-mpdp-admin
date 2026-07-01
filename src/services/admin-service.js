import http2 from 'node:http2'
import { getUrlParams } from '../api/get-url-params.js'
import { get } from '../api/get.js'
import { post } from '../api/post.js'
import { buildBackendUrl } from '../api/build-backend-url.js'
import { getBackendAuthHeaders } from '../api/get-backend-auth-headers.js'
import { toViewModel, toApiModel, paymentsToViewModel } from './mappers/payment-mapper.js'

const { constants: http2Constants } = http2
const { HTTP_STATUS_OK, HTTP_STATUS_CREATED } = http2Constants

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
  const response = await fetch(backendUrl, {
    method: 'PUT',
    body: JSON.stringify(apiModel),
    headers: { 'Content-Type': 'application/json', ...await getBackendAuthHeaders() }
  })

  if (response.status !== HTTP_STATUS_OK) {
    throw new Error('Failed to update payment')
  }

  return toViewModel(await response.json())
}

export async function deletePaymentById (id) {
  const backendUrl = buildBackendUrl(`/admin/payments/${id}`)
  const response = await fetch(backendUrl, { method: 'DELETE', headers: await getBackendAuthHeaders() })

  if (response.status !== HTTP_STATUS_OK) {
    throw new Error('Failed to delete payment')
  }

  return response.json()
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
  const response = await fetch(backendUrl, { method: 'DELETE', headers: await getBackendAuthHeaders() })

  if (response.status !== HTTP_STATUS_OK) {
    throw new Error('Failed to delete payments')
  }

  return response.json()
}

export async function deletePaymentsByPublishedDate (publishedDate) {
  const backendUrl = buildBackendUrl(`/admin/payments/published-date/${publishedDate}`)
  const response = await fetch(backendUrl, { method: 'DELETE', headers: await getBackendAuthHeaders() })

  if (response.status !== HTTP_STATUS_OK) {
    throw new Error('Failed to delete payments by published date')
  }

  return response.json()
}

export async function uploadPaymentsCsv (fileStream) {
  const backendUrl = buildBackendUrl('/admin/payments/bulk-upload')
  const chunks = []
  for await (const chunk of fileStream) {
    chunks.push(chunk)
  }

  const response = await fetch(backendUrl, {
    method: 'POST',
    body: Buffer.concat(chunks),
    headers: { 'Content-Type': 'text/csv', ...await getBackendAuthHeaders() }
  })

  if (response.status !== HTTP_STATUS_CREATED) {
    throw new Error('Failed to upload CSV')
  }

  return response.json()
}

export async function bulkSetPublishedDate (financialYear, publishedDate) {
  const encodedYear = encodeURIComponent(financialYear)
  const backendUrl = buildBackendUrl(`/admin/payments/year/${encodedYear}/published-date`)

  const response = await fetch(backendUrl, {
    method: 'PUT',
    body: JSON.stringify({ published_date: publishedDate }),
    headers: { 'Content-Type': 'application/json', ...await getBackendAuthHeaders() }
  })

  if (response.status !== HTTP_STATUS_OK) {
    throw new Error('Failed to set published date')
  }

  return response.json()
}
