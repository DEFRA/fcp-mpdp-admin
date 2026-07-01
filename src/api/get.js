import { buildBackendUrl } from './build-backend-url.js'
import { requestPromise } from './request-promise.js'
import { getBackendAuthHeaders } from './get-backend-auth-headers.js'

export async function get (path) {
  const backendUrl = buildBackendUrl(path)
  const headers = await getBackendAuthHeaders()

  return requestPromise(
    backendUrl,
    fetch(backendUrl, { headers }).then(async (res) => ({
      res,
      payload: Buffer.from(await res.arrayBuffer())
    }))
  )
}
