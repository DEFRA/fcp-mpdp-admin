import { buildBackendUrl } from './build-backend-url.js'
import { requestPromise } from './request-promise.js'
import { getBackendAuthHeaders } from './get-backend-auth-headers.js'

export async function get (path) {
  const backendUrl = buildBackendUrl(path)
  const headers = await getBackendAuthHeaders()

  return requestPromise(
    backendUrl,
    fetch(backendUrl, { headers }).then(async (res) => {
      if (!res.ok) {
        const err = new Error(`Backend request failed with status ${res.status}`)
        err.status = res.status
        throw err
      }
      return res.json()
    })
  )
}
