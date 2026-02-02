import Wreck from '@hapi/wreck'
import { buildBackendUrl } from './build-backend-url.js'
import { logBackendError } from './log-backend-error.js'

export async function getBufferFromUrl (url) {
  try {
    const backendUrl = buildBackendUrl(url)
    const { payload } = await Wreck.get(backendUrl)

    return payload
  } catch (err) {
    logBackendError(err)
    throw err
  }
}
