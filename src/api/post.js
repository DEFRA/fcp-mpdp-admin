import Wreck from '@hapi/wreck'
import { buildBackendUrl } from './build-backend-url.js'
import { requestPromise } from './request-promise.js'

export async function post (path, payload) {
  const backendUrl = buildBackendUrl(path)

  return requestPromise(
    backendUrl,
    Wreck.post(backendUrl, { payload })
  )
}
