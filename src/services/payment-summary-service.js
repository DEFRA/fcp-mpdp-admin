import { get } from '../api/get.js'
import { post } from '../api/post.js'
import Wreck from '@hapi/wreck'
import { buildBackendUrl } from '../api/build-backend-url.js'
import { toViewModel, toApiModel, summariesToViewModel } from './mappers/payment-summary-mapper.js'

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
  const { res, payload } = await Wreck.put(backendUrl, {
    payload: JSON.stringify(apiModel),
    headers: { 'Content-Type': 'application/json' }
  })

  if (res.statusCode !== 200) {
    throw new Error('Failed to update payment summary')
  }

  return toViewModel(JSON.parse(payload))
}

async function deletePaymentSummaryById (id) {
  const backendUrl = buildBackendUrl(`/admin/summary/${id}`)
  const { res } = await Wreck.delete(backendUrl)

  if (res.statusCode !== 204 && res.statusCode !== 200) {
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
