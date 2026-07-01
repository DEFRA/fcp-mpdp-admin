import { buildBackendUrl } from './build-backend-url.js'
import { requestPromise } from './request-promise.js'
import { getBackendAuthHeaders } from './get-backend-auth-headers.js'

export async function post (path, payload) {
  const backendUrl = buildBackendUrl(path)
  const headers = await getBackendAuthHeaders()

  return requestPromise(
    backendUrl,
    fetch(backendUrl, {
      method: 'POST',
      body: payload == null ? undefined : JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json', ...headers }
    }).then(async (res) => {
      if (!res.ok) {
        const err = new Error(`Backend request failed with status ${res.status}`)
        err.status = res.status
        throw err
      }
      return res.json()
    })
  )
}
