import { getUrlParams } from '../api/get-url-params.js'
import { get } from '../api/get.js'
import { post } from '../api/post.js'
import Wreck from '@hapi/wreck'
import { buildBackendUrl } from '../api/build-backend-url.js'

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
  return JSON.parse(response.payload)
}

export async function fetchPaymentById (id) {
  const url = getUrlParams(`admin/payments/${id}`)
  const response = await get(url)
  if (!response) {
    return null
  }
  return JSON.parse(response.payload)
}

export async function createPayment (paymentData) {
  const url = getUrlParams('admin/payments')
  const response = await post(url, paymentData)
  if (!response) {
    return null
  }
  return JSON.parse(response.payload)
}

export async function updatePayment (id, paymentData) {
  const backendUrl = buildBackendUrl(`admin/payments/${id}`)
  const { res, payload } = await Wreck.put(backendUrl, {
    payload: JSON.stringify(paymentData),
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (res.statusCode !== 200) {
    throw new Error('Failed to update payment')
  }

  return JSON.parse(payload)
}

export async function deletePaymentById (id) {
  const backendUrl = buildBackendUrl(`admin/payments/${id}`)
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
  const backendUrl = buildBackendUrl(`admin/payments/year/${financialYear}`)
  const { res, payload } = await Wreck.delete(backendUrl)

  if (res.statusCode !== 200) {
    throw new Error('Failed to delete payments')
  }

  return JSON.parse(payload)
}

export async function uploadPaymentsCsv (fileStream) {
  const backendUrl = buildBackendUrl('admin/payments/bulk-upload')
  const { res, payload } = await Wreck.post(backendUrl, {
    payload: fileStream,
    headers: {
      'Content-Type': 'text/csv'
    }
  })

  if (res.statusCode !== 201) {
    throw new Error('Failed to upload CSV')
  }

  return JSON.parse(payload)
}
