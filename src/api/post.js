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
      body: payload != null ? JSON.stringify(payload) : undefined,
      headers: { 'Content-Type': 'application/json', ...headers }
    }).then(async (res) => ({
      res,
      payload: Buffer.from(await res.arrayBuffer())
    }))
  )
}
