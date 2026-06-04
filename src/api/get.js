import Wreck from '@hapi/wreck'
import { buildBackendUrl } from './build-backend-url.js'
import { requestPromise } from './request-promise.js'
import { getBackendAuthHeaders } from './get-backend-auth-headers.js'

export async function get (path) {
  const backendUrl = buildBackendUrl(path)
  const headers = getBackendAuthHeaders()

  return requestPromise(
    backendUrl,
    Wreck.get(backendUrl, { headers })
  )
}
