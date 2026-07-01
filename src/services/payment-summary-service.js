import http2 from 'node:http2'
import { get } from '../api/get.js'
import { post } from '../api/post.js'
import { buildBackendUrl } from '../api/build-backend-url.js'
import { getBackendAuthHeaders } from '../api/get-backend-auth-headers.js'
import { toViewModel, toApiModel, summariesToViewModel } from './mappers/payment-summary-mapper.js'

const { constants: http2Constants } = http2
const { HTTP_STATUS_OK, HTTP_STATUS_NO_CONTENT } = http2Constants

async function fetchPaymentSummaries () {
  const response = await get('/admin/summary')
  if (!response) {
    return []
  }
  return summariesToViewModel(JSON.parse(response.payload))
}

async function fetchPaymentSummaryById (id) {
  const response = await get(`/admin/summary/${id}`)
  if (!response) {
    return null
  }
  return toViewModel(JSON.parse(response.payload))
}

async function createPaymentSummary (summary) {
  const apiModel = toApiModel(summary)
  const response = await post('/admin/summary', apiModel)
  return toViewModel(JSON.parse(response.payload))
}

async function updatePaymentSummary (id, summary) {
  const backendUrl = buildBackendUrl(`/admin/summary/${id}`)
  const apiModel = toApiModel(summary)
  const response = await fetch(backendUrl, {
    method: 'PUT',
    body: JSON.stringify(apiModel),
    headers: { 'Content-Type': 'application/json', ...await getBackendAuthHeaders() }
  })

  if (response.status !== HTTP_STATUS_OK) {
    throw new Error('Failed to update payment summary')
  }

  return toViewModel(await response.json())
}

async function deletePaymentSummaryById (id) {
  const backendUrl = buildBackendUrl(`/admin/summary/${id}`)
  const response = await fetch(backendUrl, { method: 'DELETE', headers: await getBackendAuthHeaders() })

  if (response.status !== HTTP_STATUS_NO_CONTENT && response.status !== HTTP_STATUS_OK) {
    throw new Error('Failed to delete payment summary')
  }

  return true
}

export {
  fetchPaymentSummaries,
  fetchPaymentSummaryById,
  createPaymentSummary,
  updatePaymentSummary,
  deletePaymentSummaryById
}
